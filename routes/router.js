const RequestError = require('../global/requestError');
const redfox = require('../global/redfox');
const Subscriber = require('../global/subscriber');
const express = require('express');
const router = express.Router();

// Manage notifications
router.get('/', (req, res) => {
	res.render('index');
});

// Subscribe to notifications
router.get('/subscribe', (req, res) => {
	res.render('subscribe');
});

// API to notify
router.use('/api', require('./api'));

// Error handling
router.use((err, req, res, next) => {
	if(err instanceof RequestError) {
		redfox.error('[HTTP] Error', err.message);
		return res.status(err.code || 500).json(err);
	}

	redfox.error('[HTTP] Error', err);

	return res.status(500).json({
		error: {
			code: 500,
			message: err.message
		}
	});
});

module.exports = router;
