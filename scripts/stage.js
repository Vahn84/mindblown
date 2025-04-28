import { Tile } from './tile.js';
import { logger } from './utilities.js';

export class Stage {
	static PIXI_TILE_PRESETS = {
		BG: {
			visible: true,
			alpha: 1,
		},
		NPC: {
			width: 400,
			height: 800,
			screenWidth: 1920,
			screenHeight: 1080,
			pX: 300,
			pY: 200,
			anchor: 0.5,
			visible: false,
			alpha: 1,
		},
		FOCUS: {
			width: 300,
			height: 600,
			screenWidth: 1920,
			screenHeight: 1080,
			pX: 1000,
			pY: 500,
			anchor: 0.5,
			visible: false,
			alpha: 1,
		},
		VFX: {
			width: 300,
			height: 300,
			screenWidth: 1920,
			screenHeight: 1080,
			pX: 1000,
			pY: 500,
			anchor: 0.5,
			visible: false,
			alpha: 1,
		},
	};

	constructor(bg = null) {
		this.npc = null;
		this.focus = null;
		this.vfx = null;
		if (bg) {
			this.setBg(bg);
		} else {
			this.id = `stage_${new Date().getTime()}`;
		}
		this.weather = null;
	}

	setBg(bg) {
		this.bg = bg;
		let bgNameAsId = bg.id.split('/').pop();
		this.id = `stage_${bgNameAsId}`;
		if (this.bg) {
			this.bg.pixiOptions = Stage.PIXI_TILE_PRESETS.BG;
		}
	}

	setNpc(npc) {
		this.npc = npc;
		if(this.npc) {
			this.npc.pixiOptions = Stage.PIXI_TILE_PRESETS.NPC;
		}
	}

	setFocus(focus) {
		this.focus = focus;
		if(this.focus) {
			this.focus.pixiOptions = Stage.PIXI_TILE_PRESETS.FOCUS;
		}
	}

	setWeather(weather) {
		this.weather = weather;
	}

	setVfx(vfx) {
		this.vfx = vfx;
	}
}
