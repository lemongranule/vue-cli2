'use strict';

// 检查node和npm版本
require('./check-versions.js')();
const config = require('../config')

const webpack = require('webpack');

const koaWebpackmiddleware = require('koa-webpack-middleware')

const app = require('../main.js');
// webpack配置
// const webpackConfig = process.env.NODE_ENV === 'testing' //
// 	?
// 	require('./webpack.prod.conf') //
// 	:
// 	require('./webpack.dev.conf');
const webpackConfig = require('./webpack.dev.conf.js');

const webpackCompiler = webpack(webpackConfig);

app.use(koaWebpackmiddleware.devMiddleware(webpackCompiler, {
	noInfo: true,
	// display no info to console (only warnings and errors)
	quiet: false,
	// display nothing to the console
	lazy: false,
	// switch into lazy mode
	// that means no watching, but recompilation on every request
	publicPath: webpackConfig.output.publicPath,
	// public path to bind the middleware to
	// use the same as in webpack
	stats: {
		colors: true
	}
}));


app.use(koaWebpackmiddleware.hotMiddleware(webpackCompiler, {
	log: console.log,
	path: '/__webpack_hmr',
	heartbeat: 5000
}))
