import { logger } from './utilities.js';
import { isImage, isVideo } from './utilities.js';

export const MediaType = {
	IMAGE: 'IMAGE',
	VIDEO: 'VIDEO',
	PARTICLES: 'PARTICLES',
};

export const TyleType = {
	BG: 'BG',
	NPC: 'NPC',
	ITEM: 'ITEM',
	VFX: 'VFX',
};

export class Tile {
	// id: any;
	// name: string;
	// path: string;
	// mute: boolean;
	// loop: boolean;
	// mediaType: MediaType;
	// tileType: TyleType;
	// coords: any;
	// category: string;

	constructor(
		name,
		path,
		tileType = TyleType.BG,
		mute = false,
		loop = false,
		category = null,
	) {
		this.id = `tile_${new Date().getTime()}`;
		this.name = name || null;
		this.path = path || null;
		this.mute = mute || false;
		this.tileType = tileType;
		this.loop = loop || false;
		this.category = null;
		this.mediaType = this.path
			? isImage(this.path)
				? MediaType.IMAGE
				: isVideo(this.path)
				? MediaType.VIDEO
				: MediaType.PARTICLES
			: null;
		
	}
}
