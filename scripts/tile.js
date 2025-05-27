import { logger } from './utilities.js';
import { isImage, isVideo } from './utilities.js';
import CONFIG from './config.js';

export class Tile {
	static TileType = {
		BG: 'BG',
		NPC: 'NPC',
		FOCUS: 'FOCUS',
		VFX: 'VFX',
		LIGHT: 'LIGHT',
	};
	static MediaType = {
		IMAGE: 'IMAGE',
		VIDEO: 'VIDEO',
		PIXIVFX: 'PIXIVFX',
	};

	constructor(name, path, tileType, mute, loop, category) {
		this.name = name || new Date().getTime() + '';
		let nameAsId = name.replace(/[^A-Z0-9]/gi, '_');
		this.path = path || null;
		this.mute = mute || true;
		this.tileType = tileType || Tile.TileType.BG;
		this.id = `tile_${this.tileType}_${nameAsId}_${new Date().getTime()}`;
		this.loop = loop || true;
		this.category = category || null;
		this.mediaType = this.path
			? isImage(this.path)
				? Tile.MediaType.IMAGE
				: isVideo(this.path)
				? Tile.MediaType.VIDEO
				: Tile.MediaType.PIXIVFX
			: null;
		this.isPlaying = false;
		this.order = -1;
		this.thumbnail =
			this.mediaType === Tile.MediaType.IMAGE ? this.path : null;
		this.isDefault = false;
		this.pixiOptions = null;
		this.isFavourite = false;
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

	setLightsPreset(lightsPreset) {
		this.lightsPreset = lightsPreset;
	}

	setVfxPreset(vfxPreset) {
		this.vfxPreset = vfxPreset;
	}

	static async GetTilesByType(tileType = Tile.TileType.BG) {
		return (await game.user.getFlag(CONFIG.MOD_NAME, tileType)) || [];
	}

	static async GetTileById(tileType, id, _tiles = null) {
		if (!tileType || !id) {
			return null;
		}
		const tiles = _tiles ? _tiles : await Tile.GetTilesByType(tileType);
		for (const index in tiles) {
			const folder = tiles[index];

			const tileIndex = folder.tiles.findIndex((tile) => tile.id === id);
			if (tileIndex === -1) {
				continue;
			}
			return folder.tiles[tileIndex];
		}
		return null;
	}

	static async FindFolderById(tileType, id, _tiles = null) {
		if (!tileType || !id) {
			return null;
		}
		const tiles = _tiles ? _tiles : await Tile.GetTilesByType(tileType);
		return tiles.find((folder) => folder.id === id) || null;
	}

	static async UpdateTilesByType(tileType, tiles) {
		if (!tileType || !tiles) {
			return;
		}
		await game.user.setFlag(CONFIG.MOD_NAME, tileType, tiles);
	}

	static async UpdateFolder(folder, tileType) {
		let tiles = await Tile.GetTilesByType(tileType);
		tiles = tiles.map((f) => {
			if (f.id === folder.id) {
				return folder;
			}
			return f;
		});
		await Tile.UpdateTilesByType(tileType, tiles);
	}
}
