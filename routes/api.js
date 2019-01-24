const Config = require('../global/config');
const RequestError = require('../global/requestError');
const redfox = require('../global/redfox');
const Notifications = require('../notifications/notifications');
const Subscriber = require('../global/subscriber');
const express = require('express');
const api = express.Router();

api.use('/', require('./middleware/security')({
	ignore: '/config'
}));

api.get('/config', (req, res) => {
	return res.json({
		api_key: Config.api_key,
		service_worker: Config.service_worker
	});
});

// Get actual user subscription
api.post('/subscribe', (req, res) => {
	let { id, subscription } = req.body;
	// save subscription
	if(!subscription || !Object.keys(subscription).length) {
		throw new RequestError('Subscription is required', 400);
	}

	Subscriber.setSubscription(id, subscription).then(() => {
		return res.status(200).json({ success: true });

	}).catch(e => {
		redfox.error('[API][Subscribe]', e);
		throw new RequestError('An error occurred while setting new subscription', 500);
	});
});

// Get all subscriptions
api.get('/subscriptions', (req, res) => {
	Subscriber.allSubscriptions().then(subscriptions => {
		let subs = subscriptions.map(sub => sub.id);

		// pagination
		if(req.query.from) {
			subs = subs.slice(subs.length - req.query.from);
		}
		
		return res.json(subs);

	}).catch(err => {
		redfox.error('[API][Subscriptions]', e);
		throw new RequestError('An error occurred while fetching subscriptions', 500);
	});
});

// Notifiy subscriber
api.post('/notify', (req, res) => {
	let {user_id, ...notifParams} = req.body;
	if(!notifParams.title && !notifParams.body) {
		throw new RequestError('Title or body required', 400);
	}

	Notifications.notify(user_id, notifParams).then((err) => {
		if(err) {
			throw err;
		}

		return res.json({success: true});
	}).catch(e => {
		redfox.error('[API][Notify]', e);
		throw new RequestError('An error occurred trying to notify user', 500);
	});
});

// Notify multiple users at the same time
api.post('/notify/bulk', (req, res) => {
	let { users, notification } = req.body;
	if(!users) {
		throw new RequestError('Subscriber list required', 400);
	}

	Notifications.bulk(users, notification).then((errors) => {
		let err = [];
		for(let i = 0; i < users.length; i++){
			if(errors[i]) {
				err.push(users[i]);
			}
		}

		if(!err.length) {
			return res.json({ success: true });
		}

		return res.json({
			success: 'partial',
			errors: err
		});

	}).catch(e => {
		redfox.error('[API][Notify | Bulk]', e);
		throw new RequestError('An error occurred trying to bulk notify', 500);
	});
});

// Update notification script to all users
api.post('/update', (req, res) => {
	Subscriber.allSubscriptions().then(subscriptions => {
		return Notifications.bulk(subscriptions, {
			update: true
		});

	}).then(() => {
		return res.json({
			success: true,
			message: 'Sent update notification to all subscribers'
		});
	});
});

module.exports = api;
