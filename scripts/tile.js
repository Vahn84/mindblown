import { logger } from './utilities.js';
import { isImage, isVideo } from './utilities.js';

export class Tile {
	static TileType = {
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

	constructor(name, path, tileType, mute, loop, category) {
		this.name = name || new Date().getTime() + '';
		let nameAsId = name.replace(/[^A-Z0-9]/gi, '_');
		this.path = path || null;
		this.mute = mute || true;
		this.tileType = tileType || Tile.TileType.BG;
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
		this.thumbnail =
			this.mediaType === Tile.MediaType.IMAGE ? this.path : null;
		this.isDefault = false;
		this.pixiOptions = null;
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

	setAlpha(alpha) {
		this.pixiOptions.alpha = alpha;
	}

	setPixiOptions(pixiOptions) {
		this.pixiOptions = pixiOptions;
	}

	setIsDefault(isDefault) {
		this.isDefault = isDefault;
	}
}
