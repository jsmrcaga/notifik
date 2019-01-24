const redfox = require('../global/redfox');
const Pusher = require('web-push');
const Config = require('../global/config');
const Subscriber = require('../global/subscriber');

class Notifications {
	constructor() {
		Pusher.setVapidDetails(`mailto:${Config.user_email}`, Config.keys.public, Config.keys.private);
		Pusher.setGCMAPIKey(Config.keys.gcm);
	}

	/**
	 * Notify a user
	 */
	notify(user_id, { title, body, image, icon, badge, vibrate, url, actions }) {
		let subscriptionInfo = Subscriber.getSubscription(user_id);

		return subscriptionInfo.then((subscription) => {
			return Pusher.sendNotification(subscription, JSON.stringify({
				user_id: Config.user_email,
				actions,
				body,
				title,
				image: image || undefined,
				vibrate: vibrate || [100, 50, 100, 50],
				timestamp: Date.now(),
				icon: icon || Config.defaults.icon || undefined,
				badge: badge || Config.defaults.badge || undefined,
				requireInteraction: url ? true : false,
				data:{
					url: url || undefined
				}
			}));
		}).then(res => {
			if(res.statusCode !== 201) {
				redfox.error('[NOTIFIK] Notification could not be sent', res.statusCode, res.response);
			}

			return;
		}).catch(e => {
			redfox.error('[NOTIFIK] Notification could not be sent', e);
			throw e;
		});
	}

	/**
	 * Bulk notify, whether same notif, or different notifications
	 * @param {} list - {id, notification}
	 */
	bulk(list, params) {
		let notifications = [];

		for(let sub of list) {
			let promise = this.notify(sub.id || sub, sub.notification || params);
			notifications.push(promise);
		}

		return Promise.all(notifications);
	}
}

const notifications = new Notifications();

module.exports = notifications;
