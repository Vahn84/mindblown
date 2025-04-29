import { Stage } from './stage.js';
import CONFIG from './config.js';
import { IS_GM } from './utilities.js';
import { PIXIHandler } from './pixi-handler.js';
import { logger } from './utilities.js';
import { Tile } from './tile.js';
import { EventEmitter } from './event-emitter.js';
import { MindblownUI } from './mindblown.js';

/**
 * @class StageManager
 * @description Manages the current stage and its properties
 * @property {Stage} stage - The current active stage
 * @property {string} mode - The current mode of the stage (edit/play)
 * @property {PIXI.Application} PIXIApp - The PIXI application instance
 */

export class StageManager extends EventEmitter {
	static EVENTS = {
		BG_ENDED_TRANSITION: 'bgEndedTransion',
		NPC_ENDED_TRANSITION: 'npcEndedTransion',
		FOCUS_ENDED_TRANSITION: 'focusEndedTransion',
		VFX_ENDED_TRANSITION: 'vfxEndedTransion',
	};
	constructor() {
		super();
		this.stage = null;
		this.mode = IS_GM ? CONFIG.MB_MODE.EDIT : CONFIG.MB_MODE.PLAY;
		this.PIXIApp = null;
		this.isBgTransitioning = false;
		this.isNpcTransitioning = false;
		this.isVfxTransitioning = false;
		this.isFocusTransitioning = false;
	}

	static _instance = null;

	static shared() {
		if (!this._instance) {
			this._instance = new this();
			this._instance.getCurrentStageFromCache();
		} else {
			// logger('StageManager already exists', this._instance);
		}
		return this._instance;
	}

	setMode(mode) {
		this.mode = mode;
	}
	getMode() {
		return this.mode;
	}

	getStage() {
		return this.stage;
	}

	initStage(bg) {
		if (bg) {
			this.stage = new Stage(bg);
		} else {
			this.stage = new Stage();
		}

		MindblownUI.getInstance().setToolbarItemsVisibility(
			this.stage ? true : false
		);
	}

	/**
	 * @description Set the current active stage for the stage manager
	 * @param {Stage} _stage - The stage to set
	 * @returns {Stage} - The stage that was set
	 * @memberof StageManager
	 * @method setStage
	 * @example
	 * const stage = new Stage();
	 * const stageManager = StageManager.shared();
	 */
	async setStage(_stage) {
		this.stage = Stage.Build(_stage);
		// this.container = createContainer(this.stage);`
		await this.setBg(this.stage.bg);
		if (this.stage.npc) {
			await this.setNpc(this.stage.npc);
		}
		if (this.stage.focus) {
			await this.setFocus(this.stage.focus);
		}
		if (this.stage.vfx) {
			await this.setVfx(this.stage.vfx);
		}
		if (this.stage.weather) {
			await this.setWeather(this.stage.weather);
		}
		return this.stage;
	}

	async setBg(bg) {
		if (this.stage && this.PIXIApp) {
			this.stage.setBg(bg);
			this.stage.bg.pixiOptions.alpha = 1;
			await PIXIHandler.setBgOnStage(this.PIXIApp, this.stage.bg);
		} else {
			this.initStage(bg);
			if (!this.PIXIApp) {
				const originalWidth = Math.max(
					document.documentElement.clientWidth,
					window.innerWidth || 0
				);
				const originalHeight = Math.max(
					document.documentElement.clientHeight,
					window.innerHeight || 0
				);
				await this.initPIXIApp();
			}
		}

		//SOCKET
		if (IS_GM()) {
			await this.saveStage(this.stage, 'setBg');
		}
	}

	async setNpc(npc) {
		if (!this.stage) {
			this.initStage();
		}
		if (!this.stage.bg) {
			await this.setDefaultBg();
		}
		const currentNpc = structuredClone(this.stage.npc);

		this.stage.setNpc(npc);

		if (
			currentNpc &&
			currentNpc.id !== npc?.id &&
			currentNpc.pixiOptionsRuntime &&
			this.stage.npc
		) {
			this.stage.npc.pixiOptionsRuntime.alpha =
				currentNpc.pixiOptionsRuntime.alpha;
			this.stage.npc.pixiOptionsRuntime.visible =
				currentNpc.pixiOptionsRuntime.visible;
		}
		this.setTileOnStage(Tile.TileType.NPC, this.stage.npc);
		//SOCKET
		if (IS_GM()) {
			await this.saveStage(this.stage, 'setNpc');
		}
	}
	async setFocus(focus) {
		if (!this.stage) {
			this.initStage();
		}
		if (!this.stage.bg) {
			await this.setDefaultBg();
		}
		const currentFocus = structuredClone(this.stage.focus);
		this.stage.setFocus(focus);
		if (
			currentFocus &&
			currentFocus.id !== focus?.id &&
			currentFocus.pixiOptionsRuntime &&
			this.stage.focus
		) {
			this.stage.focus.pixiOptionsRuntime.alpha =
				currentFocus.pixiOptionsRuntime.alpha;
			this.stage.focus.pixiOptionsRuntime.visible =
				currentFocus.pixiOptionsRuntime.visible;
		}
		this.setTileOnStage(Tile.TileType.FOCUS, this.stage.focus);
		//SOCKET
		if (IS_GM()) {
			await this.saveStage(this.stage, 'setFocus');
		}
	}
	async setVfx(vfx) {
		if (!this.stage) {
			this.initStage();
		}
		if (!this.stage.bg) {
			await this.setDefaultBg();
		}

		const currentVfx = structuredClone(this.stage.focus);
		this.stage.setVfx(vfx);

		if (
			currentVfx &&
			currentVfx.id !== vfx?.id &&
			currentVfx.pixiOptionsRuntime &&
			this.stage.vfx
		) {
			this.stage.vfx.pixiOptionsRuntime.alpha =
				currentVfx.pixiOptionsRuntime.alpha;
			this.stage.vfx.pixiOptionsRuntime.visible =
				currentVfx.pixiOptionsRuntime.visible;
		}
		this.setTileOnStage(Tile.TileType.VFX, this.stage.vfx);
		//SOCKET
		if (IS_GM()) {
			await this.saveStage(this.stage, 'setVfx');
		}
	}

	async setWeather(weather) {
		if (!this.stage) {
			this.initStage();
		}
		if (!this.stage.bg) {
			await this.setDefaultBg();
		}
		this.stage.setWeather(weather);
		//SOCKET
		if (IS_GM()) {
			await this.saveStage(this.stage, 'setWeather');
		}
	}

	async getCurrentStageFromCache() {
		const currentStage =
			game.user.flags[CONFIG.MB_MODULE_NAME]?.currentStage;
		if (currentStage) {
			this.setStage(currentStage);
		}
	}

	async initPIXIApp() {
		this.PIXIApp = await PIXIHandler.InitPIXIApp(this.PIXIApp);
		const originalWidth = Math.max(
			document.documentElement.clientWidth,
			window.innerWidth || 0
		);
		const originalHeight = Math.max(
			document.documentElement.clientHeight,
			window.innerHeight || 0
		);
		if (this.stage?.bg) {
			await PIXIHandler.SetupPIXIAppStage(
				this.PIXIApp,
				this.stage.bg,
				originalWidth,
				originalHeight
			);
		}
	}

	async setBgOnStage() {
		if (this.PIXIApp) {
			await PIXIHandler.setBgOnStage(this.PIXIApp, this.stage.bg);
		} else {
			await this.initPIXIApp();
		}
	}

	async setDefaultBg() {
		const defaultBgTile = new Tile(
			`DEFAULT_BG_${new Date().getTime()}`,
			CONFIG.DEFAULT_SPRITE_BG,
			Tile.TileType.BG
		);
		this.stage.setBg(defaultBgTile);
		defaultBgTile.setAlpha(0.5);
		defaultBgTile.setIsDefault(true);
		await this.setBgOnStage();
	}

	async setTileOnStage(tileType, tile) {
		await PIXIHandler.setTileOnStage(this.PIXIApp, tileType, tile);
	}

	async clearBg() {
		if (this.PIXIApp && this.stage) {
			await this.setDefaultBg();
		}
		//SOCKET
		if (IS_GM()) {
			await this.saveStage(this.stage, 'clearBg');
		}
	}

	async clearTile(tileType) {
		if (this.PIXIApp && this.stage) {
			switch (tileType) {
				case Tile.TileType.BG:
					await this.clearBg();
					break;
				case Tile.TileType.NPC:
					await this.setNpc(null);
					break;
				case Tile.TileType.FOCUS:
					await this.setFocus(null);
					break;
				case Tile.TileType.VFX:
					await this.setVfx(null);
					break;
			}
		}
		//SOCKET
		if (IS_GM()) {
			await this.saveStage(this.stage, 'cleartile', tileType);
		}
	}

	async toggleTileVisibility(tileType) {
		if (this.PIXIApp && this.stage) {
			switch (tileType) {
				case Tile.TileType.NPC:
					await PIXIHandler.toggleSpriteVisibility(
						this.PIXIApp,
						this.stage.npc
					);
					this.updateTile(this.stage.npc);
					break;
				case Tile.TileType.FOCUS:
					await PIXIHandler.toggleSpriteVisibility(
						this.PIXIApp,
						this.stage.focus
					);
					this.updateTile(this.stage.focus);
					break;
				case Tile.TileType.VFX:
					await PIXIHandler.toggleSpriteVisibility(
						this.PIXIApp,
						this.stage.vfx
					);
					this.updateTile(this.stage.vfx);
					break;
			}
		}
	}

	async updateTile(tile) {
		if (IS_GM()) {
			await this.saveStage(this.stage, 'updateTile', tile.tileType);
		}
	}

	async updateSpriteFromTile(stage, tileType) {
		if (this.PIXIApp && this.stage) {
			switch (tileType) {
				case Tile.TileType.NPC:
					await this.setNpc(stage.npc);
					break;
				case Tile.TileType.FOCUS:
					await this.setFocus(stage.focus);
					break;
				case Tile.TileType.VFX:
					await this.setVfx(stage.vfx);
					break;
				default:
					break;
			}
		}
	}

	setIsBgTransitioning(isTransitioning) {
		this.isBgTransitioning = isTransitioning;
	}

	setIsNpcTransitioning(isTransitioning) {
		this.isNpcTransitioning = isTransitioning;
	}

	setIsFocusTransitioning(isTransitioning) {
		this.isFocusTransitioning = isTransitioning;
	}
	setIsVfxTransitioning(isTransitioning) {
		this.isVfxTransitioning = isTransitioning;
	}

	async saveStage(stage, action, actionTileType) {
		if (!stage) {
			game.socket.emit(`module.${CONFIG.MOD_NAME}`, {
				action: 'destroy',
				stage: null,
			});
		} else {
			await game.user.setFlag(
				CONFIG.MOD_NAME,
				CONFIG.CURRENT_STAGE,
				stage
			);
			game.socket.emit(`module.${CONFIG.MOD_NAME}`, {
				action,
				stage,
				actionTileType,
			});
		}
	}

	async destroyPIXIApp() {
		//SOCKET
		if (this.PIXIApp) {
			await PIXIHandler.FadeOutAndRemovePIXIApp(this.PIXIApp);
			this.PIXIApp = null;
			this.stage = null;
			this.isBgTransitioning = false;
			this.isNpcTransitioning = false;
			this.isVfxTransitioning = false;
			this.isFocusTransitioning = false;
			this._instance = null;
		}
		this.stage = null;
		await game.user.unsetFlag(CONFIG.MOD_NAME, CONFIG.CURRENT_STAGE);

		//SOCKET
		if (IS_GM()) {
			MindblownUI.getInstance().setToolbarItemsVisibility(false);
			await this.saveStage(null);
		}
	}

	//SOCKET HANDLER

	async SocketSetStageByAction(data) {
		if (IS_GM()) return;
		if (data.action) {
			const stage = data.stage;

			switch (data.action) {
				case 'setBg':
					await this.setBg(stage.bg);
					break;
				case 'setNpc':
					await this.setNpc(stage.npc);
					break;
				case 'setFocus':
					await this.setFocus(stage.focus);
					break;
				case 'setVfx':
					await this.setVfx(stage.vfx);
					break;
				case 'setWeather':
					await this.setWeather(stage.weather);
					break;
				case 'clearBg':
					await this.clearBg();
					break;
				case 'clearTile':
					await this.clearTile(data.actionTileType);
					break;
				case 'toggleTileVisibility':
					await this.toggleTileVisibility(data.actionTileType);
					break;
				case 'updateTile':
					await this.updateSpriteFromTile(stage, data.actionTileType);
					break;
				case 'destroy':
					await this.destroyPIXIApp();
					break;
				default:
					break;
			}

			await game.user.setFlag(
				CONFIG.MOD_NAME,
				CONFIG.CURRENT_STAGE,
				stage
			);
		}
	}
}
