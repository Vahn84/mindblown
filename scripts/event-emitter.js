export class EventEmitter {
	#callbacks = {};

	static Event = class {
		type = '';
		target = '';
		data = '';
	};

	addEventListener(eventType, callback) {
		if (typeof callback !== 'function') return;
		if (this.#callbacks[eventType] === undefined) {
			this.#callbacks[eventType] = [];
		}

		this.#callbacks[eventType].push(callback);
	}

	dispatchEvent(eventType, data) {
		if (this.#callbacks[eventType] === undefined) return;

		const event = new EventEmitter.Event();
		event.type = eventType;
		event.target = this;
		event.data = data;
		for (var i = 0; i < this.#callbacks[eventType].length; i++) {
			const callback = this.#callbacks[eventType][i];
			if (typeof callback === 'function') {
				callback(event);
				this.#callbacks[eventType].splice(i, 1);
				i--;
			}
		}
	}

	removeEventListener(eventType, callback) {
		if (this.#callbacks[eventType] === undefined) return;

		this.#callbacks[eventType] = this.#callbacks[eventType].filter(
			(cb) => cb !== callback
		);
	}
}
