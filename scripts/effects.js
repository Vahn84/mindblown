import { logger } from './utilities.js';
import CONFIG from './config.js';

export const VFX_TYPES = {
	WARP: 'warp',
	WARP_CLOUDS: 'warp_clouds',
	STARS: 'stars',
	SWIRLING_FOG: 'swirling_fog',
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
	static async snow() {
		const textures = [
			`modules/${CONFIG.MOD_NAME}/assets/textures/snow.png`,
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
}
