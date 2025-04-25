import { Tile } from './tile.js';
import { logger } from './utilities.js';

export class Stage {


	constructor(bg) {
		this.bg = bg;
		this.npc = null;
		this.focus = null;
		this.vfxs = [];
		let bgNameAsId = bg.id.split('/').pop();
		this.id = `stage_${bgNameAsId}`;


	}

	setBg(bg) {
		this.bg = bg.id;
		this.id = `stage_${bg.id}`;
	}

	addNpc(npc) {
		this.npcs[0] = { ...CONFIG, npc };
	}


}
