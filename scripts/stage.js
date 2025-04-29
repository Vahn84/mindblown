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
			pY: 280,
			anchor: { x: 0, y: 0 },
			visible: false,
			alpha: 1,
		},
		FOCUS: {
			width: 400,
			height: 400,
			screenWidth: 1920,
			screenHeight: 1080,
			pX: 760,
			pY: 340,
			anchor: { x: 0, y: 0 },
			visible: false,
			alpha: 1,
		},
		VFX: {
			width: 500,
			height: 500,
			screenWidth: 1920,
			screenHeight: 1080,
			pX: 710,
			pY: 290,
			anchor: { x: 0, y: 0 },
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
			this.bg.pixiOptions = structuredClone(Stage.PIXI_TILE_PRESETS.BG);
		}
	}

	setNpc(npc) {
		this.npc = npc;
		if (this.npc) {
			this.npc.pixiOptions = structuredClone(Stage.PIXI_TILE_PRESETS.NPC);
			if (!npc.pixiOptionsRuntime) {
				this.npc.pixiOptionsRuntime = structuredClone(
					Stage.PIXI_TILE_PRESETS.NPC
				);
			}
		}
	}

	setFocus(focus) {
		this.focus = focus;
		if (this.focus) {
			this.focus.pixiOptions = structuredClone(
				Stage.PIXI_TILE_PRESETS.FOCUS
			);
			if (!focus.pixiOptionsRuntime) {
				this.focus.pixiOptionsRuntime = structuredClone(
					Stage.PIXI_TILE_PRESETS.NPC
				);
			}
		}
	}

	setWeather(weather) {
		this.weather = weather;
	}

	setVfx(vfx) {
		this.vfx = vfx;
		if (this.vfx) {
			this.vfx.pixiOptions = structuredClone(Stage.PIXI_TILE_PRESETS.VFX);
			if (!vfx.pixiOptionsRuntime) {
				this.vfx.pixiOptionsRuntime = structuredClone(
					Stage.PIXI_TILE_PRESETS.NPC
				);
			}
			
		}
	}

	static Build(stage) {
		const _stage = new Stage();
		_stage.setBg(stage.bg);
		_stage.setNpc(stage.npc);
		_stage.setFocus(stage.focus);
		_stage.setVfx(stage.vfx);
		_stage.setWeather(stage.weather);
		_stage.id = stage.id;
		return _stage;
	}
}
