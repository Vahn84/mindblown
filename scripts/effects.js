import { logger } from './utilities.js';
import CONFIG from './config.js';

export const VFX = {
	initEffect: async (effect) => {
		return await (
			await fetch(`./modules/${CONFIG.MOD_NAME}/assets/${effect}.json`)
		).json();
	},
	warp: async () => {
		return VFX.initEffect('warp');
	},
	swirling_fog: async () => {
		return VFX.initEffect('warp_clouds');
	},
};
