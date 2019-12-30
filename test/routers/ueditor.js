// UEditor server
// Ref: http://fex.baidu.com/ueditor/#dev-request_specification
'use strict';


const config = require('../config');

const fs = require('fs');
const path = require('path');
const url = require('url');
const busboy = require('co-busboy')
const request = require('request');
const sharp = require('sharp');
const uuid = require('uuid');
const thunkify = require('thunkify');
const qiniu = require('qiniu');

const tempPath = require('os').tmpdir();

const imagePath = 'upload/editor/image';
const filePath = 'upload/editor/file';
const videoPath = 'upload/editor/video';


const router = require('koa-router')({
	prefix: '/ueditor',
});

const imageMaxDimension = 1200;


var qiniuMarkers = {};


router.get('/', async function(ctx, next) {
	if (ctx.query.action === 'config') {
		ctx.body = /* 前后端通信相关的配置,注释只允许使用多行方式 */ {
			/* 上传图片配置项 */
			"imageActionName": "uploadimage",
			/* 执行上传图片的action名称 */
			"imageFieldName": "upfile",
			/* 提交的图片表单名称 */
			"imageMaxSize": 4096000,
			/* 上传大小限制，单位B */
			"imageAllowFiles": [".png", ".jpg", ".jpeg", ".gif", ".bmp"],
			/* 上传图片格式显示 */
			"imageCompressEnable": true,
			/* 是否压缩图片,默认是true */
			"imageCompressBorder": imageMaxDimension,
			/* 图片压缩最长边限制 */
			"imageInsertAlign": "none",
			/* 插入的图片浮动方式 */
			"imageUrlPrefix": "",
			/* 图片访问路径前缀 */
			"imagePathFormat": "/ueditor/php/upload/image/{yyyy}{mm}{dd}/{time}{rand:6}",
			/* 上传保存路径,可以自定义保存路径和文件名格式 */
			/* {filename} 会替换成原文件名,配置这项需要注意中文乱码问题 */
			/* {rand:6} 会替换成随机数,后面的数字是随机数的位数 */
			/* {time} 会替换成时间戳 */
			/* {yyyy} 会替换成四位年份 */
			/* {yy} 会替换成两位年份 */
			/* {mm} 会替换成两位月份 */
			/* {dd} 会替换成两位日期 */
			/* {hh} 会替换成两位小时 */
			/* {ii} 会替换成两位分钟 */
			/* {ss} 会替换成两位秒 */
			/* 非法字符 \ : * ? " < > | */
			/* 具请体看线上文档: fex.baidu.com/ueditor/#use-format_upload_filename */

			/* 涂鸦图片上传配置项 */
			"scrawlActionName": "uploadscrawl",
			/* 执行上传涂鸦的action名称 */
			"scrawlFieldName": "upfile",
			/* 提交的图片表单名称 */
			"scrawlPathFormat": "/ueditor/php/upload/image/{yyyy}{mm}{dd}/{time}{rand:6}",
			/* 上传保存路径,可以自定义保存路径和文件名格式 */
			"scrawlMaxSize": 2048000,
			/* 上传大小限制，单位B */
			"scrawlUrlPrefix": "",
			/* 图片访问路径前缀 */
			"scrawlInsertAlign": "none",

			/* 截图工具上传 */
			"snapscreenActionName": "uploadimage",
			/* 执行上传截图的action名称 */
			"snapscreenPathFormat": "/ueditor/php/upload/image/{yyyy}{mm}{dd}/{time}{rand:6}",
			/* 上传保存路径,可以自定义保存路径和文件名格式 */
			"snapscreenUrlPrefix": "",
			/* 图片访问路径前缀 */
			"snapscreenInsertAlign": "none",
			/* 插入的图片浮动方式 */

			/* 抓取远程图片配置 */
			"catcherLocalDomain": ["127.0.0.1", "localhost", "img.baidu.com"],
			"catcherActionName": "catchimage",
			/* 执行抓取远程图片的action名称 */
			"catcherFieldName": "source",
			/* 提交的图片列表表单名称 */
			"catcherPathFormat": "/ueditor/php/upload/image/{yyyy}{mm}{dd}/{time}{rand:6}",
			/* 上传保存路径,可以自定义保存路径和文件名格式 */
			"catcherUrlPrefix": "",
			/* 图片访问路径前缀 */
			"catcherMaxSize": 2048000,
			/* 上传大小限制，单位B */
			"catcherAllowFiles": [".png", ".jpg", ".jpeg", ".gif", ".bmp"],
			/* 抓取图片格式显示 */

			/* 上传视频配置 */
			"videoActionName": "uploadvideo",
			/* 执行上传视频的action名称 */
			"videoFieldName": "upfile",
			/* 提交的视频表单名称 */
			"videoPathFormat": "/ueditor/php/upload/video/{yyyy}{mm}{dd}/{time}{rand:6}",
			/* 上传保存路径,可以自定义保存路径和文件名格式 */
			"videoUrlPrefix": "",
			/* 视频访问路径前缀 */
			"videoMaxSize": 102400000,
			/* 上传大小限制，单位B，默认100MB */
			"videoAllowFiles": [
				".flv", ".swf", ".mkv", ".avi", ".rm", ".rmvb", ".mpeg", ".mpg",
				".ogg", ".ogv", ".mov", ".wmv", ".mp4", ".webm", ".mp3", ".wav", ".mid"
			],
			/* 上传视频格式显示 */

			/* 上传文件配置 */
			"fileActionName": "uploadfile",
			/* controller里,执行上传视频的action名称 */
			"fileFieldName": "upfile",
			/* 提交的文件表单名称 */
			"filePathFormat": "/ueditor/php/upload/file/{yyyy}{mm}{dd}/{time}{rand:6}",
			/* 上传保存路径,可以自定义保存路径和文件名格式 */
			"fileUrlPrefix": "",
			/* 文件访问路径前缀 */
			"fileMaxSize": 51200000,
			/* 上传大小限制，单位B，默认50MB */
			"fileAllowFiles": [
				".png", ".jpg", ".jpeg", ".gif", ".bmp",
				".flv", ".swf", ".mkv", ".avi", ".rm", ".rmvb", ".mpeg", ".mpg",
				".ogg", ".ogv", ".mov", ".wmv", ".mp4", ".webm", ".mp3", ".wav", ".mid",
				".rar", ".zip", ".tar", ".gz", ".7z", ".bz2", ".cab", ".iso",
				".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf", ".txt", ".md", ".xml"
			],
			/* 上传文件格式显示 */

			/* 列出指定目录下的图片 */
			"imageManagerActionName": "listimage",
			/* 执行图片管理的action名称 */
			"imageManagerListPath": "/ueditor/php/upload/image/",
			/* 指定要列出图片的目录 */
			"imageManagerListSize": 20,
			/* 每次列出文件数量 */
			"imageManagerUrlPrefix": "",
			/* 图片访问路径前缀 */
			"imageManagerInsertAlign": "none",
			/* 插入的图片浮动方式 */
			"imageManagerAllowFiles": [".png", ".jpg", ".jpeg", ".gif", ".bmp"],
			/* 列出的文件类型 */

			/* 列出指定目录下的文件 */
			"fileManagerActionName": "listfile",
			/* 执行文件管理的action名称 */
			"fileManagerListPath": "/ueditor/php/upload/file/",
			/* 指定要列出文件的目录 */
			"fileManagerUrlPrefix": "",
			/* 文件访问路径前缀 */
			"fileManagerListSize": 20,
			/* 每次列出文件数量 */
			"fileManagerAllowFiles": [
				".png", ".jpg", ".jpeg", ".gif", ".bmp",
				".flv", ".swf", ".mkv", ".avi", ".rm", ".rmvb", ".mpeg", ".mpg",
				".ogg", ".ogv", ".mov", ".wmv", ".mp4", ".webm", ".mp3", ".wav", ".mid",
				".rar", ".zip", ".tar", ".gz", ".7z", ".bz2", ".cab", ".iso",
				".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf", ".txt", ".md", ".xml"
			] /* 列出的文件类型 */

		};
	} else if (ctx.query.action === 'listimage') {
		ctx.body = await qiniuList(imagePath, ctx.query.start, ctx.query.size);
	} else if (ctx.query.action === 'listfile') {
		ctx.body = await qiniuList(filePath, ctx.query.start, ctx.query.size);
	} else {
		ctx.body = {
			'state': 'FAIL'
		};
	}
});


router.post('/', async function(ctx, next) {
	if (ctx.query.action === 'uploadimage' //
		||
		ctx.query.action === 'uploadfile' //
		||
		ctx.query.action === 'uploadvideo' //
	) {
		const parts = busboy(ctx);
		if (!parts) {
			ctx.body = {
				'state': 'FAIL',
			};

			return;
		}

		const part = await parts();
		if (!part || !part.pipe) {
			ctx.body = {
				'state': 'FAIL',
			};

			return;
		}

		const name = part.filename || 'Uploaded';

		let prefix;
		if (ctx.query.action === 'uploadimage') {
			prefix = imagePath;
		} else if (ctx.query.action === 'uploadfile') {
			prefix = filePath;
		} else if (ctx.query.action === 'uploadvideo') {
			prefix = videoPath;
		}
		let key = prefix + '/' + uuid();

		let fileName = path.join(tempPath, uuid());
		part.pipe(fs.createWriteStream(fileName));

		var fileNameNoWebP = await convertWebP(fileName);
		var fileNameResize = await convertResize(fileNameNoWebP);

		var uploadResult = await qiniuUpload(key, fileNameResize);

		if (uploadResult && uploadResult.key) {
			ctx.body = {
				'state': 'SUCCESS',
				'url': url.resolve(config.qiniuBucketUrl, uploadResult.key),
				'title': name,
				'original': name,
			};
		} else {
			ctx.body = {
				'state': 'FAIL',
			};
		}
	} else if (ctx.query.action === 'catchimage') {
		const body = ctx.request.body;
		if (!body) {
			ctx.body = {
				'state': 'FAIL',
			};

			return;
		}

		const source = body['source'];
		if (!source || !source.length) {
			ctx.body = {
				'state': 'FAIL',
			};

			return;
		}

		var funcs = [];
		for (var i in source) {
			var remoteUrl = source[i];
			if (!remoteUrl) {
				continue;
			}

			funcs.push(uploadCatchImage(i, remoteUrl));
		}
		var uploadResults = await Promise.all(funcs);

		var list = [];
		for (var i in source) {
			var remoteUrl = source[i];
			if (!remoteUrl) {
				continue;
			}

			var uploadResult = uploadResults[i];
			if (uploadResult && uploadResult.key) {
				list.push({
					'state': 'SUCCESS',
					'url': url.resolve(config.qiniuBucketUrl, uploadResult.key),
					'source': remoteUrl,
				});
			}
		}

		ctx.body = {
			'state': 'SUCCESS',
			'list': list,
		};
	} else if (ctx.query.action === 'uploadscrawl') {}
});


async function uploadCatchImage(i, remoteUrl) {
	try {
		var fileName = await fetchRemoteUrl(remoteUrl);
		var fileNameNoWebP = await convertWebP(fileName);
		var fileNameResize = await convertResize(fileNameNoWebP);

		var key = imagePath + '/' + uuid();
		var uploadResult = await qiniuUpload(key, fileNameResize);

		return uploadResult || {};
	} catch (err) {
		console.error(err);
		return {};
	}
}


async function fetchRemoteUrl(remoteUrl) {
	return await new Promise((resolve, reject) => {
		request.head(remoteUrl, function(err, res, body) {
			const fileName = path.join(tempPath, uuid());
			request(remoteUrl).pipe(fs.createWriteStream(fileName)).on('close', function(err) {
				if (err) {
					reject(err);
				} else {
					resolve(fileName);
				}
			});
		});
	});
}


// 如果文件是WebP图片，转为JPG或PNG
async function convertWebP(fileName) {
	var image = sharp(fileName);
	if (!image) {
		return fileName;
	}

	try {
		var imageMetadata = await image.metadata();
		if (imageMetadata && imageMetadata.format === 'webp') {
			const outFormat = imageMetadata.hasAlpha ? 'png' : 'jpeg';
			const newFileName = path.join(tempPath, uuid());
			await image.toFormat(outFormat).toFile(newFileName);
			return newFileName;
		} else {
			return fileName;
		}
	} catch (err) {
		return fileName;
	}
}


// 如果文件太大，则进行缩小
async function convertResize(fileName) {
	var image = sharp(fileName);
	if (!image) {
		return fileName;
	}

	var imageMetadata = await image.metadata();
	if (imageMetadata && imageMetadata.format === 'gif') {
		return fileName;
	}

	try {
		const newFileName = path.join(tempPath, uuid());
		await image.resize(imageMaxDimension, imageMaxDimension, { fit: 'inside', withoutEnlargement: true }).toFile(newFileName);
		return newFileName;
	} catch (err) {
		console.error(err)
		return fileName;
	}
}


async function qiniuUpload(key, fileName) {

	var putPolicy = new qiniu.rs.PutPolicy(config.qiniuBucket + ":" + key);
	var token = putPolicy.token();
	var extra = new qiniu.io.PutExtra();

	return await new Promise((resolve, reject) => {
		qiniu.io.putFile(token, key, fileName, extra, (err, ret) => {
			if (err) {
				reject(err);
			} else {
				resolve(ret);
			}
		});
	});
}


async function qiniuList(list_dir, start, size) {
	const marker = qiniuMarkers[start] || '';

	const result = await new Promise((resolve, reject) => {
		qiniu.rsf.listPrefix(config.qiniuBucket, list_dir || '', marker, size, '', (err, ret) => {
			if (err) {
				reject(err);
			} else {
				resolve(ret);
			}
		});
	});

	var list = [];
	var count = 0;
	if (result && result.items) {
		result.items.forEach((e) => {
			list.push({ url: url.resolve(config.qiniuBucketUrl, e.key) })
		});

		count = list.length;

		if (result.marker) {
			qiniuMarkers[start + count] = result.marker;
		}
	}

	return {
		'state': 'SUCCESS',
		'list': list,
		'start': start,
		'total': count,
	};
}


module.exports = router;
