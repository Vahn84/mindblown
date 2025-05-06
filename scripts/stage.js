import { Tile } from './tile.js';
import { logger } from './utilities.js';

export class Stage {
	static PIXI_TILE_PRESETS = {
		BG: {
			visible: true,
			alpha: 1,
		},
		NPC: {
			width: 800,
			height: 1300,
			screenWidth: 3008,
			screenHeight: 1692,
			pX: 500,
			pY: 392,
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
		LIGHT: {
			shape: 'circle',
			blendMode: PIXI.BLEND_MODES.ADD,
			radius: 256,
			color: 0xffffff,
			animated: 'pulse',
			baseScale: 1,
			screenWidth: 1920,
			screenHeight: 1080,
			pX: 960,
			pY: 540,
			anchor: { x: 0, y: 0 },
			visible: false,
			alpha: 0.3,
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
		this.lights = [];
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
					Stage.PIXI_TILE_PRESETS.FOCUS
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
					Stage.PIXI_TILE_PRESETS.VFX
				);
			}
		}
	}

	addLight(light) {
		if (light) {
			light.pixiOptions = structuredClone(Stage.PIXI_TILE_PRESETS.LIGHT);
			if (!light.pixiOptionsRuntime) {
				light.pixiOptionsRuntime = structuredClone(
					Stage.PIXI_TILE_PRESETS.LIGHT
				);
			}
		}

		this.lights.push(light);
	}

	setLights(lights) {
		this.lights = lights;
		if (this.lights) {
			this.lights.forEach((light) => {
				light.pixiOptions = structuredClone(
					Stage.PIXI_TILE_PRESETS.LIGHT
				);
				if (!light.pixiOptionsRuntime) {
					light.pixiOptionsRuntime = structuredClone(
						Stage.PIXI_TILE_PRESETS.LIGHT
					);
				}
			});
		}
	}

	removeLight(light) {
		if (light) {
			this.lights = this.lights.filter((l) => l.id !== light.id);
		}
	}
	getLightById(id) {
		if (this.lights) {
			return this.lights.filter((l) => l.id !== id);
		}
	}

	static Build(stage) {
		const _stage = new Stage();
		_stage.setBg(stage.bg);
		_stage.setNpc(stage.npc);
		_stage.setFocus(stage.focus);
		_stage.setVfx(stage.vfx);
		_stage.setWeather(stage.weather);
		_stage.setLights(stage.lights);
		_stage.id = stage.id;
		return _stage;
	}
}
