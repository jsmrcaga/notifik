const fs = require('fs');
const join = require('path').join;
const filename = join(__dirname, './subscriptions.json');

class Subscriber {
	constructor() {
		this.subscriptions = null;
	}

	/**
	 * Set new subscription and save to file
	 */
	setSubscription(id, subscription) {
		if(!this.subscriptions) {
			return this.load().then(() => {
				return this.setSubscription(id, subscription);
			}).catch(e => {
				this.subscriptions = [];
				return this.setSubscription(id, subscription);
			});
		}

		// prevent double subscription
		let exists = this.subscriptions.findIndex(sub => sub.id === id);

		let sub = {
			id,
			subscription
		};

		if(exists > -1) {
			// update subscrption
			this.subscriptions[exists].subscription = subscription;
		} else {
			// create subscription
			this.subscriptions.push(sub);
		}

		return new Promise((resolve, reject) => {
			let json = JSON.stringify(this.subscriptions, null, 4);
			fs.writeFile(filename, json, (err) => {
				if(err) {
					return reject(err);
				}

				resolve();
			});
		});
	}

	/**
	 * Load from file
	 */
	load() {
		if(!fs.existsSync(filename)) {
			return Promise.reject(new Error('[Subscriptions] No subscriptions registered yet'));
		}

		return new Promise((resolve, reject) => {
			fs.readFile(filename, (err, contents) => {
				if(err) {
					return reject(err);
				}

				try {
					let subscriptions = JSON.parse(contents);
					this.subscriptions = subscriptions;
					resolve();

				} catch(e) {
					reject(e);
				}
			});
		});
	}

	/**
	 * Get existing subscription
	 */
	getSubscription(id) {
		if(!this.subscriptions) {
			return this.load().then(() => {
				// call once more to check if id exists
				return this.getSubscription(id);
			});
		}

		let existing = this.subscriptions.find(sub => sub.id === id);
		if(!existing) {
			return Promise.reject(new Error(`[Subscriptions] Subscription with id: ${id} does not exist`));
		}

		return Promise.resolve(existing.subscription);
	}

	/**
	 * Get all subscriptions
	 */
	allSubscriptions() {
		if(!this.subscriptions) {
			return this.load().then(() => {
				return this.allSubscriptions();
			});
		}

		return this.subscriptions;
	}
}

module.exports = new Subscriber();
