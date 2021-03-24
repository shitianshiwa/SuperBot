const downloadx = require('../download/Downloadx'); //输入url，返回文件路径

const pixivfanbox = async (context, header = "", proxy = { host: "", port: 0 }, ii = 0) => {
    //console.log("233333333333333333");
    let temp = context;
    let i;
    let iii;
    let result = new Array();
    let pic1 = temp.match(/(https|http):\/\/pixiv\.pximg\.net\/c\/1200x630_90_a2_g5\/fanbox\/public\/images\/post\/\d+\/cover\/.*?\.jpeg/g);
    let pic2 = temp.match(/(https|http):\/\/downloads\.fanbox\.cc\/images\/post\/\d+\/.*?\.jpeg/g);
    temp = temp.replace(/\[image\]/g, "");
    temp = temp.replace(/\<hr\>/g, "");
    result.push(temp); //0
    if (pic1 != null) {
        for (i = 0; i < pic1.length; i++) {
            result.push(`[CQ:image,cache=0,file=file:///${await downloadx(pic1[i], ("pixivfanboxheader" + ii + "x"), i, {
                "Host": header.Host1,
            }, proxy)}]`); //封面 1
        }
    }
    if (pic2 != null) {
        for (iii = 0; iii < pic2.length; iii++) {
            result.push(`[CQ:image,cache=0,file=file:///${await downloadx(pic2[iii], ("pixivfanbox" + ii + "x"), iii, {
                "Host": header.Host2,
                "Cookie": "FANBOXSESSID=" + header.Cookie + ";"
            }, proxy)}]`); //图片 2
        }
    }
    return result;
}
module.exports = pixivfanbox;