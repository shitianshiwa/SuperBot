const path = require('path');
const fs = require('fs');
const rss = require('rss-parser');
const admin = require('../lib/admin');
const api = require('../lib/api')
const dbDir = path.join(__dirname, '../db2');
const low = require('lowdb');
const _ = require('lodash'); // https://www.lodashjs.com 是一个一致性、模块化、高性能的 JavaScript 实用工具库。
const config = require('../config');
const dayjs = require('dayjs');
const canvas = require('canvas');
canvas.registerFont('simhei.ttf', {
    family: 'SimHei'
});
const context = canvas.createCanvas(1, 1).getContext("2d");
context.font = "400 28px SimHei";
//const canvas = require('canvas');
const tieba = require("../lib/rss/tieba");
const dizhen = require("../lib/rss/dizhen");
const github = require("../lib/rss/github");

//需要加上文本内容比较，防止忽略订阅有更新
//需要加上item比较防止推送已有的订阅
//json数据库
//const isCi = (process.argv.indexOf('ci') !== -1);
//if (isCi) return;
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir); //创建存放文件夹
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(dbDir, 'db2.json'));
const defaults = {
    rss: {}
}
const db2 = low(adapter);
const n = {};
const parser = new rss();
//db._.mixin(lodashId);
db2.defaults(defaults).write();
let key = [];
let val = String("feed");
let obj = {};
obj[val] = key;
db2.read().get('rss').defaults(obj).write();
const check_interval = config.plugin.rss.check_interval;
const cd = config.plugin.rss.cd;

let update2 = false;
const update = async() => {
    api.logger.info(`RSS 开始更新订阅`);
    let ii = 0;
    if (update2 == true) {
        return;
    }
    update2 = true;
    const r = await db2.read().get(`rss[feed]`).value();
    checkEach();
    //console.log(r.length);

    function checkEach() {
        if (r[ii] == undefined) {
            return;
        }
        setTimeout(async function() {
            if (r.length > 0) {
                let rss = new Array();
                api.logger.info(r[ii].url);
                //console.log(r[ii].url);
                if (r[ii].status == "enable") {
                    rss = await new Promise(async function(resolve, reject) {
                        parser.parseURL(r[ii].url).then(async rss_result => {
                            resolve(rss_result);
                        }).catch(e => {
                            api.logger.warn(`RSS 更新失败, url: ${r[ii].url}, err: ${JSON.stringify(e)}`);
                            resolve(null);
                        });
                    });
                    if (rss != null) {
                        try {
                            if (rss.items.length > 0) {
                                let id = "";
                                if (/\/huya\/live\//.test(r[ii].url)) {
                                    id = rss.items[0].guid;
                                } else {
                                    id = rss.items[0].link; //最新的
                                }
                                //console.log(id)
                                //console.log(r[ii]);
                                //console.log(r[ii].last_id)
                                //console.log(rss_result.items[0].link);
                                let index = 0;
                                let i = 0;
                                let s = "";
                                let s2 = "";
                                for (i = 0; i < rss.items.length; i++) { //判断更新了多少条
                                    //console.log(rss_result.items[i].link);
                                    if (r[ii].last_id == id) {
                                        break;
                                    } else {
                                        index++;
                                    }
                                }
                                s = `[RSS] 您订阅的 ${rss.title.trim()} 更新了\n`;
                                //let temp;
                                for (i = 0; i < index; i++) { //确认要更新多少后，开始转发
                                    //temp = /&lt;pre style=.*&gt;(.*)&lt;/.exec(rss_result.items[i].content.trim());
                                    //console.log(rss_result.items[i]);
                                    s = s + [
                                        `标题${(i + 1).toString()}：${rss.items[i].title.trim()}`,
                                        `内容：${getcontentSnippet(rss.items[i].content.trim(), rss.items[i].link)}`,
                                        `链接：${rss.items[i].link}`,
                                        `最后更新时间：${dayjs(rss.items[i].pubDate).format('YYYY年M月D日 星期d ').replace("星期0", "星期天") + new Date(rss.items[i].pubDate).toTimeString().split("(")[0]}`
                                    ].join('\n') + "\n";
                                    s2 = s2 + `${rss.items[i].link}\n`;
                                    if (i < index - 1) {
                                        s += "\n";
                                    }
                                }
                                /*
                                {
                                    title: '',
                                    link: '',
                                    pubDate: '',
                                    author: '',
                                    content: '',
                                    contentSnippet: '',
                                    id: '',
                                    isoDate: ''
                                }
                                */
                                //console.log(groups.group);
                                //console.log("index:" + index);

                                if (index > 0) { //有更新才转发
                                    s = getshorttest(s);
                                    //console.log("getTextHeigth: " + getTextHeigth(s));
                                    //console.log("getTextWidth: " + getTextWidth(s));
                                    api.logger.debug(`${s}`);
                                    let base = canvas.createCanvas(getTextWidth(s), getTextHeigth(s));
                                    let ctx = base.getContext("2d");
                                    ctx.fillStyle = "#ECECF6";
                                    ctx.fillRect(0, 0, getTextWidth(s), getTextHeigth(s));
                                    // 填充文字
                                    ctx.fillStyle = "#000000";
                                    ctx.font = "400 28px SimHei";
                                    ctx.fillText(s, 50, 50);
                                    let img64 = base.toBuffer("image/jpeg", {
                                        quality: 1
                                    }).toString("base64");
                                    if (r[ii].cq == "false") //true为不解析，false为解析。。。。。
                                    {
                                        api.bot.socket.send.group(`[CQ:image,file=base64://${img64}]`, r[ii].group, false);
                                        api.bot.socket.send.group(s2, r[ii].group, false);
                                    } else { // 背景
                                        api.bot.socket.send.group(`[CQ:image,file=base64://${img64}]`, r[ii].group, false);
                                        api.bot.socket.send.group(s2, r[ii].group, false);
                                    }
                                    await db2.read().get(`rss[feed]`).find({
                                        id: r[ii].id
                                    }).assign({
                                        last_id: id
                                    }).write();
                                }
                            } else {
                                api.logger.info("rss为空，跳过订阅");
                            }
                        } catch (e) {
                            api.logger.warn(`RSS 更新错误, url: ${r[ii].url}, err: ${e}`);
                        }
                    }
                } else {
                    api.logger.info("跳过订阅");
                }

            }
            ii++;
            //console.log("ii:" + ii);
            if (ii < r.length) checkEach();
            else {
                api.logger.info(`RSS 订阅更新完成`);
                update2 = false;
            }
        }, cd); //按指定时间间隔获取信息
    }

    function getcontentSnippet(content, url) {
        let contentSnippet = content;
        //console.log(content.match(/href="(http|https):\/\/.*?"/g));
        let temp = content.match(/(href|src)="(http|https):\/\/.*?"/g); //获取链接
        let temp2 = ""; //获取链接
        let temp21 = new Array();
        let temp22;
        let temp3 = "";
        let i = 0;
        let ii = 0;
        if (temp != null) {
            for (i = 0; i < temp.length; i++) { //解决重复发送相同链接的bug
                temp22 = temp[i].replace(/(href|src)="/g, "").replace(/"/g, "");
                for (ii = 0; ii < temp21.length; ii++) {
                    if (temp22 == temp21[ii]) {
                        break;
                    }
                }
                if (ii == temp21.length) {
                    temp21.push(temp22);
                }
            }
            for (i = 0; i < temp21.length; i++) { //添加换行
                if (i < temp21.length - 1) {
                    temp2 += temp21[i] + "\n";
                } else {
                    temp2 += temp21[i];
                }
            }
        }
        contentSnippet = contentSnippet.replace(/<br>/g, "\n")
        if (url.search("tieba.baidu.com") != -1) {
            contentSnippet = tieba(contentSnippet);
        } else if (url.search("ceic.ac.cn") != -1) {
            contentSnippet = dizhen(contentSnippet);
        } else if (url.search("github.com") != -1) {
            contentSnippet = github(contentSnippet);
        }
        contentSnippet = contentSnippet.replace(/<br>/g, "\n")
        let temp4 = contentSnippet.split("\n");
        //console.log("temp4:" + temp4);
        if (temp4.length > 0) {
            for (i = 0; i < temp4.length; i++) {
                //console.log(i + "," + temp4[i]);
                if (temp4[i] != "") {
                    if (i < temp4.length - 1) {
                        temp3 += temp4[i] + "\n";
                    } else {
                        temp3 += temp4[i];
                    }
                }
            }
            contentSnippet = temp3
        }
        //contentSnippet = contentSnippet.replace(/<br>/g, "\n");
        //console.log(content.match(/"(http|https):\/\/.*?"/g));
        //https://www.runoob.com/jsref/jsref-match.html JavaScript match() 方法
        contentSnippet = contentSnippet.replace(/<p>/g, "").replace(/<\/p>/g, ""); //清理多于的html标签
        contentSnippet = contentSnippet.replace(/<code>/g, "").replace(/<\/code>/g, "");
        contentSnippet = contentSnippet.replace(/<em>/g, "").replace(/<\/em>/g, "");
        contentSnippet = contentSnippet.replace(/<strong>/g, "").replace(/<\/strong>/g, "");
        contentSnippet = contentSnippet.replace(/<pre.*?>/g, "").replace(/<\/pre>/g, "");
        contentSnippet = contentSnippet.replace(/<a.*?>/g, "").replace(/<\/a>/g, "");
        contentSnippet = contentSnippet.replace(/<img.*?>/g, "").replace(/<\/img>/g, "");
        contentSnippet = contentSnippet + "\n" + tieba(temp2); //补回解析出的链接
        return unescape(contentSnippet.trim());
    }

    /*function getZuiChangWenBen(text) {
        let max = 0;
        let s = text.split("\n");
        for (let i = 0; i < s.length; i++) {
            if (s[i].length * 24 > max) {
                max = s[i].length * 24;
            }
        }
        console.log("max: " + max);
        return max;
    }*/
    /**
     * https://blog.csdn.net/u012860063/article/details/53105658
     * JS 计算任意字符串宽度
     * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
     * 
     * @param {String} text The text to be rendered.
     * 
     * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
     */
    function getTextWidth(text) {
        return context.measureText(text).width + 100;
    }

    function getshorttest(text) {
        let len = 60;
        let temp,
            temp2 = "",
            temp3 = 0;
        text = text.split("\n");
        let i, i2, i3, i4, i5;
        for (i = 0; i < text.length; i++) {
            temp = "";
            i4 = len; //一行60字
            i5 = 0; //切割字符串初始位置
            if (text[i].length > len) {
                for (i2 = 0; i2 < parseInt(text[i].length / len); i2++) { //判断切割几次字符串`
                    temp3 = text[i].length - (text[i].length - i4);
                    //console.log(text[i].length + " ,temp3:" + temp3)
                    for (i3 = i5; i3 < temp3; i3++) { //获取指定分段字符串
                        temp = temp + text[i][i3];
                    }
                    temp += "\n"; //增加换行
                    i5 = i4; //切割开头
                    i4 += len; //切割结尾
                }
                for (i3 = len * parseInt(text[i].length / len); i3 < text[i].length; i3++) { //补上最后一部分字符串，解决丢失
                    temp = temp + text[i][i3];
                }
                temp += "\n"; //增加换行
            } else {
                temp = text[i] + "\n";
            }
            temp2 += temp;
        }
        return temp2;
    }

    function getTextHeigth(text) {
        let jishu = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] == "\n") {
                jishu++; //计算多少行
            }
        }
        return 29 * jishu + 60;
    }

    function unescape(str) {
        return str.replace(/&#44;/g, ',').replace(/&#91;/g, '[').replace(/&#93;/g, ']').replace(/(&amp;|&#38;)/g, '&').replace(/&gt;/g, ">").replace(/&#39;/g, "'");
    }
    //https://github.com/Tsuk1ko/cq-picsearcher-bot/blob/master/src/CQcode.js#L24
}

module.exports = {
        plugin: {
            name: 'RSS订阅器',
            desc: 'RSS订阅器',
            version: '0.0.1',
            author: '涂山苏苏'
        },
        events: {
            // 加载
            onload: (e) => {
                n.timer = setInterval(async() => {
                    await update();
                }, check_interval);
                api.logger.info(`RSS RSS订阅器开始运行`);
            },
            // 卸载
            onunload: (e) => {
                clearInterval(n.timer);
                api.logger.info(`RSS RSS订阅器停止运行`);
            }
        },
        commands: [{
                id: 'add',
                helper: '。rss add [链接]+[说明]+[开关解析CQ true/false]	添加订阅',
                command: /^。rss add (.*)$/,
                func: async(e) => {
                    const temp = e.msg.substr(9);
                    let link = temp.split("+")[0];
                    let s = "";
                    let s1 = "true";
                    if (temp.split("+").length == 3) {
                        s = temp.split("+")[1];
                        s1 = temp.split("+")[2];
                    }
                    /*
https://www.w3school.com.cn/js/jsref_substr.asp JavaScript substr() 方法
参数	描述
start	必需。要抽取的子串的起始下标。必须是数值。如果是负数，那么该参数声明从字符串的尾部开始算起的位置。也就是说，-1 指字符串中最后一个字符，-2 指倒数第二个字符，以此类推。
length	可选。子串中的字符数。必须是数值。如果省略了该参数，那么返回从 stringObject 的开始位置到结尾的字串。
*/
                    const group = e.group;
                    const sender = e.sender.user_id;

                    if (!admin.isAdmin(e.sender.user_id)) {
                        api.bot.socket.send.group('很抱歉，你不是机器人管理员，无权限操作！', e.group);
                        return;
                    }

                    if (/^(http(s)?:\/\/)\w+[^\s]+(\.[^\s]+){1,}$/g.test(link)) {
                        parser.parseURL(link).then(async e => {
                            if (await db2.read().get(`rss[feed]`).find({
                                    url: link,
                                    group: group
                                }).value() == undefined) {
                                let id = parseInt(new Date().getTime() / 1000);
                                await db2.read().get(`rss[feed]`)
                                    .push({
                                        id: id,
                                        url: link,
                                        s: s,
                                        group: group,
                                        user: sender,
                                        status: "enable",
                                        cq: s1,
                                        last_id: ""
                                    })
                                    .write();
                                api.bot.socket.send.group('[RSS] 订阅成功', group);
                            } else {
                                api.bot.socket.send.group('[RSS] 该rss已订阅', group);
                            }
                        }).catch(e => {
                            api.bot.socket.send.group('[RSS] 订阅失败：' + e, group);
                        });
                    } else {
                        api.bot.socket.send.group('[RSS] 请填写正确的链接', group);
                    }
                }
            },
            {
                id: 'remove',
                helper: '。rss del [id]	删除订阅',
                command: /^。rss del (.*)$/,
                func: async(e) => {
                    const id = e.msg.substr(9);
                    const group = e.group;
                    //console.log(id);
                    if (!admin.isAdmin(e.sender.user_id)) {
                        api.bot.socket.send.group('很抱歉，你不是机器人管理员，无权限操作！', e.group);
                        return;
                    } else if (update2 == true) {
                        api.bot.socket.send.group('很抱歉，订阅更新中，暂不能删除订阅！', e.group);
                        return;
                    }
                    try {
                        //console.log(await db2.read().get(`rss[feed]`).find({
                        //    id: parseInt(id)
                        //}).value())
                        if (await db2.read().get(`rss[feed]`).find({
                                id: parseInt(id)
                            }).value() != undefined) {
                            await db2.read().get(`rss[feed]`)
                                .remove({
                                    id: parseInt(id)
                                })
                                .write();
                            api.bot.socket.send.group('[RSS] 删除成功', group);
                        } else {
                            api.bot.socket.send.group('[RSS] 该rss不存在，无法删除', group);
                        }
                    } catch (e) {
                        api.bot.socket.send.group('[RSS] 删除失败:' + e, group);
                    }
                }
            },
            {
                id: 'assign',
                helper: '。rss switch [id]	开关订阅',
                command: /^。rss switch (.*)$/,
                func: async(e) => {
                    const id = e.msg.substr(12);
                    const group = e.group;
                    //console.log(id);
                    if (!admin.isAdmin(e.sender.user_id)) {
                        api.bot.socket.send.group('很抱歉，你不是机器人管理员，无权限操作！', e.group);
                        return;
                    }
                    try {
                        //console.log(await db2.read().get(`rss[feed]`).find({
                        //    id: parseInt(id)
                        //}).value())
                        let temp = await db2.read().get(`rss[feed]`).find({
                            id: parseInt(id)
                        }).value();
                        if (temp != undefined) {
                            if (temp.status == "enable") {
                                await db2.read().get(`rss[feed]`).find({
                                    id: parseInt(id)
                                }).assign({
                                    status: "disable"
                                }).write();
                                api.bot.socket.send.group('[RSS] 关闭订阅', group);
                            } else {
                                await db2.read().get(`rss[feed]`).find({
                                    id: parseInt(id)
                                }).assign({
                                    status: "enable"
                                }).write();
                                api.bot.socket.send.group('[RSS] 开启订阅', group);
                            }
                        } else {
                            api.bot.socket.send.group('[RSS] 该rss不存在，无法开关', group);
                        }
                    } catch (e) {
                        api.bot.socket.send.group('[RSS] 开关失败:' + e, group);
                    }
                }
            },
            {
                id: 'list',
                helper: '。rss list	查看本群订阅列表',
                command: /。rss list/,
                func: async(e) => {
                    try {
                        let s1 = "";
                        let data = db2.read().get(`rss[feed]`).filter({
                            group: e.group
                        }).value();
                        //console.log(data);
                        if (data.length != 0) {
                            //console.log(data.length);
                            for (let i = 0; i < data.length; i++) {
                                //console.log(data[i].id);
                                //console.log(data[i].url);
                                //console.log(data[i].group);
                                //console.log(data[i].user);
                                //console.log(data[i].status);
                                s1 += "id: " + data[i].id + " , ";
                                s1 += "备注：" + data[i].s + " , ";
                                s1 += "url：" + data[i].url + " , ";
                                //s1 += "group: " + data[i].group;
                                //s1 += "user:" + data[i].user + "\n";
                                s1 += "是否开启:" + data[i].status; // + " , ";
                                //s1 += "使用CQ:" + data[i].cq;
                                s1 += "\n";
                            }
                            api.bot.socket.send.group(s1, e.group);
                            //console.log(s1);
                        } else {
                            api.bot.socket.send.group('[RSS] 这个群还没有订阅任何内容', e.group);
                        }
                    } catch (e) {
                        api.bot.socket.send.group('[RSS] 查询失败：' + e, e.group);
                    }
                }
            },
            {
                id: 'update',
                helper: '。rss update	立刻刷新订阅',
                command: /。rss update/,
                func: async(e) => {
                    if (!admin.isAdmin(e.sender.user_id)) {
                        api.bot.socket.send.group('很抱歉，你不是机器人管理员，无权限操作！', e.group);
                    } else if (update2 == true) {
                        api.bot.socket.send.group('很抱歉，订阅更新中，暂不能再次刷新！', e.group);
                    } else {
                        await update();
                        api.bot.socket.send.group('[RSS] 开始刷新', e.group);
                    }
                }
            },
            {
                id: 'help',
                helper: '。rss help	rss帮助说明',
                command: /。rss help/,
                func: async(e) => {
                    api.bot.socket.send.group('[RSS] 指令列表：\n查询  。rss list\n增加  。rss add[rss链接]+[备注说明-文本]+[cq解析开关-true/false]\n删除  。rss del[id]\n开关订阅  。rss switch[id]\n立即刷新  。rss update', e.group);
                }
            }
        ]
    }
    /**
    nodejs本地存储轻量级数据库lowdb使用
    http://www.blogketori.com/wordpress/2020/03/28/nodejs%E6%9C%AC%E5%9C%B0%E5%AD%98%E5%82%A8%E8%BD%BB%E9%87%8F%E7%BA%A7%E6%95%B0%E6%8D%AE%E5%BA%93lowdb%E4%BD%BF%E7%94%A8/
    o zawa·2020-03-27·988 次阅读

    安装： npm install lowdb --save

    申请适配器初始化一个文件：

    const low = require('lowdb');
    const FileSync = require('lowdb/adapters/FileSync');
    const adapter = new FileSync('test.json'); // 申明一个适配器
    //注意，这里的test.json 相当于mysql中的database

    这里我初始化两张测试表，分别叫testTable1 testTable2

    db.defaults({'testTable1': []}).write();
    db.defaults({'testTable2': []}).write();
    这样数据库和表都创建完成了，现在我们要开始填入数据了（这里我理解的是数组代表一个表，如果有理解错请指正）

    await db.read().get('testTable1')
    .push({id: 1, name: 'testname', age:'60'})
    .write()
    这样就往testTable1表里插入了一条数据
    既然新增已经完毕了，接下来要做什么不要我多说了吧（当然是查询、修改和删除啦）

    查询：

    let data = await db.read().get('testTable1').find({name: testname}).value();
    查询名字为testname的值（注意，这里只能查询到一条数据,如果没查到则返回undefined）

    多值查询：

    db.read().get('testTable1').filter({name: 'test'}).value();
    返回一个数组，多值查询貌似还有个map方法，如果匹配上了的话数据是正确的，如果没有匹配上返回的数据长度异常（有点奇怪），之后换成了filter就能正确获得返回的数据

    查看表中的数据个数：

    db.get('testTable1').size().value(); // 返回该数组的长度为 1

    排序：

    db.get('testTable1')
    .filter({name: ''})
    .sortBy('age')
    .take(5)
    .value()
    根据年龄排序前五个
    设置值：

    db.read().set('testTable1', []) set也可以给对象设置一个值

    {testTable1:[
    {id: 1, name: 'testname', age:'60'}
    ],'sex':{man:'zhangsan'}
    }
    await db.read().set('sex.man', 'mazi') set当然也可以给对象设置一个值,修改后变成了
    {testTable1:[
    {id: 1, name: 'testname', age:'60'}
    ],'sex':{man:'mazi'}
    }

    修改：

    await db.read().get('testTable1').find({id: 1}).assign({name: test2}).write();
    把id为1用户的名字改为test

    删除：

    await db.read().get('testTable1')
    .remove({name: 'xxx'})
    .write();
    移除某个属性：

    await db.read().unset('testTable1[0].id').write();

    检查表是否存在：

    await db.read().has('testTable1')
    .value()
    修改方法（？）：

    await db.read().update('count', n => n + 1)
    .write() 此方法没用过，官方文档上说是用来增量的
    返回数据库信息：await db.read().getState()

    替换数据库信息：const jsonState = {} db.setState(jsonState) //把数据库设置为空

    自定义函数：

    await db.read()._.mixin({
    second: function(array){  //array参数为testTable表中所有数据
        return array[1]  //返回表中的第一条数据
    }
    })

    let r=db.get('testTable').second().value()
    console.log(r)

    后续===>

    1、调用方法的时候一定要加.read()这样是读取源文件，如果不加read()方法的话会出现奇奇怪怪的情况，比如为用一个schdeul来跑任务循环给json里面添加文件，你会发现json里面确实有新的值和属性，但是其他进程无论如何就是读不到数据，必须重启应用才行。

    2、db.read().xx方法返回的是prmoise对象（正常来说），但是有种情况就是把db.read().xx方法写到了try catch的catch里面，就会报错，提示返回的不是一个promise，官网文档上确实说过，可能会返回promise，所以在catch里面直接使用db.read().xxx即可

    3、lowdb是基于lodash的，所以支持lodash的api，就比如set这个方法就是用的lodash的api，你甚至可以用简写语法例如_.get和_.find来使用，也就是db.get()、db.find()

    以上只是官方文档的一部分，如果没有特别复杂的业务应该是够用了，如果不够用就去官方文档看吧，文档地址：https://github.com/typicode/lowdb

    */