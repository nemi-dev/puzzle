const express = require('express');
const httpError = require('http-errors');

const path = require('path');
const app = express();

app.get('/', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.get('/app.js', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'app.js'));
});

app.get('/img/:name', (req, res, next) => {
	if (req.params.name.endsWith('.png')) {
		res.sendFile(path.resolve(__dirname, 'img', req.params.name))
	} else {
		next(httpError(404));
	}
});

app.use((err, req, res, next) => {
	res.send(`${err.statusCode} ${err.message}`);
});

app.listen(8000);
