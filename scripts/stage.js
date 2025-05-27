import { Light } from './light.js';
import { defaultIlluminationShader } from './shaders.js';
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
			DEFAULT: {
				blendMode: PIXI.BLEND_MODES.ADD,
				radius: 256,
				color: '#000000',
				colorIntensity: 0.4,
				type: Light.TYPE.none,
				baseScale: 1,
				screenWidth: 1920,
				screenHeight: 1080,
				bgWidth: 1920,
				bgHeight: 1080,
				bgPosX: 0,
				bgPosY: 0,
				enableColor: true,
				pX: 0.5,
				pY: 0.5,
				anchor: { x: 0, y: 0 },
				visible: true,
				alpha: 1,
			},
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
		this.darkness = 0;
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

	addVfx(vfx) {
		if (vfx) {
			if (!vfx.pixiOptions) {
				vfx.pixiOptions = structuredClone(Stage.PIXI_TILE_PRESETS.VFX);
			}
			if (!vfx.pixiOptionsRuntime) {
				vfx.pixiOptionsRuntime = structuredClone(
					Stage.PIXI_TILE_PRESETS.VFX
				);
			}
		}

		this.vfx.push(vfx);
	}

	setVfxs(vfxs) {
		this.vfx = vfxs;
		if (this.vfx) {
			this.vfx.forEach((vfx) => {
				if (!vfx.pixiOptions) {
					vfx.pixiOptions = structuredClone(
						Stage.PIXI_TILE_PRESETS.VFX
					);
				}
				if (!vfx.pixiOptionsRuntime) {
					vfx.pixiOptionsRuntime = structuredClone(
						Stage.PIXI_TILE_PRESETS.VFX
					);
				}
			});
		}
	}

	removeVfx(vfx) {
		if (vfx) {
			this.vfx = this.vfx.filter((v) => v.id !== vfx.id);
		}
	}

	getVfxById(id) {
		if (this.vfx) {
			const filter = this.vfx.filter((v) => v.id === id);
			return filter.length > 0 ? filter[0] : null;
		}
		return null;
	}

	addLight(light) {
		if (light) {
			if (!light.pixiOptions) {
				light.pixiOptions = structuredClone(
					Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT
				);
			}
			if (!light.pixiOptionsRuntime) {
				light.pixiOptionsRuntime = structuredClone(
					Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT
				);
			}
		}

		this.lights.push(light);
	}

	setLights(lights) {
		this.lights = lights;
		if (this.lights) {
			this.lights.forEach((light) => {
				if (!light.pixiOptions) {
					light.pixiOptions = structuredClone(
						Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT
					);
				}
				if (!light.pixiOptionsRuntime) {
					light.pixiOptionsRuntime = structuredClone(
						Stage.PIXI_TILE_PRESETS.LIGHT.DEFAULT
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
			const filter = this.lights.filter((l) => l.id === id);
			return filter.length > 0 ? filter[0] : null;
		}
		return null;
	}

	setDarkness(darkness) {
		this.darkness = darkness;
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
