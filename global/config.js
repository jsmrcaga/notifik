const fs = require('fs');
config_file = './config.json';

if (process.argv && process.argv.indexOf('-c') > -1) {
	let index = process.argv.indexOf('-c') + 1;
	config_file = process.argv[index];
}

const config = JSON.parse(fs.readFileSync(config_file));
module.exports = config;
