const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mustache = require('mustache-express');
const router = require('./routes/router');

const app = express();

// HTML engine
app.engine('html', mustache());
app.set('view engine', 'html');

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cors
app.use(cors());

// Static stuff
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/views/public', {
	maxAge: 1000 * 60 * 60 * 24 // 24 hrs
}));

app.use('/', router);

module.exports = {
	server: app,
	app
};
