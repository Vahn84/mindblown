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
		AMBIENT_LIGHTING_ON: 'ambientLightingOn',
		AMBIENT_LIGHTING_OFF: 'ambientLightingOff',
		BG_ENDED_RESIZE: 'bgEndedResize',
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
		this.isAmbientLightingOn = false;
	}

	static _instance = null;

	static shared() {
		if (!this._instance) {
			this._instance = new this();
			// this._instance.getCurrentStageFromCache();
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
		const stage = Stage.Build(_stage);
		// this.container = createContainer(this.stage);`
		await this.setBg(stage.bg);
		if (stage.npc) {
			await this.setNpc(stage.npc);
		}
		if (stage.focus) {
			await this.setFocus(stage.focus);
		}
		if (stage.vfx) {
			await this.setVfx(stage.vfx);
		}
		if (stage.weather) {
			await this.setWeather(stage.weather);
		}
		if (stage.lights) {
			this.stage.lights = stage.lights;
		}

		const keyName = IS_GM()
			? CONFIG.HIDDEN_STAGE_FOR_GM
			: CONFIG.HIDDEN_STAGE_FOR_PLAYERS;

		MindblownUI.getInstance().toggleStageVisibility(
			game.settings.get(CONFIG.MOD_NAME, keyName)
		);

		return this.stage;
	}

	async setBg(bg) {
		if (this.stage && this.PIXIApp) {
			this.stage.setBg(bg);
			this.stage.bg.pixiOptions.alpha = 1;
			await this.clearLights();
			await this.clearTile(Tile.TileType.VFX);
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

	async setTile(tileType, tile) {
		let type = tileType.toLowerCase();
		if (!this.stage) {
			this.initStage();
		}
		if (!this.stage.bg) {
			await this.setDefaultBg();
		}

		const currentTile = this.stage[type];
		const isADifferentTile = currentTile?.path !== tile?.path;
		if (currentTile && isADifferentTile) {
			currentTile.initialized = false;
		}

		if (
			currentTile &&
			currentTile.id !== tile?.id &&
			currentTile.pixiOptionsRuntime &&
			this.stage[type]
		) {
			this.stage[type].pixiOptionsRuntime.alpha =
				currentTile.pixiOptionsRuntime.alpha;
			this.stage[type].pixiOptionsRuntime.visible =
				currentTile.pixiOptionsRuntime.visible;
		}

		this.stage[type] = tile;
		if (this.stage[type]) {
			this.stage[type].pixiOptions = structuredClone(
				Stage.PIXI_TILE_PRESETS[tileType]
			);
		}

		await PIXIHandler.setTileOnStage(
			this.PIXIApp,
			tileType,
			tile,
			isADifferentTile
		);
	}

	async setNpc(tile) {
		await this.setTile(Tile.TileType.NPC, tile);
		if (IS_GM()) {
			await this.saveStage(this.stage, 'setNpc');
		}
	}
	async setFocus(tile) {
		await this.setTile(Tile.TileType.FOCUS, tile);
		//SOCKET
		if (IS_GM()) {
			await this.saveStage(this.stage, 'setFocus');
		}
	}
	async setVfx(tile) {
		await this.setTile(Tile.TileType.VFX, tile);
		if (IS_GM()) {
			await this.saveStage(this.stage, 'setNpc');
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

		const originalWidth = Math.max(
			document.documentElement.clientWidth,
			window.innerWidth || 0
		);
		const originalHeight = Math.max(
			document.documentElement.clientHeight,
			window.innerHeight || 0
		);
		PIXIHandler.ToggleWeatherEffectOnStage(
			this.PIXIApp,
			this.stage.weather,
			originalWidth,
			originalHeight
		);

		//SOCKET
		if (IS_GM()) {
			await this.saveStage(this.stage, 'setWeather');
		}
	}

	async toggleAmbientLighting() {
		if (!this.stage || !this.PIXIApp) {
			ui.notifications.error('No stage found');
			return;
		}
		let ambientLightingEnabled = this.isAmbientLightingEnabled();
		if (IS_GM()) {
			ambientLightingEnabled = !ambientLightingEnabled;
			await game.settings.set(
				CONFIG.MOD_NAME,
				CONFIG.AMBIENT_LIGHTING_ENABLED,
				ambientLightingEnabled
			);

			game.socket.emit(`module.${CONFIG.MOD_NAME}`, {
				action: 'toggleAmbientLighting',
				stage: null,
				actionTileType: null,
			});
		}

		if (ambientLightingEnabled) {
			PIXIHandler.turnOnAmbientLighting(this.PIXIApp);
			// await this.setDarknessAndLights();
		} else {
			PIXIHandler.turnOffAmbientLighting(this.PIXIApp);
		}
	}

	async setDarknessAndLights() {
		const darkness = canvas.scene?.environment?.darknessLevel || 0;
		this.setDarkness(darkness);
		if (this.stage.lights && this.stage.lights.length > 0) {
			for (let light of this.stage.lights) {
				await this.addLight(light);
			}
		}
	}

	async clearLights() {
		if (this.stage) {
			this.stage.lights = [];
			if (this.PIXIApp) {
				await PIXIHandler.ClearLightsOnStage(this.PIXIApp);
			}
			if (IS_GM()) {
				await this.saveStage(this.stage, 'setLights');
			}
		}
	}

	async addLight(light = null, isPlacingLight = false) {
		if (!this.stage) {
			this.initStage();
		}
		if (!this.stage.bg) {
			await this.setDefaultBg();
		}
		let _light = light;
		if (!_light) {
			_light = new Tile(
				`${new Date().getTime()}`,
				null,
				Tile.TileType.LIGHT
			);
		}

		if (isPlacingLight) {
			this.stage.addLight(_light);
		}
		if (IS_GM()) {
			await this.saveStage(this.stage, 'setLights');
		}

		await PIXIHandler.addLightSourceOnStage(this.PIXIApp, _light);
	}

	async removeLight(light) {
		this.stage.removeLight(light);

		if (IS_GM()) {
			await this.saveStage(this.stage, 'removeLightFromStage', light);
		}
	}

	async removeLightFromStage(light) {
		if (light && this.stage) {
			this.stage.removeLight(light);
			if (this.PIXIApp) {
				await PIXIHandler.RemoveAmbientLightingLight(
					this.PIXIApp,
					light
				);
			}
		}
	}

	async getLightById(id) {
		return this.stage.getLightById(id);
	}

	async updateLight(light) {
		if (this.stage) {
			this.stage.lights = this.stage.lights.map((l) => {
				if (l.id === light.id) {
					return light;
				}
				return l;
			});
			if (!IS_GM()) {
				await PIXIHandler.UpdateLightOnStage(this.PIXIApp, light);
			} else {
				await this.saveStage(this.stage, 'updateLight', light);
			}
		}
	}

	async setLights(lights) {
		if (!this.stage) {
			this.initStage();
		}
		if (!this.stage.bg) {
			await this.setDefaultBg();
		}
		this.stage.setLights(lights);

		if (this.stage.lights && this.stage.lights.length > 0) {
			for (let light of this.stage.lights) {
				await PIXIHandler.addLightSourceOnStage(this.PIXIApp, light);
			}
		}
	}

	async setFilterEffect(effect) {
		if (this.PIXIApp && this.stage) {
			await PIXIHandler.setFilterEffect(this.PIXIApp, effect);
		}
	}

	async getCurrentStageFromCache() {
		const currentStage = game.settings.get(
			CONFIG.MOD_NAME,
			CONFIG.CURRENT_STAGE
		);
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
		defaultBgTile.pixiOptions.alpha = 0.5;
		defaultBgTile.setIsDefault(true);
		await this.setBgOnStage();
	}

	async setTileOnStage(tileType, tile) {
		await PIXIHandler.setTileOnStage(this.PIXIApp, tileType, tile);
	}

	async setDarkness(darkness) {
		if (this.stage && this.PIXIApp && this.PIXIApp.stage) {
			if (this.isAmbientLightingOn) {
				this.stage.setDarkness(darkness);
				PIXIHandler.setDarknessOnStage(
					this.PIXIApp,
					this.stage.darkness
				);
				if (IS_GM()) {
					await this.saveStage(this.stage, 'setDarkness');
				}
			}
		}
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

	async clearTile(tileType, item = null) {
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
				case Tile.TileType.LIGHT:
					await this.removeLight(item);
					break;
			}
		}
		//SOCKET
		if (IS_GM()) {
			await this.saveStage(this.stage, 'clearTile', tileType);
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

	checkForBgPresets(bg) {
		if (bg.lightsPreset) {
			this.stage.lights = bg.lightsPreset;
		}
		if (bg.vfxPreset) {
			this.stage.vfx = bg.vfxPreset;
			this.setVfx(this.stage.vfx);
		}
	}

	setIsBgTransitioning(isTransitioning) {
		const bgChanged = this.isBgTransitioning && !isTransitioning;
		this.isBgTransitioning = isTransitioning;
		if (bgChanged && this.stage && this.stage.bg && this.PIXIApp) {
			this.checkForBgPresets(this.stage.bg);
		}
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

	setIsAmbientLightingOn(isOn) {
		this.isAmbientLightingOn = isOn;
		if (this.isAmbientLightingOn) {
			this.setDarknessAndLights();
		}
	}

	isAmbientLightingEnabled() {
		return game.settings.get(
			CONFIG.MOD_NAME,
			CONFIG.AMBIENT_LIGHTING_ENABLED
		);
	}

	toggleLayerLock(tileType) {
		if (this.PIXIApp && this.stage) {
			PIXIHandler.ToggleContainerInteractivity(this.PIXIApp, tileType);
		}
	}

	async saveStage(stage, action, actionTileType) {
		logger('saveStage', stage, action, actionTileType);
		if (IS_GM()) {
			if (!stage) {
				await game.settings.set(
					CONFIG.MOD_NAME,
					CONFIG.CURRENT_STAGE,
					null
				);

				game.socket.emit(`module.${CONFIG.MOD_NAME}`, {
					action: 'destroy',
					stage: null,
				});
			} else {
				await game.settings.set(
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
	}

	async saveStagePreset() {
		if (this.stage.bg?.path) {
			let bgTiles = await Tile.GetTilesByType(Tile.TileType.BG);
			bgTiles.map(async (folder, index) => {
				if (folder) {
					let bgTile = folder.tiles.find(
						(tile) => tile.path === this.stage.bg.path
					);
					if (bgTile) {
						bgTile.lightsPreset = this.stage.lights;
						bgTile.vfxPreset = this.stage.vfx;
						this.stage.bg.lightsPreset = this.stage.lights;
						this.stage.bg.vfxPreset = this.stage.vfx;
						await Tile.UpdateTilesByType(Tile.TileType.BG, bgTiles);
						MindblownUI.getInstance().updateList(Tile.TileType.BG);
						ui.notifications.info(
							`Saved ${this.stage.bg.path} as a preset`
						);
					}
				}
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

		//SOCKET
		if (IS_GM()) {
			MindblownUI.getInstance().setToolbarItemsVisibility(false);
			await this.saveStage(null);
		}
	}

	async forceCurrentStage() {
		if (this.stage && this.stage.bg) {
			await this.saveStage(this.stage, 'setStage');
		}
	}

	async toggleStageVisibility(forGM) {
		let keyName = forGM
			? CONFIG.HIDDEN_STAGE_FOR_GM
			: CONFIG.HIDDEN_STAGE_FOR_PLAYERS;
		let toHide = game.settings.get(CONFIG.MOD_NAME, keyName) || false;
		if (IS_GM()) {
			if (!forGM) {
				game.socket.emit(`module.${CONFIG.MOD_NAME}`, {
					action: 'toggleStageVisibility',
					stage: null,
					actionTileType: null,
				});
			} else {
				MindblownUI.getInstance().toggleStageVisibility(toHide);
			}
		} else {
			if (!forGM) {
				MindblownUI.getInstance().toggleStageVisibility(toHide);
			}
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
				case 'setLights':
					await this.setLights(stage.lights);
					break;
				case 'removeLightFromStage':
					await this.removeLightFromStage(data.actionTileType);
					break;
				case 'updateLight':
					await this.updateLight(data.actionTileType);
					break;
				case 'setStage':
					await this.setStage(stage);
					break;
				case 'destroy':
					await this.destroyPIXIApp();
					break;
				case 'toggleStageVisibility':
					await this.toggleStageVisibility();
					break;
				case 'toggleAmbientLighting':
					await this.toggleAmbientLighting();
					break;
				default:
					break;
			}
		}
	}
}
