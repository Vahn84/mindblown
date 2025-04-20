import { Tile, TyleType } from './tile.js';
import { logger } from './utilities.js';

export class Stage {
	constructor(name = 'Stage') {
		this.name = name;
        this.bg = null;
        
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
