import { MindblownUI } from './mindblown';

export class SocketServer {
	static handleStreamDeckCommand(data) {
		switch (data.command) {
			case 'weather':
				// applyWeatherEffect(data.effect);
				break;
			case 'addLight':
				addCustomLight(data.options);
				break;
			case 'favouriteBgs':
				MindblownUI.getInstance().getUnfilteredBgs();
				break;
		}
	}
}
