import { logger } from './utilities.js';
import { isImage, isVideo } from './utilities.js';

export class Tile {
	static TyleType = {
		BG: 'BG',
		NPC: 'NPC',
		FOCUS: 'FOCUS',
		VFX: 'VFX',
	};
	static MediaType = {
		IMAGE: 'IMAGE',
		VIDEO: 'VIDEO',
		PARTICLES: 'PARTICLES',
	};
	static PIXI_TILE_PRESETS = {
		BG: {
			visible: true,
		},
		NPC: {
			width: 300,
			height: 600,
			screenWidth: 1920,
			screenHeight: 1080,
			pX: 300,
			pY: 1080,
			anchor: 0.5,
			visible: false,
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
		},
	};

	constructor(name, path, tileType, mute, loop, category) {
		this.name = name || new Date().getTime() + '';
		let nameAsId = name.replace(/[^A-Z0-9]/gi, '_');
		this.path = path || null;
		this.mute = mute || true;
		this.tileType = tileType || Tile.TyleType.BG;
		this.id = `tile_${this.tileType}_${nameAsId}`;
		this.loop = loop || true;
		this.category = category || null;
		this.mediaType = this.path
			? isImage(this.path)
				? Tile.MediaType.IMAGE
				: isVideo(this.path)
				? Tile.MediaType.VIDEO
				: Tile.MediaType.PARTICLES
			: null;
		this.isPlaying = false;
		this.order = -1;
		this.pixiOptions = { ...Tile.PIXI_TILE_PRESETS[this.tileType] };
		this.thumbnail = this.mediaType === Tile.MediaType.IMAGE ? this.path : null;
	}

	/**
	 * @param {String} id
	 */
	setId(id) {
		this.id = id;
	}

	/**
	 * @param {Number} order
	 */
	setOrder(order) {
		this.order = order;
	}
}
