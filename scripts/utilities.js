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
	const directoryPath = game.settings.get(CONFIG.MOD_NAME, dirCode);
	logger('syncMediaDirectory', directoryPath);
	logger('tileType', tileType);
	let folders = await FilePicker.browse('data', directoryPath);
	const tiles = game.user.getFlag(CONFIG.MOD_NAME, tileType) || {};
	for (let cIndex in tiles) {
		let category = tiles[cIndex];
		for (var i = 0; i < category.length; i++) {
			if (category[i] === null) {
				category.splice(i, 1);
				i--;
			}
		}
	}
	const dirs = folders.dirs.map((dir) => {
		dir = decodeURIComponent(dir).split('/').pop();
		return dir;
	});
	if (folders.target && folders.dirs.length) {
		for (let key in tiles) {
			if (!dirs.includes(key)) {
				delete tiles[key];
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
					if (!tiles[category]) {
						tiles[category] = [];
					}

					if (!tiles[category].find((media) => media?.img === path)) {
						let tile = new Tile(
							decodeURIComponent(path).split('/').pop(),
							path,
							tileType,
							true,
							true,
							category
						);

						if (tile.mediaType === Tile.MediaType.VIDEO) {
							try {
								const thumbnail =
									await game.video.createThumbnail(path, {
										width: 711,
										height: 400,
									});

								if (thumbnail) {
									logger('Thumbnail created:', thumbnail);
									const fileName = `${path
										.split('/')
										.pop()}.jpg`;
									const file = await fetch(thumbnail).then(
										(r) => r.blob()
									);

									const response = await FilePicker.upload(
										'data',
										'worlds/aetherium/video-thumbs',
										new File([file], fileName, {
											type: 'image/jpeg',
										}),
										{},
										{}
									);

									logger('Thumbnail uploaded:', response);

									tile.thumbnail = `worlds/aetherium/video-thumbs/${fileName}`;
								} else {
									throw new Error('Thumbnail not created');
								}
							} catch (error) {
								errorLogger('Error creating thumbnail:', error);
							}
						}

						tiles[category].push(tile);
					}
				}
			}
		}
	}
	logger(`New ${tileType} data`, tiles);
	game.user.setFlag(CONFIG.MOD_NAME, tileType, tiles);
	return tiles;
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
