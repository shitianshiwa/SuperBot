const Axios = require('axios')
const fileType = require('file-type');
const fs = require('fs-extra');
const path = require('path');
const download = require('download');
const logger = require('../logger').plugin;//日志功能
const HttpsProxyAgent = require("https-proxy-agent");
let axios = false;
//console.log(config);
//var proxyip = false;
/*
stream 转 buffer
function streamToBuffer(stream) {  
  return new Promise((resolve, reject) => {
    let buffers = [];
    stream.on('error', reject);
    stream.on('data', (data) => buffers.push(data))
    stream.on('end', () => resolve(Buffer.concat(buffers))
  });
}
buffer 转 stream
let Duplex = require('stream').Duplex;
 
function bufferToStream(buffer) {  
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
参考
stream to buffer: https://stackoverflow.com/questions/14269233/node-js-how-to-read-a-stream-into-a-buffer
buffer to stream: http://derpturkey.com/buffer-to-stream-in-node/
转载于:https://www.cnblogs.com/xiaoniuzai/p/7223151.html
*/

module.exports = async function Downloadx(url, name, i, headers = "", proxy = { host: "", port: 0 }) {//链接，图片名，名字序号，链接header
    if (proxy.host.startsWith("http") && proxy.port != 0) {
        axios = Axios.create({
            httpsAgent: new HttpsProxyAgent({
                hostname: proxy.host,
                port: proxy.port,
                protocol: /^https/.test(proxy.host) ? "https" : "http"
            })
        });
    }
    else axios = Axios;
    //console.log(headers);
    let path2 = path.join(__dirname, `../../tmp/`);
    if (!fs.existsSync(path2)) {
        fs.mkdirSync(path2);
    }
    const response = await Axios({
        url,
        headers: headers,
        method: "GET",
        responseType: "stream",
        timeout: 10000,
    });
    //const imgType = fileType(await streamToBuffer(response.data)).ext;
    const mypath = path.resolve(path2, `${name + i.toString()}.${url.split(".")[1]}`);
    const writer = fs.createWriteStream(mypath);
    response.data.pipe(writer);
    return await new Promise(async (resolve, reject) => {
        writer.on("finish",
            data => {
                logger.info(new Date().toString() + ",下载图片成功:" + JSON.stringify(data));
                resolve(mypath);
            });
        writer.on("error",
            err => {
                logger.error(new Date().toString() + ",下载图片失败: " + JSON.stringify(err));
                resolve("");
            });
    });
}


/*let fileDataArr = await new Promise(async function (resolve, reject) {
    logger.info("下载文件 , " + url + " , " + name + " , " + i.toString());
    if (headers == "") {
        resolve(download(url, {
            proxy: proxyip ? proxyip : false
        }).catch(err => {
            logger.error(new Date().toString() + " , " + err);
        }));
    } else {
        resolve(download(url, {
            proxy: proxyip ? proxyip : false,
            headers: headers
        }).catch(err => {
            logger.error(new Date().toString() + " , " + err);
        }));
    }
    //https://github.com/kevva/download/commit/a16ba04b30dafbe7d9246db93f1534320d8e0dd3 v8.0.0删掉代理功能了
});
if (fileDataArr != null) {
    const imgType = fileType(fileDataArr).ext;
    const imgPath = path.join(__dirname, `../../tmp/${name + i.toString()}.${imgType}`);
    fs.writeFileSync(imgPath, fileDataArr);
    logger.info("完成下载");
    return imgPath;
} else {
    return "";
}

// url 是图片地址，如，http://wximg.233.com/attached/image/20160815/20160815162505_0878.png
// filepath 是文件下载的本地目录
// name 是下载后的文件名
async function downloadFile(url: string, filepath: string, name: string) {
    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(filepath);
    }
    const writer = fs.createWriteStream(mypath);
    const response = await Axios({
        url,
        method: "GET",
        responseType: "stream",
    });
    const imgType = fileType(response).ext;
    const mypath = path.resolve(filepath, name + "." + imgType);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}
————————————————
版权声明：本文为CSDN博主「郑宇华」的原创文章，遵循CC 4.0 BY - SA版权协议，转载请附上原文出处链接及本声明。
原文链接：https://blog.csdn.net/zyh_haha/article/details/89479995
*/