const pixivfanbox = (context) => {
    //console.log("233333333333333333");
    let temp = context;
    let result = new Array();
    let pic1 = /(https|http):\/\/pixiv\.pximg\.net\/c\/1200x630_90_a2_g5\/fanbox\/public\/images\/post\/\d+\/cover\/.*?\.jpeg/.exec(temp);
    let pic2 = /(https|http):\/\/downloads\.fanbox\.cc\/images\/post\/\d+\/.*?\.jpeg/.exec(temp);
    temp = temp.replace(/\[image\]/g, "");
    temp = temp.replace(/\<hr\>/g, "");
    temp = temp.replace(/\<b\>/g, "需要订阅费 ");
    temp = temp.replace(/\<\/b\>/g, "才可以浏览");
    result.push(temp); //0
    if (pic1 != null) {
        result.push(`[CQ:image,cache=0,file=${pic1[0]}]`); //封面 1
    }
    if (pic2 != null) {
        result.push(`[CQ:image,cache=0,file=${pic2[0]}]`); //公开的图片 2
    }
    return result;
}
module.exports = pixivfanbox;