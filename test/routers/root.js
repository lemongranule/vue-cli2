'use strict';

const config = require('../config');
const router = require('koa-router')();
const moment = require('moment');
const axios = require('axios');


router.get('/', async (ctx, next) => {
	ctx.body = await ctx.render('index', {
		staticRoot: ctx.staticRoot,
		config,
	});
});

router.get('/info', async (ctx, next) => {
	ctx.body = {
		version: config.version,
	};
});


router.get('/now', async (ctx, next) => {
	ctx.body = {
		utcMsec: +moment().utc(), // 单位毫秒
		utcOffset: moment().utcOffset(), // 单位分钟
	};
});

module.exports = router;
