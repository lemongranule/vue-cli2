'use strict'
// Template version: 1.3.1
// see http://vuejs-templates.github.io/webpack for documentation.

const path = require('path')


const base = {
    port: 6791,
    staticRoot: '/static',
    staticRootHttps: '/static',
    appDownloadUrl: "http://a.app.qq.com/o/simple.jsp?pkgname=com.tttell.xmx",

    leancloudAppId: "YmC8Hch4IJGg6DB1L7qTCJtF-gzGzoHsz",
    leancloudAppKey: "8QqMudAT04q0OyIi02zBdSGi",

    qiniuBucket: "xiaomoxie-static",
    qiniuBucketUrl: "https://xmx-static.tttell.com",
    qiniuAccessKey: "sooib1GN4YUusrH9WKZSPJmDZeLfjT10GaEWmov4",
    qiniuSecretKey: "gqOuYFv7XXxq5_csNqRpFKDB34h9q7lTbqnwoZRw",
    qiniuThumb: "imageView2/1/w/200/h/200/q/75",

    umengAppKeyIOS: "57eb67d267e58ed06800007c",
    umengAppMasterSecretIOS: "hb5oqwr5q8xug6zvvrlw1k58rlmvmkzw",
    umengAppKeyAndroid: "57ebf5d367e58ea42700060e",
    umengAppMasterSecretAndroid: "h3vhhnllhvnpayk0klak56jsnq8mtgej",
};


const dev = Object.assign({}, base, {
    processes: 1,
    env: require('./dev.env'),
    domain: 'localhost:6791',
    apiDomain: 'tttell.com/xmx/api',
});


const prod = Object.assign({}, base, {
    processes: -1,
    env: require('./prod.env'),
    domain: 'tttell.com/xmx/manager',
    staticRoot: '/xmx/manager/static',
    staticRootHttps: '/xmx/manager/static',
    apiDomain: 'tttell.com/xmx/api',
});

const config = process.env.NODE_ENV === 'production' ? prod : dev;

// 读取资源映射文件 assets.json
const defaultAssets = { manifest: {}, vendor: {}, app: {}, signin: {}, apikit: {}, };
try {
    let assets = require('../assets.json');
    config.assets = assets || defaultAssets;
} catch (err) {
    config.assets = defaultAssets;
}
console.log(config)
module.exports = config;
