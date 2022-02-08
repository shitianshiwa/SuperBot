const rp = require('request-promise');
const api = require('./api');//有日志功能
const axios = require('axios-https-proxy-fix');
const MD5 = require('js-md5');
const sha256 = require('js-sha256');
const dayjs = require('dayjs');
const config = require('../config');
const schedule = require('node-schedule');

//const PROXY_CONF = config.default.proxy; //发现套了一个default。。！

const appId1 = config.plugin.rss.translate.youdao.appid;
const appKey1 = config.plugin.rss.translate.youdao.key;
const appId2 = config.plugin.rss.translate.baidu.appid;
const appKey2 = config.plugin.rss.translate.baidu.key;
const node_localStorage = require('node-localstorage').LocalStorage;
const fanyitemp1 = new node_localStorage('./translate/fanyi1');
const fanyitemp2 = new node_localStorage('./translate/fanyi2');
const fanyitemp3 = new node_localStorage('./translate/fanyi3');
const fanyitemp11 = new node_localStorage('./translate/fangyitemp1');
const fanyitemp22 = new node_localStorage('./translate/fangyitemp2');
const fanyitemp33 = new node_localStorage('./translate/fangyitemp3');
const fanyi1day = new node_localStorage('./translate/fanyi1day'); //有道翻译单日统计
const fanyi2day = new node_localStorage('./translate/fanyi2day'); //百度翻译单日统计
const fanyi3day = new node_localStorage('./translate/fanyi3day'); //腾讯翻译单日统计
//---------------------
const TENCENT_TRANS_INIT = "https://fanyi.qq.com/";
const TENCENT_TRANS_API = "https://fanyi.qq.com/api/translate";
let REAAUTH_URL = "";
let reauthuri = "";
const admin = config.owner;//用于私聊机器人主人用
let qtv = "";
let qtk = "";
let fy_guid = "";
var proxy2 = false;
let timer = null;
let reaauth2 = 3;
let initialise2 = 3;
/*if (PROXY_CONF.host.length > 0 && PROXY_CONF.port !== 0) {
    proxy2 = {
        host: PROXY_CONF.host,
        port: PROXY_CONF.port
    }
}*/

//const utf8 = require('utf8');
/*
https://www.npmjs.com/package/utf8
https://www.it1352.com/1685382.html
utf-8转码
*/
//const crypto = require('crypto');
//const saltKey = '123456';

//const truncate = require('truncate');
//const from = 'auto';
//const to = 'zh-CHS';


/*版权声明：本文为CSDN博主「AdleyTales」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
原文链接：https://blog.csdn.net/adley_app/java/article/details/88825270*/
//弄一个翻译数据库代替文本文件

function truncate(q) {
    var len = q.length;
    if (len <= 20) return q;
    return q.substring(0, 10) + len + q.substring(len - 10, len);
}

function unescape(text) {
    return text.replace(/&amp;/g, "&").replace(/&#91;/g, "[").replace(/&#93;/g, "]")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function httpHeader(with_cookie = false) {
    let headers = {
        "Host": "fanyi.qq.com",
        "Origin": "https://fanyi.qq.com",
        "Referer": "https://fanyi.qq.com",
        "DNT": 1,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36"
    }
    if (with_cookie) headers.cookie = `qtv=${qtv}; qtk=${qtk}; fy_guid=${fy_guid};`
    return headers;
}

function initialise() {
    axios({
        url: TENCENT_TRANS_INIT,
        method: "GET",
        proxy: proxy2,
        headers: httpHeader()
    }).then(res => {
        //api.logger.info("腾讯翻译1:\n" + JSON.stringify(res.headers));
        fy_guid = /fy_guid=(.+?); /.exec(res.headers["set-cookie"])[1];
        reauthuri = /reauthuri = "(.+?)";/.exec(res.data)[1]; //获取动态api名
        REAAUTH_URL = "https://fanyi.qq.com/api/" + reauthuri;
        //api.logger.info(res.data);
        api.logger.info("reauthuri:" + REAAUTH_URL);
        reaauth(false); //首次params参数为""

        // 最大1分钟
        if (timer == null) {
            timer = setInterval(reaauth, 60 * 1000); //每45s运行一次
        } else {
            clearInterval(timer);
            timer = null;
            timer = setInterval(reaauth, 60 * 1000);
        }
        initialise2 = 3;
        api.logger.info("腾讯翻译初始化完成");
    }).catch(err => {
        try {
            api.logger.error(new Date().toString() + " ,腾讯翻译1： " + JSON.stringify(err));
        } catch (error) {
            api.logger.error(new Date().toString() + " ,腾讯翻译1x： " + err);
        }
        if (initialise2 > 0) {
            setTimeout(initialise, 5000);
            initialise2--;
        } else {
            errorx = true;
            if (timer != null) {
                clearInterval(timer);
                timer = null;
            }
            clearInterval(renewToken);
            renewToken = null;
            api.logger.error("获取腾讯翻译鉴权失败1，腾讯翻译已停止运行！");
            api.bot.socket.send.private(`获取腾讯翻译鉴权失败1，腾讯翻译已停止运行！`, admin, false);
        }
    });
}

function reaauth(qt = true) {
    axios({
        url: REAAUTH_URL,
        method: "POST",
        proxy: proxy2,
        headers: httpHeader(),
        data: qt ? {
            qtv: qtv,
            qtk: qtk
        } : "" //首次params参数为""
    }).then(res => {
        //api.logger.info("腾讯翻译2:\n" + JSON.stringify(res.data));
        qtv = res.data.qtv;
        qtk = res.data.qtk;
        reaauth2 = 3;
    }).catch(err => {
        try {
            api.logger.error(new Date().toString() + " ,腾讯翻译2： " + JSON.stringify(err));
        } catch (error) {
            api.logger.error(new Date().toString() + " ,腾讯翻译2x： " + err);
        }
        if (reaauth2 >= 0) {
            setTimeout(reaauth, 1000);
            reaauth2 = reaauth2 - 1;
        } else {
            errorx = true;
            clearInterval(timer);
            timer = null;
            clearInterval(renewToken);
            renewToken = null;
            api.logger.error("获取腾讯翻译鉴权失败3，腾讯翻译已停止运行！");
            api.bot.socket.send.private(`获取腾讯翻译鉴权失败3，腾讯翻译已停止运行！`, admin, false);
        }
    });
}

module.exports = async (str, id, youdao = false, baidu = false, tx = false) => {
    //console.log(sourceText.replace(/\[CQ:image.*?\]/g,""));//清理图片CQ码
    //console.log(sourceText.replace(/(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/g, ''));//清理链接
    let query = str.replace(/(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/g, '').replace("#", "\n#").replace('\n\n#', '\n#').trim(); //trim可以去掉开头结尾的空格
    query = query.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]/g, "");//过滤Emoji
    //https://blog.csdn.net/libin_1/article/details/51483815 JavaScript正则表达式大全（过滤Emoji的最佳实践）
    //https://blog.csdn.net/TKG09/article/details/53309455 js判断与过滤emoji表情的方法
    let temp5 = "";
    let result = "";
    if (query == "") {
        return "";
    } else {
        temp5 = query;
    }
    temp5 = temp5.trim();
    api.logger.info("1." + query)
    api.logger.info("2." + temp5)
    if (youdao == true) {
        let temp3 = await fanyitemp11.getItem(id);
        if (temp3 != null) {
            api.logger.info("使用有道翻译缓存")
            result += "\n(缓存)有道翻译:\n" + temp3;
        } else {
            api.logger.info("使用有道翻译api")
            const salt1 = (new Date).getTime(); //毫秒 https://code-examples.net/zh-CN/q/3606e
            //api.logger.info(salt1);
            const curTime1 = Math.round(new Date().getTime() / 1000); //https://code-examples.net/zh-CN/q/3606e
            const str1 = appId1 + truncate(temp5) + salt1 + curTime1 + appKey1;
            api.logger.info(truncate(temp5));
            api.logger.info(str1);
            const sign1 = sha256(str1);
            api.logger.info(sign1);
            result += await new Promise((resolve, reject) => {
                rp.get('https://openapi.youdao.com/api', {
                    qs: {
                        q: temp5,
                        appKey: appId1,
                        salt: salt1,
                        from: 'auto',
                        to: 'zh-CHS',
                        sign: sign1,
                        signType: 'v3',
                        curtime: curTime1
                    },
                    json: true
                }).then(async data => {
                    if (data.errorCode === '0') {
                        let tempday = await fanyi1day.getItem("success"); //单日使用计数
                        let temp2day = await fanyi1day.getItem("zishu");
                        if (tempday == null) {
                            tempday = 0;
                        }
                        if (temp2day == null) {
                            temp2day = 0;
                        }
                        tempday++;
                        temp2day = parseInt(temp2day) + temp5.length;
                        await fanyi1day.setItem("success", tempday);
                        await fanyi1day.setItem("zishu", temp2day);

                        let temp = await fanyitemp1.getItem("success"); //累计使用计数
                        let temp2 = await fanyitemp1.getItem("zishu");
                        if (temp == null) {
                            temp = 0;
                        }
                        if (temp2 == null) {
                            temp2 = 0;
                        }
                        temp++;
                        temp2 = parseInt(temp2) + temp5.length;
                        await fanyitemp1.setItem("success", temp);
                        await fanyitemp1.setItem("zishu", temp2);
                        await fanyitemp11.setItem(id, data.translation.join('\n'));
                        api.logger.info("有道翻译的结果：" + data.translation[0]);
                        resolve("有道翻译:" + data.translation.join('\n'));
                    } else {
                        let temp = await fanyitemp1.getItem("fail")
                        if (temp == null) {
                            temp = 0;
                        }
                        temp++;
                        await fanyitemp1.setItem("fail", temp);

                        let temp2 = await fanyi1day.getItem("fail");
                        if (temp2 == null) {
                            temp2 = 0;
                        }
                        temp2++;
                        await fanyi1day.setItem("fail", temp2);

                        let t = new Date();
                        api.logger.info.error(temp + ". " + '有道翻译出错:' + t.toString() + dayjs(t.toString()).format(' A 星期d') + JSON.stringify(data));
                        resolve("");
                        //reject(temp + ". " + "有道翻译出错");
                    }
                }).catch(async e => {
                    let temp = await fanyitemp1.getItem("bigfail"); //累计大错误计数
                    if (temp == null) {
                        temp = 0;
                    }
                    temp++;
                    await fanyitemp1.setItem("bigfail", temp);

                    let temp2 = await fanyi1day.getItem("bigfail"); //单日大错误计数
                    if (temp2 == null) {
                        temp2 = 0;
                    }
                    temp2++;
                    await fanyi1day.setItem("bigfail", temp2);
                    let t = new Date();
                    api.logger.error(temp + ". " + '有道翻译大出错:' + t.toString() + dayjs(t.toString()).format(' A 星期d') + e);
                    resolve("");
                    //reject(temp + ". " + "有道翻译大出错");
                })
            });
        }
    }
    if (baidu == true) {
        //result += "\n";
        let temp3 = await fanyitemp22.getItem(id);
        if (temp3 != null) {
            api.logger.info("使用百度翻译缓存")
            result += "\n(缓存)百度翻译:\n" + temp3;
        } else {
            api.logger.info("使用百度翻译api")
            const salt2 = (new Date).getTime();
            api.logger.info(salt2);
            const str2 = appId2 + temp5 + salt2 + appKey2;
            const sign2 = MD5(str2);
            result += await new Promise((resolve, reject) => {
                rp.get('https://fanyi-api.baidu.com/api/trans/vip/translate', {
                    qs: {
                        q: temp5,
                        from: 'auto',
                        to: 'zh',
                        appid: appId2,
                        salt: salt2,
                        sign: sign2,
                    },
                    json: true
                }).then(async data => {
                    //api.logger.info(JSON.stringify(data.trans_result));
                    let tempday = await fanyi2day.getItem("success");
                    let temp2day = await fanyi2day.getItem("zishu"); //单日使用计数
                    if (tempday == null) {
                        tempday = 0;
                    }
                    if (temp2day == null) {
                        temp2day = 0;
                    }
                    tempday++;
                    temp2day = parseInt(temp2day) + temp5.length;
                    await fanyi2day.setItem("success", tempday);
                    await fanyi2day.setItem("zishu", temp2day);

                    let temp = await fanyitemp2.getItem("success") //累计使用计数
                    let temp2 = await fanyitemp2.getItem("zishu")
                    if (temp == null) {
                        temp = 0;
                    }
                    if (temp2 == null) {
                        temp2 = 0;
                    }
                    temp++;
                    api.logger.info("字数：" + id + "," + temp5.length);
                    temp2 = parseInt(temp2) + temp5.length;
                    await fanyitemp2.setItem("success", temp);
                    await fanyitemp2.setItem("zishu", temp2);
                    let temp3 = "";
                    let temp4 = data.trans_result;
                    api.logger.info("百度翻译的结果：" + JSON.stringify(temp4));
                    for (let i = 0; i < temp4.length; i++) {
                        temp3 += temp4[i].dst + (i < temp4.length - 1 ? "\n" : "");
                    }
                    await fanyitemp22.setItem(id, temp3);
                    resolve("\n百度翻译:" + temp3 + "\n");
                    /*if (data.errorCode === '0') {
                        
                    } else {
                        let temp = await fanyitemp2.getItem("fail")
                        temp++;
                        await fanyitemp2.setItem("fail", temp);
                        api.logger.info.error(temp + ". " + '百度翻译出错:' + JSON.stringify(data));
                        reject(temp + ". " + "百度翻译出错");
                    }*/
                }).catch(async e => {
                    let temp = await fanyitemp2.getItem("bigfail") //累计大错误计数
                    if (temp == null) {
                        temp = 0;
                    }
                    temp++;
                    await fanyitemp2.setItem("bigfail", temp);

                    let temp2 = await fanyi2day.getItem("bigfail") //单日大错误计数
                    if (temp2 == null) {
                        temp2 = 0;
                    }
                    temp2++;
                    await fanyi2day.setItem("bigfail", temp2);

                    let t = new Date();
                    api.logger.info.error(temp + ". " + '百度翻译大出错:' + t.toString() + dayjs(t.toString()).format(' A 星期d') + e);
                    resolve("");
                    //reject(temp + ". " + "百度翻译大出错");
                })
            });
        }

    }
    if (tx == true) {
        let temp3 = await fanyitemp33.getItem(id);
        if (temp3 != null) {
            api.logger.info("使用腾讯翻译缓存")
            result += "\n(缓存)腾讯翻译:\n" + temp3;
        } else {
            result += await new Promise((resolve, reject) => {
                axios({
                    url: TENCENT_TRANS_API,
                    method: "POST",
                    proxy: proxy2,
                    headers: httpHeader(true),
                    data: {
                        "qtk": qtk,
                        "qtv": qtv,
                        "source": "auto",
                        "target": "zh",
                        "sourceText": unescape(temp5),
                        "sessionUuid": "translate_uuid" + new Date().getTime()
                    }
                }).then(async res => {
                    //api.logger.info("腾讯翻译3:\n" + JSON.stringify(res.data));
                    let targetText = "";
                    let tempday = await fanyi3day.getItem("success"); //单日使用计数
                    let temp3day = await fanyi3day.getItem("zishu");
                    if (tempday == null) {
                        tempday = 0;
                    }
                    if (temp3day == null) {
                        temp3day = 0;
                    }
                    tempday++;
                    temp3day = parseInt(temp3day) + temp5.length;
                    await fanyi3day.setItem("success", tempday);
                    await fanyi3day.setItem("zishu", temp3day);

                    let temp = await fanyitemp3.getItem("success"); //累计使用计数
                    let temp2 = await fanyitemp3.getItem("zishu");
                    if (temp == null) {
                        temp = 0;
                    }
                    if (temp2 == null) {
                        temp2 = 0;
                    }
                    temp++;
                    temp2 = parseInt(temp2) + temp5.length;
                    await fanyitemp3.setItem("success", temp);
                    await fanyitemp3.setItem("zishu", temp2);
                    for (let i in res.data.translate.records) {
                        targetText += unescape(res.data.translate.records[i].targetText);
                    }
                    await fanyitemp33.setItem(id, targetText);
                    api.logger.info("腾讯翻译的结果: " + targetText);
                    resolve("\n腾讯翻译:" + targetText + "\n");
                }).catch(async err => {
                    let temp = await fanyitemp3.getItem("bigfail")
                    if (temp == null) {
                        temp = 0;
                    }
                    temp++;
                    await fanyitemp3.setItem("bigfail", temp);
                    let temp2 = await fanyi3day.getItem("bigfail");
                    if (temp2 == null) {
                        temp2 = 0;
                    }
                    temp2++;
                    await fanyi3day.setItem("bigfail", temp2);
                    try {
                        api.logger.error(new Date().toString() + " ,腾讯翻译4: " + JSON.stringify(err));
                    } catch (error) {
                        api.logger.error(new Date().toString() + " ,腾讯翻译4x: " + err);
                    }
                    resolve("");
                })
            });
        }
    }
    return result;
}
if (config.plugin.rss.translate.tx.translate == true) {
    initialise();
}
//console.log("2333");
let renewToken = setInterval(initialise, 3600 * 1000); //一小时

/*setTimeout(() => {
    api.bot.socket.send.private(`33333333333333333333333333333333`, admin, false);
}, 5000)*/
var j = schedule.scheduleJob('0 0 0 * * *' /*rule*/, async function () {
    let tempday1 = await fanyi1day.getItem("success"); //有道翻译2
    await fanyi1day.setItem("success", 0);
    let temp2day1 = await fanyi1day.getItem("zishu");
    await fanyi1day.setItem("zishu", 0);
    let failtemp1 = await fanyi1day.getItem("fail");
    await fanyi1day.setItem("fail", 0);
    let bigfailtemp1 = await fanyi1day.getItem("bigfail");
    await fanyi1day.setItem("bigfail", 0);

    let tempday2 = await fanyi2day.getItem("success"); //百度翻译2
    await fanyi2day.setItem("success", 0);
    let temp2day2 = await fanyi2day.getItem("zishu");
    await fanyi2day.setItem("zishu", 0);
    let bigfailtemp2 = await fanyi2day.getItem("bigfail");
    await fanyi2day.setItem("bigfail", 0);

    let tempday3 = await fanyi3day.getItem("success"); //腾讯翻译2
    await fanyi3day.setItem("success", 0);
    let temp3day3 = await fanyi3day.getItem("zishu");
    await fanyi3day.setItem("zishu", 0);
    let bigfailtemp3 = await fanyi3day.getItem("bigfail");
    await fanyi3day.setItem("bigfail", 0);

    api.bot.socket.send.private(`今日有道翻译2：\n使用次数：${tempday1}\n使用字数：${temp2day1}\n失败次数：${failtemp1}\n大失败次数：${bigfailtemp1}\n今日百度翻译2：\n使用次数：${tempday2}\n使用字数：${temp2day2}\n大失败次数：${bigfailtemp2}\n今日腾讯翻译2：\n使用次数：${tempday3}\n使用字数：${temp3day3}\n大失败次数：${bigfailtemp3}`, admin, false);
    let t = new Date();
    api.logger.info('翻译字数统计：' + `今日有道翻译2：\n使用次数：${tempday1}\n使用字数：${temp2day1}\n失败次数：${failtemp1}\n大失败次数：${bigfailtemp1}\n今日百度翻译2：\n使用次数：${tempday2}\n使用字数：${temp2day2}\n大失败次数：${bigfailtemp2}\n今日腾讯翻译2：\n使用次数：${tempday3}\n使用字数：${temp3day3}\n大失败次数：${bigfailtemp3}` + t.toString() + dayjs(t.toString()).format(' A 星期d').replace("星期0", "星期天"));
});
//j.cancel();
//https://www.cnblogs.com/ytu2010dt/p/5486854.html
//nodejs 回调地狱解决 promise async