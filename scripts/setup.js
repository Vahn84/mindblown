// scripts/setup.js
import CONFIG from './config.js';
import { MindblownUI } from './mindblown.js';
import { StageManger } from './stage-manager.js';
import { Tile } from './tile.js';
import { IS_GM, logger } from './utilities.js';

export async function setupModule() {
	console.log('Theatre of the Mind Manager | Setup module');

	const templates = [
		CONFIG.TEMPLATES.MINDBLOWN,
		CONFIG.TEMPLATES.NPCS,
		CONFIG.TEMPLATES.BGS,
		CONFIG.TEMPLATES.FOCUS,
	];

	try {
		// Load all templates
		await loadTemplates(templates);

		// Explicitly register partials
		const [bgs, npcs, focus] = await Promise.all([
			getTemplate(CONFIG.TEMPLATES.BGS),
			getTemplate(CONFIG.TEMPLATES.NPCS),
			getTemplate(CONFIG.TEMPLATES.FOCUS),
		]);

		Handlebars.registerPartial('bgs', bgs);
		Handlebars.registerPartial('npcs', npcs);
		Handlebars.registerPartial('focus', focus);

		Handlebars.registerHelper(
			'isActiveCategory',
			function (activeCategories, category, tileType, options) {
				if (!activeCategories || !category || !tileType) {
					return options.inverse(this);
				}

				const isActive = activeCategories[tileType].find(
					(item) => item === category
				);

				logger(
					'isActiveCategory',
					activeCategories,
					category,
					tileType,
					isActive
				);
				if (isActive) {
					return options.fn(this); // Render the block
				} else {
					return options.inverse(this); // Else block ({{else}})
				}
			}
		);

		Handlebars.registerHelper(
			'currentlyPlaying',
			function (array, key, tileType, options) {
				logger('crrentlyPlaying', array, key, tileType);
				if (!array || !key) return options.inverse(this);
				const currentStage = StageManger.shared().getCurrentStage();
				let isActive = false;

				if (currentStage) {
					switch (tileType) {
						case Tile.TileType.BG:
							isActive = currentStage.bg?.id === array[key]?.id;
							break;
						case Tile.TileType.NPC:
							isActive = currentStage.npc?.id === array[key]?.id;
							break;
						case Tile.TileType.FOCUS:
							isActive =
								currentStage.focus?.id === array[key]?.id;
							break;
						case Tile.TileType.VFX:
							isActive = currentStage.vfxs?.some(
								(vfx) => vfx.id === array[key]?.id
							);
							break;

						default:
							break;
					}
				}

				if (isActive) {
					return options.fn(this); // Render the block
				} else {
					return options.inverse(this); // Else block ({{else}})
				}
			}
		);

		Handlebars.registerHelper('getFirstPath', function (array) {
			if (!Array.isArray(array) || array.length === 0) return '';

			const firstTile = array[0];
			if (!firstTile) return '';

			return firstTile.thumbnail;
		});

		Handlebars.registerHelper('print', function (data, options) {
			console.log('print helper called with data:', data);
			if (data !== undefined && data !== null) {
				console.log('Data is undefined');
				return data;
			}
			return '';
		});
		Handlebars.registerHelper('ifnotEmpty', function (mediaPaths, options) {
			console.log(
				'notEmpty helper called with mediaPaths:',
				mediaPaths,
				options
			);
			if (
				mediaPaths &&
				mediaPaths.length > 0 &&
				mediaPaths.filter((image) => !image.deleted).length > 0
			) {
				return options.fn(this);
			}
			return;
		});

		console.log('Templates loaded successfully.');
	} catch (error) {
		console.error('Error loading templates:', error);
	}
}

export function initSettings() {
	if (IS_GM()) {
		game.settings.register(CONFIG.MOD_NAME, CONFIG.BGS_DIR, {
			name: 'Background Source Directory',
			hint: 'Set the directory where the background images are stored.',
			scope: 'world',
			config: true,
			type: String,
			filePicker: 'folder',
		});

		game.settings.register(CONFIG.MOD_NAME, CONFIG.NPCS_DIR, {
			name: 'Npcs Source Directory',
			hint: 'Set the directory where the npc images are stored.',
			scope: 'world',
			config: true,
			type: String,
			filePicker: 'folder',
		});
		game.settings.register(CONFIG.MOD_NAME, CONFIG.FOCUS_DIR, {
			name: 'Focus Source Directory',
			hint: 'Set the directory where the visual focus images are stored.',
			scope: 'world',
			config: true,
			type: String,
			filePicker: 'folder',
		});
	}
}

export function openMindblowUI() {
	if (!window.mindblownUI || !window.mindblownUI.rendered) {
		window.mindblownUI = new MindblownUI();
		window.mindblownUI.render(true);
	} else {
		window.mindblownUI.bringToTop();
	}
}
