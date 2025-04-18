export const MediaType = {
	IMAGE: 'IMAGE',
	VIDEO: 'VIDEO',
};

export const TyleType = {
	BG: 'BG',
	NPC: 'NPC',
	ITEM: 'ITEM',
	VFX: 'VFX',
};

export class Tile {
	id: any;
	name: string;
	path: string;
	mute: boolean;
	loop: boolean;
	mediaType: MediaType;
	tileType: TyleType;
	coords: any;
	category: string;

	constructor(args) {
		const { id, name, path, mute, loop, category, tileType, coords } = args;
		this.id = `t_${new Date().getTime()}`;
		this.name = name || null;
		this.path = path || null;
		this.mute = mute || false;
		this.loop = loop || false;
		this.category = null;
		this.mediaType = this.path
			? isImage(this.path)
				? MediaType.IMAGE
				: isVideo(this.path)
				? MediaType.VIDEO
				: null
			: null;
		this.coords = coords || { x: 0, y: 0 };
	}
}
