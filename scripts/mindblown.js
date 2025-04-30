import CONFIG from './config.js';
import { Tile } from './tile.js';
import { logger, syncMediaDirectory } from './utilities.js';
import { VFX_TYPES } from './effects.js';
import { StageManager } from './stage-manager.js';

export class MindblownUI extends FormApplication {
	constructor(...args) {
		super(...args);
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: CONFIG.MOD_NAME,
			title: CONFIG.MOD_NAME.toLocaleUpperCase(),
			userId: game.userId,
			popOut: false,
			template: CONFIG.TEMPLATES.MINDBLOWN,
		});
	}

	static getInstance() {
		if (!this._instance) {
			this._instance = new this();
		}
		return this._instance;
	}

	static renderSingleton() {
		const instance = this.getInstance();

		// Toggle window
		if (instance._state === Application.RENDER_STATES.RENDERED) {
			instance.close();
		} else {
			instance.render(true);
			instance.getData();
			instance.activateListeners();
		}
	}

	getData(tileType = null) {
		switch (tileType) {
			case Tile.TileType.BG:
				this.bgs =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TileType.BG) || [];

				break;
			case Tile.TileType.NPC:
				this.npcs =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TileType.NPC) || [];
				break;
			case Tile.TileType.FOCUS:
				this.focus =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TileType.FOCUS) ||
					[];
				break;
			default:
				this.bgs =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TileType.BG) || [];
				this.npcs =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TileType.NPC) || [];
				this.focus =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TileType.FOCUS) ||
					[];
				break;
		}

		this.dockReduced =
			game.user.getFlag(CONFIG.MOD_NAME, CONFIG.DOCK_REDUCED) || true;

		this.activeCategories = {
			[Tile.TileType.BG]:
				game.user.getFlag(
					CONFIG.MOD_NAME,
					CONFIG.ACTIVE_CATEGORIES.BG
				) || [],
			[Tile.TileType.NPC]:
				game.user.getFlag(
					CONFIG.MOD_NAME,
					CONFIG.ACTIVE_CATEGORIES.NPC
				) || [],
			[Tile.TileType.FOCUS]:
				game.user.getFlag(
					CONFIG.MOD_NAME,
					CONFIG.ACTIVE_CATEGORIES.FOCUS
				) || [],
		};

		return {
			bgs: this.bgs,
			npcs: this.npcs,
			focus: this.focus,
			tileType: Tile.TileType,
			activeCategories: this.activeCategories,
			dockExpanded: !this.dockReduced,
			hasStage: StageManager.shared().stage ? true : false,
			weather: {
				rain: VFX_TYPES.RAIN,
				snow: VFX_TYPES.SNOW,
				fog: VFX_TYPES.SWIRLING_FOG,
			},
		};

		logger('MindblownUI getData', this);
	}

	async syncMedias(tileType = null) {
		let dir = CONFIG.BGS_DIR;
		if (tileType) {
			switch (tileType) {
				case Tile.TileType.BG:
					dir = CONFIG.BGS_DIR;
					break;
				case Tile.TileType.NPC:
					dir = CONFIG.NPCS_DIR;
					break;
				case Tile.TileType.FOCUS:
					dir = CONFIG.FOCUS_DIR;
					break;
			}
			await syncMediaDirectory(dir, tileType);
		} else {
			if (game.settings.get(CONFIG.MOD_NAME, CONFIG.BGS_DIR)) {
				await syncMediaDirectory(CONFIG.BGS_DIR, Tile.TileType.BG);
			}
			if (game.settings.get(CONFIG.MOD_NAME, CONFIG.NPCS_DIR)) {
				await syncMediaDirectory(CONFIG.NPCS_DIR, Tile.TileType.NPC);
			}
			if (game.settings.get(CONFIG.MOD_NAME, CONFIG.FOCUS_DIR)) {
				await syncMediaDirectory(CONFIG.FOCUS_DIR, Tile.TileType.FOCUS);
			}
		}
	}

	async toggleOpenedCategory(category, tileType) {
		const instance = MindblownUI.getInstance();
		instance.activeCategories[tileType].find((cat) => cat === category)
			? instance.activeCategories[tileType].splice(
					instance.activeCategories[tileType].indexOf(category),
					1
			  )
			: instance.activeCategories[tileType].push(category);
		await game.user.setFlag(
			CONFIG.MOD_NAME,
			CONFIG.ACTIVE_CATEGORIES[tileType],
			instance.activeCategories[tileType]
		);
		logger(
			'MindblownUI toggleOpenedCategory',
			category,
			tileType,
			instance.activeCategories[tileType]
		);
	}

	setToolbarItemsVisibility(visible) {
		const instance = MindblownUI.getInstance();
		if (instance._state !== Application.RENDER_STATES.RENDERED) return;
		const $mindblown = $('#mindblown');
		const resetBg = $mindblown.find('.toolbar.resetBg');
		const endStream = $mindblown.find('.toolbar.endStream');
		const $weatherToolbar = $mindblown.find('.weatherToolbar');
		if (visible) {
			resetBg.removeClass('hidden');
			endStream.removeClass('hidden');
			$weatherToolbar
				.find('.weather-button')
				.not('.vfx')
				.removeClass('hidden');
		} else {
			resetBg.addClass('hidden');
			endStream.addClass('hidden');
			$weatherToolbar
				.find('.weather-button')
				.not('.vfx')
				.addClass('hidden');
		}
	}

	openVFXDialog($triggerButton) {
		let inputValue = '';

		const dialog = new Dialog({
			title: 'Add VFX Tile',
			content: `
			<form>
			  <div class="form-group">
				<input type="text" id="vfx-path" name="vfx-path" style="width:100%;" placeholder="Vfx Path"/>
			  </div>
			</form>
		  `,
			buttons: {
				openDB: {
					label: 'Browse DB',
					icon: '<i class="fas fa-server"></i>',
					callback: () => {
						Sequencer.DatabaseViewer.show();
					},
				},
				confirm: {
					label: 'Confirm',
					icon: '<i class="fas fa-check"></i>',
					callback: async (html) => {
						const path = html.find('#vfx-path').val();
						console.log('Creating VFX Tile with path:', path);

						let fileName = path.split('/').pop();
						StageManager.shared().setVfx(
							new Tile(fileName, path, Tile.TileType.VFX)
						);
					},
				},
				cancel: {
					label: 'Cancel',
					icon: '<i class="fas fa-times"></i>',
					callback: () => {
						if ($triggerButton) $triggerButton.removeClass('active');
					},
				},
			},
			default: 'confirm',
			close: (html) => {
	
			},
			render: (html) => {
				const confirmButton = html.find(
					'button[data-button="confirm"]'
				);
				const input = html.find('#vfx-path');

				function validateInput() {
					const value = input.val();
					const isValid =
						value.endsWith('.mp4') || value.endsWith('.webm');
					confirmButton.prop('disabled', !isValid);
				}

				input.on('input', validateInput);
				validateInput();
			},
		});

		dialog.render(true);
	}

	async activateListeners() {
		const $mindblown = $('#mindblown');
		const instance = MindblownUI.getInstance();
		$mindblown.find('.toolbar').on('click', async (event) => {
			event.preventDefault();
			if (!event || !event.currentTarget) return;
			const $target = $(event.currentTarget);

			if ($target.hasClass('refresher')) {
				const tileType = $target.attr('data-tileType');
				console.log(`Clicked on stage: ${tileType}`);
				$target.find('i').addClass('fa-spin');
				await instance.syncMedias(tileType);
				await instance.getData(tileType);
				$target.find('i').removeClass('fa-spin');
			} else if ($target.hasClass('endStream')) {
				StageManager.shared().destroyPIXIApp();
			} else if ($target.hasClass('resetBg')) {
				StageManager.shared().clearBg();
			} else if ($target.hasClass('toggleReduce')) {
				const $bgsAccordion = $target.closest(
					'.horizontal-accordion-one.mindblown-bgs'
				);

				$bgsAccordion.toggleClass('reduced');
				const $focusWrapper = $mindblown.find('#focusWrapper');
				const $npcsWrapper = $mindblown.find('#npcsWrapper');
				const $weatherToolbar = $mindblown.find('.weatherToolbar');
				$focusWrapper.toggleClass('reduced');
				$npcsWrapper.toggleClass('reduced');
				$weatherToolbar.toggleClass('reduced');
				let html = '';
				if (!$bgsAccordion.hasClass('reduced')) {
					html =
						'<span class="title">MINIMIZE</span>  <i class="fa-solid fa-compress"></i>';
				} else {
					html =
						'<span class="title">EXPAND</span>  <i class="fa-solid fa-expand"></i>';
				}
				$target.html(html);
				game.user.setFlag(
					CONFIG.MOD_NAME,
					CONFIG.DOCK_REDUCED,
					$bgsAccordion.hasClass('reduced')
				);
			}
		});

		$mindblown.find('.mindblown-panel-toggle').on('click', function () {
			const panelContainer = $(this).closest(
				'.mindblown-panel-container'
			);
			panelContainer.toggleClass('closed open');
		});
		$mindblown
			.find('.mindblown-panel-container')
			.on('click', '.mindblown-grid-item', function (event) {
				showOnStage(event);
			});
		$mindblown
			.find('.mindblown-list-header')
			.on('click', '.weather-button', function (event) {
				event.preventDefault();
				const $target = $(event.currentTarget);
				const effect = $target.attr('data-effect');
				if ($target.hasClass('active')) {
					$target.removeClass('active');
					if (effect === 'vfx') {
						StageManager.shared().setVfx(null);
					} else {
						StageManager.shared().setWeather(null);
					}
				} else {
					if (effect === 'vfx') {
						instance.openVFXDialog($target);
					} else {
						StageManager.shared().setWeather(effect);
					}
				}
			});

		// Handle accordion click
		$mindblown
			.find('.mindblown-panel-container')
			.on('click', '.mindblown-accordion-head', async function (event) {
				event.preventDefault();
				const head = $(event.currentTarget);
				const item = head.closest('.mindblown-accordion-item');
				const tileType = item.attr('data-tileType');
				const category = item.attr('data-category');

				if (item.hasClass('open')) {
					// Close
					item.removeClass('open');
					item.find('.mindblown-accordion-body').remove();
					instance.toggleOpenedCategory(category, tileType);
				} else {
					// Open current
					item.addClass('open');

					// Lazy load images if not already loaded

					const key =
						tileType === Tile.TileType.BG
							? 'bgs'
							: tileType === Tile.TileType.NPC
							? 'npcs'
							: tileType === Tile.TileType.FOCUS
							? 'focus'
							: 'vfxs';
					const tiles = instance[key][category] || [];

					const grid = $('<div class="mindblown-grid"></div>');

					tiles.forEach((tile, index) => {
						const gridItem = $(`
						<div class="mindblown-grid-item"
							style="background-image: url('${tile.thumbnail}'); background-position: top center"
							data-tileId="${tile.id}"
							data-category="${category}"
							data-index="${index}"
							data-tileType="${tileType}">
						</div>
					`);

						grid.append(gridItem);
					});

					const body = $(
						'<div class="mindblown-accordion-body"></div>'
					);
					body.append(grid);
					item.append(body);
					instance.toggleOpenedCategory(category, tileType);
				}
			});

		$mindblown.find('.mindblown-category').on('click', async (event) => {
			event.preventDefault();
			if (!event || !event.currentTarget) return;
			const instance = MindblownUI.getInstance();
			const $target = $(event.currentTarget).closest('li.accordion-item');
			const category = $target.attr('data-category');
			const tileType = $target.attr('data-tileType');

			const alreadyActive = $target.hasClass('active');

			if (!alreadyActive) {
				$target.addClass('active');
				loadCategoryContent($target, category, tileType);
			} else {
				$target.removeClass('active');
				let accData = $target.find('.accordion-data');
				logger('accData', accData);
				if (accData.length) {
					for (const element of accData) {
						element.remove();
					}
				}
			}

			await instance.toggleOpenedCategory(category, tileType);
		});

		$mindblown
			.find('.accordion-container')
			.on('click', '.accordion-data-item', async (event) => {
				showOnStage(event);
			});

		async function showOnStage(event) {
			const $target = $(event.currentTarget);
			const category = $target.attr('data-category');
			const tileId = $target.attr('data-tileId');
			const index = $target.attr('data-index');
			const tileType = $target.attr('data-tileType');
			const instance = MindblownUI.getInstance();
			let tile = null;
			switch (tileType) {
				case Tile.TileType.BG:
					tile = instance.bgs[category][index];
					StageManager.shared().setBg(tile);
					break;
				case Tile.TileType.NPC:
					tile = instance.npcs[category][index];
					StageManager.shared().setNpc(tile);
					break;
				case Tile.TileType.FOCUS:
					tile = instance.focus[category][index];
					StageManager.shared().setFocus(tile);
					break;
				case Tile.TileType.VFX:
					tile = instance.vfxs[category][index];
					StageManager.shared().setVfx(tile);
					break;
				default:
					break;
			}
		}

		// Function to load the tiles into the accordion item
		async function loadCategoryContent(item, categoryKey, tileType) {
			// Clear previous data

			// Find the tiles from your preloaded data
			const key =
				tileType === Tile.TileType.BG
					? 'bgs'
					: tileType === Tile.TileType.NPC
					? 'npcs'
					: tileType === Tile.TileType.FOCUS
					? 'focus'
					: 'vfxs';
			const tiles = instance[key][categoryKey] || [];

			const accordionData = document.createElement('div');
			accordionData.classList.add('accordion-data');

			for (const tile of tiles) {
				accordionData.innerHTML += `
						<div
							class="accordion-data-item"
							style="
							background: url('${tile.thumbnail}') center center no-repeat;
							background-size: cover;
							background-color: black;
							"
							data-tileId="${tile.id}"
							data-category="${categoryKey}"
							data-index="${tiles.indexOf(tile)}"
							data-tileType="${tileType}"
						></div>
						`;

				$(item).append(accordionData);
			}
		}
	}
}
