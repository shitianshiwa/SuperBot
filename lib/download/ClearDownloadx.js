const empty = require('empty-folder');
const logger = require('../logger').plugin;//日志功能
//https://www.jb51.net/article/127906.htm nodejs判断文件、文件夹是否存在及删除的方法

module.exports = function ClearDownloadx() {
    return empty('./tmp', false, (o) => {
        if (o.error) {
            logger.error(new Date().toString() + " ,清空下载缓存tmp文件夹失败, " + o.error);
        } else {
            //logger.info(new Date().toString() + " ,成功清空下载缓存tmp文件夹");
        }
        //console.log(o.removed);
        //console.log(o.failed);
    });
}