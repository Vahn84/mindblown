import CONFIG from './config.js';
import { Tile } from './tile.js';
import { Stage } from './stage.js';

export const logger = (...args) => {
	if (!CONFIG.DEBUG) return;

	args.forEach((arg) => {
		console.log(`Mindblown`, arg);
	});
};

export const errorLogger = (...args) => {
	if (!CONFIG.DEBUG) return;

	args.forEach((arg) => {
		console.error(`Mindblown`, arg);
	});
};

export const isImage = (path) => /\.(png|jpg|jpeg|webp)$/i.test(path);
export const isVideo = (path) => /\.(mp4|webm)$/i.test(path);

export const IS_GM = () => game.user.isGM;

export async function syncMediaDirectory(dirCode, tileType) {
	let newDataCount = 0;
	const directoryPath = game.settings.get(CONFIG.MOD_NAME, dirCode);
	logger('syncMediaDirectory', directoryPath);
	logger('tileType', tileType);
	let folders = await FilePicker.browse('data', directoryPath);
	const tilesFolders = game.user.getFlag(CONFIG.MOD_NAME, tileType) || {};
	for (let index in tilesFolders) {
		let folder = tilesFolders[index];
		for (var i = 0; i < folder.tiles.length; i++) {
			let tile = folder.tiles[i];
			if (tile === null || !UrlExists(tile.path)) {
				ui.notifications.info(
					`REMOVED TILE: ${tile.name} because it doesn't exist anymore or its path changed`
				);
				folder.tiles.splice(i, 1);
				i--;
			}
		}
	}
	const dirs = folders.dirs.map((dir) => {
		dir = decodeURIComponent(dir).split('/').pop();
		return dir;
	});
	if (folders.target && folders.dirs.length) {
		for (let folderIndex in tilesFolders) {
			let _tilesFolder = tilesFolders[folderIndex];
			if (!dirs.includes(_tilesFolder.name)) {
				tilesFolders.splice(folderIndex, 1);
				logger(
					`Removed folder ${_tilesFolder.name} because it doesn't exist anymore`
				);
			}
		}

		for (const subFolder of folders.dirs.filter(
			(dir) => !dir.includes('%40eaDir')
		)) {
			let dir = await FilePicker.browse('data', subFolder);
			logger('FilePicker response for subfolder:', dir);

			if (dir.target && dir.files.length) {
				for (const path of dir.files.filter(
					(file) =>
						file.endsWith('.png') ||
						file.endsWith('.jpg') ||
						file.endsWith('.webp') ||
						file.endsWith('.mp4') ||
						file.endsWith('.webm')
				)) {
					let category = decodeURIComponent(dir.target)
						.split('/')
						.pop();
					let foundFolder = tilesFolders.find(
						(folder) => folder.name === category
					);
					if (!foundFolder) {
						foundFolder = {
							name: category,
							isActive: false,
							isFavourite: false,
							tiles: [],
							id: category,
						};
						tilesFolders.push(foundFolder);
					}

					if (
						!foundFolder.tiles.find((_tile) => _tile?.path === path)
					) {
						let tile = new Tile(
							decodeURIComponent(path).split('/').pop(),
							path,
							tileType,
							true,
							true,
							category
						);

						let thumb = await createThumbnail(path, {
							width: 500,
							height: 500,
							center:
								Tile.TileType.NPC === tileType ? false : true,
							ty: 0,
						});

						if (thumb) {
							tile.thumbnail = thumb;

							foundFolder.tiles.push(tile);
							newDataCount++;
						}
					}
				}
			}
		}
	}
	logger(`New ${tileType} data`, tilesFolders);
	if (newDataCount === 0) {
		ui.notifications.info(
			`No new ${tileType} data found in ${directoryPath}.`
		);
	}
	game.user.setFlag(CONFIG.MOD_NAME, tileType, tilesFolders);
	return tilesFolders;
}

export async function addVfxFromPath(path, thumbnail) {
	const parts = path.split('/');
	if (parts.length < 2) return collection;

	const key = parts[parts.length - 2];
	const file = parts[parts.length - 1];

	const tilesFolders =
		game.user.getFlag(CONFIG.MOD_NAME, Tile.TileType.VFX) || {};
	let foundFolder = tilesFolders.find((folder) => folder.name === key);
	if (!foundFolder) {
		foundFolder = {
			name: key,
			isActive: false,
			isFavourite: false,
			tiles: [],
		};
		logger(`Created new folder for VFX: ${key}`);
	}
	const tile = foundFolder.tiles.find((tile) => tile.path === path);
	if (!tile) {
		const newTile = new Tile(
			file,
			path,
			Tile.TileType.VFX,
			true,
			true,
			key
		);
		const thumb = await createThumbnail(
			path,
			{
				width: 500,
				height: 500,
				center: true,
				ty: 0,
			},
			thumbnail
		);
		if (thumb) {
			newTile.thumbnail = thumb;
		}
		foundFolder.tiles.push(newTile);
		await game.user.setFlag(
			CONFIG.MOD_NAME,
			Tile.TileType.VFX,
			tilesFolders
		);
		return newTile;
	}
}

export async function addTileFromClipboard(
	path,
	folder,
	name,
	tileType,
	tiles
) {
	let thumbnail = await createThumbnail(path, {
		width: 500,
		height: 500,
		center: Tile.TileType.NPC === tileType ? false : true,
		ty: 0,
	});

	if (!thumbnail) {
		logger('Failed to create thumbnail for tile:', path);
		return;
	}
	const newTile = new Tile(
		name + '.webp',
		path,
		tileType,
		true,
		true,
		folder.name
	);
	newTile.thumbnail = thumbnail;

	return newTile;
}

async function createThumbnail(path, options, _thumbnail = null) {
	try {
		let fileName =
			decodeURIComponent(path)
				.split('/')
				.pop()
				.replace(/\.[^/.]+$/, '') + '.png';

		if (UrlExists(`worlds/aetherium/thumbs/${fileName}`)) {
			logger(`Thumbnail already exists: ${fileName}`);
			return `worlds/aetherium/thumbs/${fileName}`;
		}

		const thumbnail = _thumbnail
			? _thumbnail
			: await game.video.createThumbnail(path, options);

		if (thumbnail) {
			logger('Thumbnail created:', thumbnail);

			const file = await fetch(thumbnail).then((r) => r.blob());

			const response = await FilePicker.upload(
				'data',
				'worlds/aetherium/thumbs',
				new File([file], fileName, {
					type: 'image/jpeg',
				}),
				{},
				{}
			);
			if (response) {
				logger('Thumbnail uploaded:', response);
				return response.path;
			} else {
				throw new Error('Thumbnail not uploaded');
			}
		} else {
			throw new Error('Thumbnail not created');
		}
	} catch (error) {
		errorLogger('Error creating thumbnail:', error);
		return null;
	}
}

function sanitizeFilename(input, maxLength = 100) {
	if (typeof input !== 'string') return 'file';

	return (
		input
			.normalize('NFKD') // Normalize unicode
			.replace(/[\u0300-\u036f]/g, '') // Remove accents
			.replace(/[^a-z0-9_\-\. ]/gi, '') // Remove invalid chars
			.replace(/\s+/g, '_') // Replace spaces with underscores
			.replace(/_+/g, '_') // Collapse multiple underscores
			.replace(/^_+|_+$/g, '') // Trim leading/trailing underscores
			.substring(0, maxLength) || // Limit length
		'file'
	);
}

export async function uploadBase64(base64, folder, name, tileType) {
	const fileName = sanitizeFilename(name);
	let filePath = `worlds/aetherium/images/${folder}`;
	if (UrlExists(filePath + `/${fileName}`)) {
		return {
			status: 'error',
			error: `File already exists: ${filePath}/${fileName}`,
		};
	}
	let result = await ImageHelper.uploadBase64(base64, fileName, filePath);
	logger('uploadBase64 result:', result);
	return { status: result.status, path: result?.path };
}

export async function saveCurrentlyPlaying(stage) {
	if (!stage) return;
	const currentPlaying = game.user.getFlag(CONFIG.MOD_NAME, CONFIG.ON_AIR);
	if (currentPlaying) {
		await game.user.unsetFlag(CONFIG.MOD_NAME, CONFIG.ON_AIR);
	}
	await game.user.setFlag(CONFIG.MOD_NAME, CONFIG.ON_AIR, stage);
}

export async function resetCurrentlyPlaying() {
	const currentPlaying = game.user.getFlag(CONFIG.MOD_NAME, CONFIG.ON_AIR);
	if (currentPlaying) {
		await game.user.unsetFlag(CONFIG.MOD_NAME, CONFIG.ON_AIR);
	}
}

function UrlExists(url) {
	var http = new XMLHttpRequest();
	http.open('HEAD', url, false);
	http.send();
	return http.status != 404;
}

export function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;
}

export function rgbToHex(r, g, b) {
	return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
		  }
		: null;
}

export function getColorFromHex(hex) {
	const rgb = hexToRgb(hex);
	return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
}

export async function getScaledSizeToFitBox(src, maxWidth, maxHeight) {
	function loadMediaSize() {
		return new Promise((resolve, reject) => {
			const isVideo = /\.(webm|mp4|mov|ogg)$/i.test(src);
			const el = isVideo ? document.createElement('video') : new Image();

			if (isVideo) {
				el.preload = 'metadata';
				el.muted = true;
				el.onloadedmetadata = () =>
					resolve({ width: el.videoWidth, height: el.videoHeight });
			} else {
				el.onload = () =>
					resolve({
						width: el.naturalWidth,
						height: el.naturalHeight,
					});
			}

			el.onerror = reject;
			el.src = src;
		});
	}

	const { width: originalWidth, height: originalHeight } =
		await loadMediaSize();

	const widthRatio = maxWidth / originalWidth;
	const heightRatio = maxHeight / originalHeight;

	// Choose the smaller ratio to fit within both bounds
	const ratio = Math.min(widthRatio, heightRatio, 1); // Don't upscale

	const scaledWidth = Math.round(originalWidth * ratio);
	const scaledHeight = Math.round(originalHeight * ratio);

	return {
		originalWidth,
		originalHeight,
		width: scaledWidth,
		height: scaledHeight,
		ratio,
	};
}

export function normalizeTiles(tileType = Tile.TileType.BG) {
	const tiles = game.user.getFlag(CONFIG.MOD_NAME, tileType) || {};

	for (const folder of tiles) {
		for (const tile of folder.tiles) {
			if (tile === null || tile === undefined) {
				folder.tiles.splice(folder.tiles.indexOf(tile), 1);
			}
		}
	}
	game.user.setFlag(CONFIG.MOD_NAME, tileType, tiles);
	return tiles;
}

export var ClipboardUtils = new (function () {
	var permissions = {
		'image/bmp': true,
		'image/gif': true,
		'image/png': true,
		'image/jpeg': true,
		'image/tiff': true,
	};

	function getType(types) {
		for (var j = 0; j < types.length; ++j) {
			var type = types[j];
			if (permissions[type]) {
				return type;
			}
		}
		return null;
	}
	function getItem(items) {
		for (var i = 0; i < items.length; ++i) {
			var item = items[i];
			if (item) {
				var type = getType(item.types);
				if (type) {
					return item.getType(type);
				}
			}
		}
		return null;
	}
	function loadFile(file, callback) {
		if (window.FileReader) {
			var reader = new FileReader();
			reader.onload = function () {
				callback(reader.result, null);
			};
			reader.onerror = function () {
				callback(null, 'Incorrect file.');
			};
			reader.readAsDataURL(file);
		} else {
			callback(null, 'File api is not supported.');
		}
	}

	this.readImage = function (callback) {
		if (navigator.clipboard) {
			var promise = navigator.clipboard.read();
			promise
				.then(function (items) {
					var promise = getItem(items);
					if (promise) {
						promise
							.then(function (result) {
								loadFile(result, callback);
							})
							.catch(function (error) {
								callback(null, 'Reading clipboard error.');
							});
					} else {
						callback(null, null);
					}
				})
				.catch(function (error) {
					callback(null, 'Reading clipboard error.');
				});
		} else {
			callback(null, 'Clipboard is not supported.');
		}
	};
})();

export function debounce(func, delay = 300) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), delay);
	};
}

export function searchFoldersByName(folders, query) {
	const lowerQuery = query.toLowerCase().trim();

	if (!lowerQuery) return folders; // Return all if empty

	return folders
		.map((folder) => {
			const folderMatch = folder.name.toLowerCase().includes(lowerQuery);

			const matchingTiles = folder.tiles.filter((tile) =>
				tile.name.toLowerCase().includes(lowerQuery)
			);

			if (folderMatch || matchingTiles.length > 0) {
				return {
					...folder,
					tiles: folderMatch ? folder.tiles : matchingTiles,
				};
			}

			return null;
		})
		.filter(Boolean); // Remove nulls
}
