import CONFIG from './config.js';
import { Tile } from './tile.js';
import { logger, syncMediaDirectory } from './utilities.js';

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
			case Tile.TyleType.BG:
				this.bgs =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TyleType.BG) || [];
				break;
			case Tile.TyleType.NPC:
				this.npcs =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TyleType.NPC) || [];
				break;
			case Tile.TyleType.FOCUS:
				this.focus =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TyleType.FOCUS) ||
					[];
				break;
			default:
				this.bgs =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TyleType.BG) || [];
				this.npcs =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TyleType.NPC) || [];
				this.focus =
					game.user.getFlag(CONFIG.MOD_NAME, Tile.TyleType.FOCUS) ||
					[];
				break;
		}

		return {
			bgs: this.bgs,
			npcs: this.npcs,
			focus: this.focus,
			tyleTypes: { ...Tile.TyleType },
		};

		logger('MindblownUI getData', this);
	}

	async syncMedias(tileType = null) {
		let dir = CONFIG.BGS_DIR;
		if (tileType) {
			switch (tileType) {
				case Tile.TyleType.BG:
					dir = CONFIG.BGS_DIR;
					break;
				case Tile.TyleType.NPCS:
					dir = CONFIG.NPCS_DIR;
					break;
				case Tile.TyleType.FOCUS:
					dir = CONFIG.FOCUS_DIR;
					break;
			}
			await syncMediaDirectory(dir, tileType);
		} else {
			if (game.settings.get(CONFIG.MOD_NAME, CONFIG.BGS_DIR)) {
				await syncMediaDirectory(CONFIG.BGS_DIR, Tile.TyleType.BG);
			}
			if (game.settings.get(CONFIG.MOD_NAME, CONFIG.NPCS_DIR)) {
				await syncMediaDirectory(CONFIG.NPCS_DIR, Tile.TyleType.NPCS);
			}
			if (game.settings.get(CONFIG.MOD_NAME, CONFIG.FOCUS_DIR)) {
				await syncMediaDirectory(CONFIG.FOCUS_DIR, Tile.TyleType.FOCUS);
			}
		}
	}

	async activateListeners() {
		const $mindblown = $('#mindblown');
		const instance = MindblownUI.getInstance();
		$mindblown.find('.refresher').on('click', async (event) => {
			event.preventDefault();
			if (!event || !event.currentTarget) return;
			const $target = $(event.currentTarget);
			const tileType = $target.attr('data-tyleType');
			console.log(`Clicked on stage: ${tileType}`);
			$target.addClass('fa-spin');
			await instance.syncMedias(tileType);
			await instance.getData(tileType);
			$target.removeClass('fa-spin');
		});
	}
}
