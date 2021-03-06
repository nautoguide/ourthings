const path = require('path');

module.exports = {
	mode: 'development',
	devtool: 'inline-source-map',
	entry: ['whatwg-fetch','babel-polyfill', path.resolve(__dirname, 'src/ourthings/main.js')],
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: 'webpackbabel.js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader'
				}
			}
		]
	},
	plugins: []
};