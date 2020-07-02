const path = require('path');

const fileLoader = {
	loader : "file-loader",
	options : {
		name : "[path][name].[ext]",
		outputPath : "dist/",
		publicPath : "/",
		esModule : false
	}
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
	mode : 'production',
	// devtool : 'eval-source-map'
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
	val.devServer = {

	}
});
module.exports = configurations;
