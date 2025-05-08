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
				this.bgs = this.getFilteredBgs();
				this.allBgs = this.getUnfilteredBgs();
				this.npcs =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TileType.NPC) || [];
				this.focus =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TileType.FOCUS) ||
					[];
				break;
		}

		this.dockReduced =
			game.user.getFlag(CONFIG.MOD_NAME, CONFIG.DOCK_REDUCED) || true;

		this.favouriteBGs =
			game.user.getFlag(CONFIG.MOD_NAME, CONFIG.FAV_CATEGORIES.BG) || [];

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

		this.modeIsFavourite = true;

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
				sandstorm: VFX_TYPES.SANDSTORM,
				thunder: VFX_TYPES.THUNDER,
			},
			activeWeather: StageManager.shared().stage?.weather,
			modeIsFavourite: this.modeIsFavourite,
			favouriteBGs: this.favouriteBGs,
		};

		logger('MindblownUI getData', this);
	}

	getUnfilteredBgs() {
		return game.user.getFlag(CONFIG.MOD_NAME, Tile.TileType.BG) || [];
	}

	getFilteredBgs() {
		const instance = MindblownUI.getInstance();
		const bgs = instance.getUnfilteredBgs();
		const filteredBgs = {};

		let favBgCategories =
			game.user.getFlag(CONFIG.MOD_NAME, CONFIG.FAV_CATEGORIES.BG) || [];

		Object.keys(bgs).map((key) => {
			let isAlreadyFav = favBgCategories.find((cat) => cat === key);
			if (isAlreadyFav) {
				filteredBgs[key] = bgs[key];
			}
		});
		return filteredBgs;
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
		const forceStream = $mindblown.find('.toolbar.forceStream');
		const $weatherToolbar = $mindblown.find('.weatherToolbar');
		if (visible) {
			resetBg.removeClass('hidden');
			endStream.removeClass('hidden');
			forceStream.removeClass('hidden');
			$weatherToolbar
				.find('.weather-button')
				.not('.vfx')
				.removeClass('hidden');
		} else {
			resetBg.addClass('hidden');
			endStream.addClass('hidden');
			forceStream.addClass('hidden');
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
						if ($triggerButton)
							$triggerButton.removeClass('active');
					},
				},
			},
			default: 'confirm',
			close: (html) => {},
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

	async toggleStageVisibility(hidden) {
		const $mbCanvas = $(`#${CONFIG.MB_CANVAS_ID}`);
		if (!$mbCanvas.length) return;
		if (!hidden) {
			$mbCanvas.removeClass('hidden');
		} else {
			$mbCanvas.addClass('hidden');
		}
	}

	async activateListeners() {
		const $mindblown = $('#mindblown');
		const instance = MindblownUI.getInstance();

		const $wrapper = $mindblown.find('#bgsWrapper');
		const $scrollable = $wrapper.find('.accordion-container');
		let currentX = 0;

		// Get the DOM elements instead of jQuery objects
		const wrapperEl = $wrapper.get(0);
		const scrollableEl = $scrollable.get(0);

		if (!wrapperEl || !scrollableEl) return;

		$wrapper.on('wheel', (e) => {
			e.preventDefault();

			// Use deltaY or deltaX depending on mouse wheel direction
			const delta = e.originalEvent.deltaY || e.originalEvent.deltaX || 0;

			const maxScroll = scrollableEl.scrollWidth - wrapperEl.clientWidth;

			currentX = Math.min(Math.max(currentX - delta, -maxScroll), 0);

			$scrollable.css('transform', `translate3d(${currentX}px, 0, 0)`);
		});

		$mindblown
			.find('.accordion-container')
			.on('mouseenter', '.media-item', function (event) {
				const $target = $(event.target);
				const type = $target.data('mediatype');
				const src = $target.data('src');

				let content = '';
				if (type === Tile.MediaType.IMAGE) {
					content = `<img src="${src}" alt="preview">`;
				} else if (type === Tile.MediaType.VIDEO) {
					content = `<video src="${src}" autoplay muted loop></video>`;
				}

				if (content && content.length > 0) {
					let $tooltip = $target.find('.media-tooltip');
					$tooltip.addClass('active').html(content);
				}
			});

		$mindblown
			.find('.accordion-container')
			.on('mousemove', '.media-item', function (event) {
				const $target = $(event.target);
				let $tooltip = $target.find('.media-tooltip');
				logger(
					`MOUSEMOVE - x: ${
						event.pageX
					}, tooltipWidth: ${$tooltip.outerWidth()}, screenWidth: ${
						window.innerWidth
					}`
				);
				if ($tooltip) {
					let left = 15;
					if (
						event.pageX + $tooltip.outerWidth() >
						window.innerWidth
					) {
						left = event.pageX - $tooltip.outerWidth() - 100;
					} else {
						left = event.pageX + 15;
					}

					// $tooltip.css({
					// 	left: left + 'px',
					// });
				}
			});

		$mindblown
			.find('.accordion-container')
			.on('mouseleave', '.media-item', function (event) {
				const $target = $(event.target);

				$target
					.find('.media-tooltip')
					.css({ left: 'auto' })
					.html('')
					.removeClass('active');
			});

		$mindblown.find('.toolbar').on('click', async (event) => {
			event.preventDefault();
			if (!event || !event.currentTarget) return;
			const $target = $(event.currentTarget);

			if ($target.hasClass('refresher')) {
				const tileType = $target.attr('data-tiletype');
				console.log(`Clicked on stage: ${tileType}`);
				$target.find('i').addClass('fa-spin');
				await instance.syncMedias(tileType);
				await instance.getData(tileType);
				$target.find('i').removeClass('fa-spin');
			} else if ($target.hasClass('endStream')) {
				StageManager.shared().destroyPIXIApp();
			} else if ($target.hasClass('forceStream')) {
				StageManager.shared().forceCurrentStage();
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
				const $bgsContainer = $bgsAccordion.find(
					'.accordion-container'
				);
				$focusWrapper.toggleClass('reduced');
				$npcsWrapper.toggleClass('reduced');
				$weatherToolbar.toggleClass('reduced');
				let html = '';
				if (!$bgsAccordion.hasClass('reduced')) {
					let favBgCategories =
						game.user.getFlag(
							CONFIG.MOD_NAME,
							CONFIG.FAV_CATEGORIES.BG
						) || [];
					loadCurrentBgsList(favBgCategories);
					html =
						'<span class="title">MINIMIZE</span>  <i class="fa-solid fa-compress"></i>';
				} else {
					$bgsContainer.empty();
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
				if (effect === VFX_TYPES.THUNDER) {
					StageManager.shared().setFilterEffect(effect);
					return;
				}
				if ($target.hasClass('active')) {
					$target.removeClass('active');
					if (effect !== 'vfx' && effect !== 'lights') {
						StageManager.shared().setWeather(null);
					}
				} else {
					if (effect === 'vfx') {
						instance.openVFXDialog($target);
					} else if (effect === 'lights') {
						StageManager.shared().addLight();
					} else {
						$target.addClass('active');
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

		$mindblown
			.find('.accordion-container')
			.on('click', '.setIsFavourite', async (event) => {
				event.preventDefault();
				if (!event || !event.currentTarget) return;
				const instance = MindblownUI.getInstance();
				const $target = $(event.currentTarget);
				const $tileItem = $target.closest('.accordion-item');
				const category = $tileItem.attr('data-category');
				const isFavouriteFilterActive = $(
					'#bgsWrapper #filterFavourites'
				).hasClass('active');
				let favBgCategories =
					game.user.getFlag(
						CONFIG.MOD_NAME,
						CONFIG.FAV_CATEGORIES.BG
					) || [];
				let isAlreadyFav = favBgCategories.find(
					(cat) => cat === category
				);

				const alreadyActive =
					$target.hasClass('active') && isAlreadyFav;
				const $accordionContainer = $target.closest(
					'.accordion-container'
				);

				if (!alreadyActive) {
					$target.addClass('active');
					favBgCategories.push(category);
				} else {
					$target.removeClass('active');
					tile.isFavourite = false;
					favBgCategories = favBgCategories.filter(
						(cat) => cat !== category
					);
				}

				game.user.setFlag(
					CONFIG.MOD_NAME,
					CONFIG.FAV_CATEGORIES.BG,
					favBgCategories
				);

				loadCurrentBgsList(favBgCategories);
			});

		$mindblown.find(' #filterFavourites').on('click', async (event) => {
			const instance = MindblownUI.getInstance();
			instance.modeIsFavourite = !instance.modeIsFavourite;
			$(event.currentTarget).toggleClass('active');
			let favBgCategories =
				game.user.getFlag(CONFIG.MOD_NAME, CONFIG.FAV_CATEGORIES.BG) ||
				[];
			loadCurrentBgsList(favBgCategories);
		});
		$mindblown
			.find('.accordion-container')
			.on('click', '.mindblown-category', async (event) => {
				event.preventDefault();
				if (!event || !event.currentTarget) return;
				const instance = MindblownUI.getInstance();
				const $target = $(event.currentTarget).closest(
					'li.accordion-item'
				);
				const category = $target.attr('data-category');
				const tileType = $target.attr('data-tiletype');

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
				// const $accordionData = $target.find('.accordion-data');

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

		async function loadCurrentBgsList(favBgCategories) {
			const instance = MindblownUI.getInstance();
			const $accordionContainer = $mindblown.find(
				'ul.accordion-container'
			);

			$accordionContainer.html('');

			const bgs = instance.modeIsFavourite
				? await instance.getFilteredBgs()
				: await instance.getUnfilteredBgs();

			instance.bgs = bgs;

			Object.keys(bgs).map(async (key) => {
				const list = bgs[key];
				logger('key', key);
				logger('list', list);
				if (list.length === 0) return;

				let isAlreadyFav = favBgCategories.find((cat) => cat === key);
				const $accordionHead = $(
					`<div class="accordion-head mindblown-category" style="background: url('${
						list[0]?.thumbnail
					}') center center no-repeat; background-size: cover;"><div class="mindblown-list-title"><span>${key}</span></div><span class="setIsFavourite ${
						isAlreadyFav ? 'active' : ''
					}"><i class="fa-regular fa-star"></i><i class="fa-solid fa-star"></i></span></div>`
				);
				const $accordionItem = $(
					`<li data-category="" data-tiletype="${Tile.TileType.BG}" class="accordion-item"></div>`
				);
				$accordionItem.append($accordionHead);
				const activeCategories =
					(await game.user.getFlag(
						CONFIG.MOD_NAME,
						CONFIG.ACTIVE_CATEGORIES.BG
					)) || [];
				const isActiveCategory = activeCategories.find(
					(categoryName) => categoryName === key
				);

				$accordionItem.attr('data-category', key);

				if (isActiveCategory) {
					$accordionItem.addClass('active');

					const accordionData = document.createElement('div');
					accordionData.classList.add('accordion-data');

					for (const tile of list) {
						accordionData.innerHTML += `
								<div
									class="accordion-data-item media-item"
									style="
									background: url('${tile.thumbnail}') center center no-repeat;
									background-size: cover;
									background-color: black;
									"
									data-tileid="${tile.id}"
									data-category="${key}"
									data-index="${list.indexOf(tile)}"
									data-tiletype="${tile.tileType}"
									data-mediatype="${tile.mediaType}" 
									data-src="${tile.path}"
								><div class="media-tooltip"></div>
								</div>
								`;
					}
					$accordionItem.append(accordionData);
				}
				logger('accordionItem', $accordionItem);
				logger('accordionContainer', $accordionContainer);
				$accordionContainer.append($accordionItem);
			});
		}

		// Function to load the tiles into the accordion item
		async function loadCategoryContent(item, categoryKey, tileType) {
			// Clear previous data

			// Find the tiles from your preloaded data

			const tiles = instance.modeIsFavourite
				? (await instance.getFilteredBgs()) || {}
				: (await instance.getUnfilteredBgs()) || {};

			if (!tiles[categoryKey]) {
				return;
			}
			const accordionData = document.createElement('div');
			accordionData.classList.add('accordion-data');

			for (const tile of tiles[categoryKey]) {
				accordionData.innerHTML += `
						<div
							class="accordion-data-item media-item"
							style="
							background: url('${tile.thumbnail}') center center no-repeat;
							background-size: cover;
							background-color: black;
							"
							data-tileid="${tile.id}"
							data-category="${categoryKey}"
							data-index="${tiles[categoryKey].indexOf(tile)}"
							data-tiletype="${tileType}"
							data-mediatype="${tile.mediaType}" 
							data-src="${tile.path}"
						><div class="media-tooltip"></div>
						</div>
						`;

				$(item).append(accordionData);
			}
		}
	}
}
