class RequestError extends Error {
	constructor(message, code) {
		super(message);
		this.code = code;
		this.name = this.constructor.name;
	}

	toJSON() {
		return {
			error: {
				code: this.code,
				message: this.message
			}
		};
	}

	toString() {
		return `RequestError: ${this.message}\nCode: ${this.code}`;
	}
}

module.exports = RequestError;
