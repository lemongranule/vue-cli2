'use strict';

// package.json
const packageConfig = require('./package.json');

const config = require('./config');
config['version'] = packageConfig['version'];



const cluster = require('cluster');
const path = require('path');
const Koa = require('koa');
const koaLogger = require('koa-logger');
const koaBodyparser = require('koa-bodyparser');

//11 22 不知道到底用谁
const koaMount = require('koa-mount'); //11
const koaStatic = require('koa-static'); //11
const koaConvert = require('koa-convert'); //22

const koaSwig = require('koa-swig');
const co = require('co');

// 全局配置moment库的locale
require('moment/locale/zh-cn');
require('moment').locale('zh-cn');
// Koa
const app = new Koa();

// Koa日志，放置在所有middleware最前
if (app.env !== 'production') {
	app.use(koaLogger());
}

// 基本配置
app.jsonSpaces = 0;


// 模版引擎 koa v2.x
app.context.render = co.wrap(koaSwig({
	root: path.resolve(__dirname, 'views'),
	autoescape: true,
	ext: 'html',
	cache: app.env === 'production' ? 'memory' : false,
	writeBody: false
}));


//静态资源
app.use(koaMount('/static', koaStatic(path.resolve(__dirname, 'static'))));
// app.use(koaConvert(koaStatic(__dirname + 'static')));


// HTTP与HTTPS处理
app.use(async (ctx, next) => {
	if (ctx.secure || ctx.header['x-forwarded-proto'] == 'https') {
		ctx.staticRoot = config.staticRootHttps;
	} else {
		ctx.staticRoot = config.staticRoot;
	}
	await next();
});

// 解析body
app.use(koaBodyparser({
	onerror: function(err, ctx) {
		console.error(err);
	},
}));

// 路由
app.use(require('./routers/root').routes()); //
app.use(require('./routers/ueditor').routes()); // 

// 启动服务
const port = process.env.PORT || config.port;
if (cluster.isMaster) {
	let processes = config.processes > 0 //
		?
		config.processes //
		:
		require('os').cpus().length;

	for (let i = 0; i < processes; i++) {
		cluster.fork();
	}

	cluster.on('listening', function(worker, address) {
		console.log(`xmx-manager is listening: pid=${worker.process.pid}, address=${address.address}:${address.port}`);
	});

	cluster.on('exit', function(worker, code, signal) {
		console.error(`xmx-manager exit: pid= ${worker.process.pid}`);
	});

	console.log(`[app.env] ${app.env}`);
} else {
	app.listen(port);
}

module.exports = app;
