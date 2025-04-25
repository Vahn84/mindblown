import { Stage } from './stage.js';
import CONFIG from './config.js';
import { IS_GM } from './utilities.js';
import { PIXIHandler } from './pixi-handler.js';
import { logger } from './utilities.js';

/**
 * @class StageManger
 * @description Manages the current stage and its properties
 * @property {Stage} stage - The current active stage
 * @property {string} mode - The current mode of the stage (edit/play)
 * @property {PIXI.Application} PIXIApp - The PIXI application instance
 */

export class StageManger {
	constructor() {
		this.stage = null;
		this.mode = IS_GM ? CONFIG.MB_MODE.EDIT : CONFIG.MB_MODE.PLAY;
		this.PIXIApp = null;
	}

	static _instance = null;

	static shared() {
		if (!this._instance) {
			this._instance = new this();
		} else {
			logger('StageManger already exists', this._instance);
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

	/**
	 * @description Set the current active stage for the stage manager
	 * @param {Stage} _stage - The stage to set
	 * @returns {Stage} - The stage that was set
	 * @memberof StageManger
	 * @method setStage
	 * @example
	 * const stage = new Stage();
	 * const stageManager = StageManger.shared();
	 */
	setStage(_stage) {
		this.stage = _stage;
		// this.container = createContainer(this.stage);`
		return this.stage;
	}

	getCurrentStage() {
		return this.stage;
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
		PIXIHandler.SetupPIXIAppStage(
			this.PIXIApp,
			this.stage.bg,
			originalWidth,
			originalHeight
		);
	}
}
