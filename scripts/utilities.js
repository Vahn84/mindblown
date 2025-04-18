export const logger = (message) => {
	console.log(`Mindblown | ${message}`);
};

export const isImage = (path) => /\.(png|jpg|jpeg|webp)$/i.test(path);
export const isVideo = (path) => /\.(mp4|webm)$/i.test(path);
