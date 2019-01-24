const Config = require('../../global/config');
const RequestError = require('../../global/requestError');

module.exports = (options) => {
	return (req, res, next) => {
		// ignore some paths
		if(options.ignore) {
			for(let ignore of options.ignore) {
				let reg = new RegExp(`${ignore}$`);
				if(reg.test(req.path)){
					return next();
				}
			}
		}

		if(!Config.api_key) {
			return next();
		}

		let api_key = req.get('X-Api-Key') || req.query.api_key;

		if(!api_key) {
			throw new RequestError('API key required', 400);
		}

		if(api_key !== Config.api_key) {
			throw new RequestError('Unauthorized', 403);	
		}

		return next();
	};
};
