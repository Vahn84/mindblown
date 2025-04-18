import { Tile } from './tile.js';

export class Stage {
	bg: Tile;
	name: string;

	constructor(...args) {
		const { tiles, name } = args;
		this.tiles = tiles || [];
		this.name = name || 'Stage';
	}

	addTile(tile: Tile) {
		this.tiles.push(tile);
	}
	removeTile(tile: Tile) {
		this.tiles = this.tiles.filter((t) => t !== tile.id);
	}

	removeAllTiles() {
		this.tiles = [];
	}
	getTiles() {
		return this.tiles;
	}
}
