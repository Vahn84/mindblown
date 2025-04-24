import { Tile, TyleType } from './tile.js';
import { logger } from './utilities.js';

export class Stage {
	constructor(bg) {
		
        this.bg = bg || null;
		this.category = this.bg?.category || null;
		this.id = `stage_${this.name}`;
		this.npcs = [];
		this.items = [];
		this.vfx = [];
        
	}

	isChildTileImage() {
		return this.bg?.mediaType === Tile.MediaType.IMAGE;
	}

	setBg(tile) {
		if (tile?.tileType === TyleType.BG) {
			this.bg = tile;
		}
		logger(this);
	}

	addTile(tile) {
		this.tiles.push(tile);
	}
	removeTile(tile) {
		this.tiles = this.tiles.filter((t) => t !== tile.id);
	}

	removeAllTiles() {
		this.tiles = [];
	}
	getTiles() {
		return this.tiles;
	}
}
