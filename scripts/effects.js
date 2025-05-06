import { logger } from './utilities.js';
import CONFIG from './config.js';

export const VFX_TYPES = {
	WARP: 'warp',
	WARP_CLOUDS: 'warp_clouds',
	STARS: 'stars',
	SWIRLING_FOG: 'swirling_fog',
	SANDSTORM: 'sandstorm',
	THUNDER: 'thunder',
	SNOW: 'snow',
	CAMPFIRE: 'campfire',
	RAIN: 'rain',
	LIGHT: 'light',
};

export class VFX {
	static EFFECT_KINDS = {
		WEATHER_EFFECT: 'weather',
		ITEM_EFFECT: 'item_effect',
	};
	static async initEffect(effect) {
		const response = await fetch(
			`./modules/${CONFIG.MOD_NAME}/assets/${effect}.json`
		);
		const json = await response.json();
		return json;
	}
	static async warp() {
		const textures = [
			`modules/${CONFIG.MOD_NAME}/assets/textures/flare.png`,
		];
		return {
			emitterConfig: await VFX.initEffect(VFX_TYPES.WARP),
			textures,
		};
	}
	static async warp_clouds() {
		const textures = [
			`modules/${CONFIG.MOD_NAME}/assets/textures/water.png`,
		];
		return {
			emitterConfig: await VFX.initEffect(VFX_TYPES.WARP_CLOUDS),
			textures,
		};
	}
	static async light() {
		const textures = [
			`modules/${CONFIG.MOD_NAME}/assets/textures/flare.png`,
		];
		return {
			emitterConfig: await VFX.initEffect(VFX_TYPES.LIGHT),
			textures,
		};
	}
	static async stars() {
		return {
			emitterConfig: await VFX.initEffect(VFX_TYPES.STARS),
			textures,
		};
	}
	static async swirling_fog() {
		const textures = [
			`modules/${CONFIG.MOD_NAME}/assets/textures/water.png`,
		];
		return {
			emitterConfig: await VFX.initEffect(VFX_TYPES.SWIRLING_FOG),
			textures,
		};
	}
	static async sandstorm() {
		const textures = [
			`modules/${CONFIG.MOD_NAME}/assets/textures/smoke3.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/smoke4.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/smoke5.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/smoke6.png`,
		];
		return {
			emitterConfig: await VFX.initEffect(VFX_TYPES.SANDSTORM),
			textures,
		};
	}
	static async snow() {
		const textures = [
			`modules/${CONFIG.MOD_NAME}/assets/textures/snowflake.png`,
		];
		return {
			emitterConfig: await VFX.initEffect(VFX_TYPES.SNOW),
			textures,
		};
	}
	static async rain() {
		const textures = [
			`modules/${CONFIG.MOD_NAME}/assets/textures/flare.png`,
		];
		return {
			emitterConfig: await VFX.initEffect(VFX_TYPES.RAIN),
			textures,
		};
	}
	static async campfire() {
		const textures = [
			`modules/${CONFIG.MOD_NAME}/assets/textures/fire1.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/fire2.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/fire3.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/fire4.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/fire5.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/fire6.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/fire7.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/fire8.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/fire9.png`,
			`modules/${CONFIG.MOD_NAME}/assets/textures/fire10.png`,
		];
		return {
			emitterConfig: await VFX.initEffect(VFX_TYPES.CAMPFIRE),
			textures,
		};
	}

	static async setFilterEffect(effect, container) {
		switch (effect) {
			case VFX_TYPES.THUNDER:
				await VFX.thunderFilter(container);
				break;
			default:
				break;
		}
	}

	static async thunderFilter(container) {
		const bloomFilter = new PIXI.filters.AdvancedBloomFilter({
			threshold: 0.5,
			bloomScale: 2,
			brightness: 1,
			blur: 8,
			quality: 4
		});

		const lingerDuration = 1000; // how long to hold the effect before fade
		const decayRate = 0.02;
		const minScale = 0;
		let timeAccumulator = 0;
		let currentScale = bloomFilter.bloomScale;
		let fading = false;

		container.filters = [bloomFilter];

		const ticker = new PIXI.Ticker();

		ticker.add(() => {
			const deltaMS = ticker.elapsedMS;
			timeAccumulator += deltaMS;

			if (!fading && timeAccumulator >= lingerDuration) {
				fading = true;
				timeAccumulator = 0;
			}

			if (fading) {
				currentScale = Math.max(minScale, currentScale - decayRate);
				if (!isFinite(currentScale)) currentScale = minScale;

				bloomFilter.bloomScale = currentScale;
				container.filters = [bloomFilter];

				if (currentScale <= minScale + 0.01) {
					setTimeout(() => {
						ticker.stop();
						PIXI.Ticker.shared.remove(ticker);
						container.filters = [];
					}, 100);
				}
			}
		});

		ticker.start();
	}

	static async strokeShader() {
		const outlineFragmentShader = `
			precision mediump float;
			uniform sampler2D uSampler;
			uniform vec4 outlineColor;
			uniform float thickness;
			varying vec2 vTextureCoord;

			void main(void) {
			vec4 ownColor = texture2D(uSampler, vTextureCoord);
			float alpha = ownColor.a;
			float outline = 0.0;
			for (float x = -1.0; x <= 1.0; x++) {
				for (float y = -1.0; y <= 1.0; y++) {
				vec2 offset = vec2(x, y) * thickness / 100.0;
				outline += texture2D(uSampler, vTextureCoord + offset).a;
				}
			}
			if (alpha == 0.0 && outline > 0.0) {
				gl_FragColor = outlineColor;
			} else {
				gl_FragColor = ownColor;
			}
			}
			`;
		return outlineFragmentShader;
	}
}
