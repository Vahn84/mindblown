// scripts/setup.js
import CONFIG from './config.js';
import { MindblownUI } from './mindblown.js';
import { StageManager } from './stage-manager.js';
import { Tile } from './tile.js';
import { IS_GM, logger } from './utilities.js';

export const templates = [
	CONFIG.TEMPLATES.MINDBLOWN,
	CONFIG.TEMPLATES.BGS,
	CONFIG.TEMPLATES.PANEL,
];

export async function setupModule() {
	console.log('Theatre of the Mind Manager | Setup module');

	try {
		// Load all templates
		await loadTemplates(templates);

		// Explicitly register partials
		const [bgs, panel] = await Promise.all([
			getTemplate(CONFIG.TEMPLATES.BGS),
			getTemplate(CONFIG.TEMPLATES.PANEL),
		]);

		Handlebars.registerPartial('bgs', bgs);
		Handlebars.registerPartial('panel', panel);

		Handlebars.registerHelper(
			'isActiveCategory',
			function (activeCategories, category, tileType, options) {
				if (!activeCategories || !category || !tileType) {
					return options.inverse(this);
				}

				const isActive = activeCategories[tileType].find(
					(item) => item === category
				);

				if (isActive) {
					return options.fn(this); // Render the block
				} else {
					return options.inverse(this); // Else block ({{else}})
				}
			}
		);
		Handlebars.registerHelper(
			'isFavoriteCategory',
			function (category, tileType, listOfFavourites, options) {
				if (!category || !tileType) {
					return options.inverse(this);
				}

				const instance = MindblownUI.getInstance();
				if (!listOfFavourites) {
					switch (tileType) {
						case Tile.TileType.BG:
							listOfFavourites = instance.favouriteBGs;
							break;
						case Tile.TileType.NPC:
							listOfFavourites = instance.favouriteNPCs;
							break;
						case Tile.TileType.FOCUS:
							listOfFavourites = instance.favouriteFocus;
							break;
						case Tile.TileType.VFX:
							listOfFavourites = instance.favouriteVFXs;
							break;
						case Tile.TileType.LIGHT:
							listOfFavourites = instance.favouriteLights;
							break;
						default:
							break;
					}
				}

				if (!listOfFavourites) {
					return options.inverse(this);
				}

				let isAlreadyFav = listOfFavourites.find(
					(cat) => cat === category
				);

				if (isAlreadyFav) {
					return options.fn(this); // Render the block
				} else {
					return options.inverse(this); // Else block ({{else}})
				}
			}
		);

		Handlebars.registerHelper(
			'isFavouriteMode',
			function (tileType, options) {
				const instance = MindblownUI.getInstance();
				return instance.isFavouriteMode[tileType]
					? options.fn(this)
					: options.inverse(this);
			}
		);

		Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
			return arg1 == arg2 ? options.fn(this) : options.inverse(this);
		});

		Handlebars.registerHelper('ifDifferent', function (value, ...args) {
			const options = args.pop();
			return args.includes(value)
				? options.inverse(this)
				: options.fn(this);
		});

		Handlebars.registerHelper(
			'isLayerLocked',
			function (panelType, options) {
				const instance = MindblownUI.getInstance();

				// Check your internal logic per panelType
				const locked = instance.isLayerLocked(panelType); // your own method

				return locked ? options.fn(this) : options.inverse(this);
			}
		);

		Handlebars.registerHelper('getList', function (tileType, options) {
			const instance = MindblownUI.getInstance();
			return instance[tileType] || [];
		});

		Handlebars.registerHelper('sanitizeId', function (str) {
			if (typeof str !== 'string') return '';

			// Convert to lowercase
			let sanitized = str.toLowerCase();

			// Replace spaces and special characters with hyphens
			sanitized = sanitized.replace(/[^a-z0-9\-_:.]/g, '-');

			// Ensure it doesn't start with a number (IDs should start with a letter)
			if (/^[^a-z]/.test(sanitized)) {
				sanitized = 'id-' + sanitized;
			}

			return sanitized;
		});

		Handlebars.registerHelper('searchValue', function (tileType) {
			if (!tileType) return '';
			const instance = MindblownUI.getInstance();
			const searchValue = instance.search[tileType];
			return searchValue;
		});

		Handlebars.registerHelper('panelIcon', function (panelType) {
			switch (panelType) {
				case Tile.TileType.NPC:
					return 'fa-face-smile';
				case Tile.TileType.FOCUS:
					return 'fa-users-rectangle';
				case Tile.TileType.LIGHT:
					return 'fa-lightbulb';
				case Tile.TileType.VFX:
					return 'fa-film';
				default:
					return 'fa-circle'; // fallback icon
			}
		});

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
	// if (IS_GM()) {
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
	game.settings.register(CONFIG.MOD_NAME, CONFIG.HIDDEN_STAGE_FOR_GM, {
		name: 'hideStageForGM',
		hint: 'Toggle Stage visibility for GM',
		scope: 'world',
		config: true,
		type: Boolean,
	});
	game.settings.register(CONFIG.MOD_NAME, CONFIG.HIDDEN_STAGE_FOR_PLAYERS, {
		name: 'hideStageForPlayers',
		hint: 'Toggle Stage visibility for Players',
		scope: 'world',
		config: true,
		type: Boolean,
	});
	game.settings.register(CONFIG.MOD_NAME, CONFIG.AMBIENT_LIGHTING_ENABLED, {
		name: 'ambientLightingEnabled',
		hint: 'Toggle Ambient Lighting',
		scope: 'world',
		config: true,
		type: Boolean,
	});
	game.settings.register(CONFIG.MOD_NAME, CONFIG.CURRENT_STAGE, {
		scope: 'world',
	});
	// }
}

export function openMindblowUI() {
	if (!window.mindblownUI || !window.mindblownUI.rendered) {
		window.mindblownUI = new MindblownUI();
		window.mindblownUI.render(true);
	} else {
		window.mindblownUI.bringToTop();
	}
}
