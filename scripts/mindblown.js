import CONFIG from './config.js';
import { Tile } from './tile.js';
import { logger, syncMediaDirectory } from './utilities.js';
import { StageManger } from './stage-manager.js';

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

	async activateListeners() {
		const $mindblown = $('#mindblown');
		const instance = MindblownUI.getInstance();
		$mindblown.find('.refresher').on('click', async (event) => {
			event.preventDefault();
			if (!event || !event.currentTarget) return;
			const $target = $(event.currentTarget);
			const tileType = $target.attr('data-tileType');
			console.log(`Clicked on stage: ${tileType}`);
			$target.find('i').addClass('fa-spin');
			await instance.syncMedias(tileType);
			await instance.getData(tileType);
			$target.find('i').removeClass('fa-spin');
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
					StageManger.shared().setBg(tile);
					break;
				case Tile.TileType.NPC:
					tile = instance.npcs[category][index];
					StageManger.shared().setNpc(tile);
					break;
				case Tile.TileType.FOCUS:
					tile = instance.focus[category][index];
					StageManger.shared().setFocus(tile);
					break;
				case Tile.TileType.VFX:
					tile = instance.vfxs[category][index];
					StageManger.shared().setVfx(tile);
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
