const express = require('express');
const httpError = require('http-errors');

const path = require('path');
const app = express();
const router = express.Router();

router.get('/', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'index.html'));
});

router.get('/style.css', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'style.css'));
});


router.get('/puzzleset.json', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'puzzleset.json'));
});

router.get('/app.js', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'app.js'));
});

router.get('/hit.wav', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'hit.wav'));
});

router.get('/img/:name', (req, res, next) => {
	if (req.params.name.endsWith('.png')) {
		res.sendFile(path.resolve(__dirname, 'img', req.params.name))
	} else {
		next(httpError(404));
	}
});

router.use((err, req, res, next) => {
	res.send(`${err.statusCode} ${err.message}`);
});

app.use('/', router);

app.listen(8000);
