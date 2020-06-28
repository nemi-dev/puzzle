const path = require('path');

/** @type {import('webpack').Configuration[]} */
module.exports = [{
	entry : './src/app/index.ts',
	output : {
		filename : 'app.js',
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
	entry : './bundle.js',
	context : path.resolve(__dirname, 'src'),
	output : {
		filename : 'undefined.js',
		path : path.resolve(__dirname, 'dist')
	},
	module : {
		rules : [
			{
				test : /\.(html|css|svg|png|wav)$/,
				use : [
					"ignore-loader",
					"extract-loader",
					{
						loader : "file-loader",
						options : {
							name : "[path][name].[ext]",
							esModule : false
						}
					}
				]
			},
			{
				test : /\.json$/,
				use : [
					"ignore-loader",
					"extract-loader",
					{
						loader : "file-loader",
						options : {
							name : "[path][name].[ext]",
							esModule : false
						}
					}
				],
				type : "javascript/auto"
			}
		]
	}
}]
