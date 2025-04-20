import config from './config.js';

export const logger = (...args) => {
	if (!config.DEBUG) return;

	args.forEach((arg) => {
		console.log(`Mindblown`, arg);
	});
};

export const isImage = (path) => /\.(png|jpg|jpeg|webp)$/i.test(path);
export const isVideo = (path) => /\.(mp4|webm)$/i.test(path);
