const path = require('path');

const distPath = path.resolve(__dirname, 'dist');
const assetPath = path.resolve(__dirname, 'assets');

const fileLoader = {
	loader : "file-loader",
	options : {
		name : "[path][name].[ext]",
		outputPath : "dist/",
		publicPath : "/",
		esModule : false
	}
}

/** @type {import('webpack-dev-server').Configuration} */
const devServer = {
	contentBase : [distPath, assetPath],
	compress : true,
	port : 8000
}

/** @type {import('webpack').Configuration[]} */
const configurations = [{
	entry : './app/index.ts',
	output : {
		filename : 'puzzle.js',
		path : path.resolve(__dirname, 'dist')
	},
	module : {
		rules : [
			{
				test : /\.ts$/,
				use : 'ts-loader',
				exclude : /node_modules/
			}
		]
	},
	resolve : {
		extensions : [ '.ts', '.js' ]
	},
	mode : 'development',
	// mode : 'production',
	// devtool : 'eval-source-map',
	devServer
},
{
	plugins : [

	],
	entry : './index.html',
	output : {
		filename : 'undefined.bundle.js',
		path : path.resolve(__dirname)
	},
	module : {
		rules : [
			{
				test : /\.html$/i,
				use : [
					fileLoader,
					"extract-loader",
					{
						loader : "html-loader",
						options : {
							minimize : true,
							attrs : ['img:src', 'link:href'],
							interpolate : 'require'
						}
					}
				]
			},
			{
				test : /\.md$/i,
				use : [
					"html-loader",
					"markdown-loader"
				]
			},
			{
				test : /\.css$/i,
				use : [
					fileLoader,
					"extract-loader",
					"css-loader"
				]
			},
			{
				test : /\.svg$/i,
				use : [
					fileLoader
				]
			}
		]
	}
}]


configurations.forEach(val => {
	val.mode = 'production';
	val.context = path.resolve(__dirname, 'src');
});
module.exports = configurations;
