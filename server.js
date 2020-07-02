const express = require('express');
const path = require('path');

const app = express();

const router = express.Router();

router.use(express.static(path.resolve(__dirname, 'dist'), {
	extensions : ['html']
}));

router.use(express.static(path.resolve(__dirname, 'assets')));

app.use(router);

app.listen(8000);


