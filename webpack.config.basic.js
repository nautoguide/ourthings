const path = require('path');

module.exports = {
	mode: 'development',
	entry: './src/ourthings/main.js',
	output: {
		filename: 'ourthings-full.js',
		path: path.resolve(__dirname, 'build')
	}
};