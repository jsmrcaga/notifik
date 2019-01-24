#!/usr/bin/env node
const { server } = require('./server');
const Config = require('./global/config');
const redfox = require('./global/redfox');

if (process.argv && (process.argv.indexOf('-v') > -1 || process.argv.indexOf('version') > -1)) {
	const pkg = require('./package.json');
	return console.log(`notifik version ${pkg.version}`);
}

if (process.argv && process.argv.indexOf('path') > -1) {
	return console.log(`To modify browser behaviour go to: ${__dirname}/views/public/js/notifik.js`);
}

if (process.argv && process.argv.indexOf('keys') > -1) {
	let webPush = require('web-push');
	let keys = webPush.generateVAPIDKeys();
	return console.log(`Here are your new keys, have fun ⚡️! \nPublic:\n${keys.publicKey}\n\nPrivate:\n${keys.privateKey}`);
}

let port = process.env.PORT || Config.port || 9876;
server.listen(port, () => {
	redfox.success(`Notifik listening on port: ${port}`);
});
