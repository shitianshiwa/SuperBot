 const tieba = (context) => {
         //console.log("233333333333333333");
         let temp = context;
         temp = temp.replace(/作者/g, " , 作者");
         temp = temp.replace(/(https|http):\/\/imgsa\.baidu\.com\/forum\/w%3D580%3B\/sign=.*?\//g, "https://imgsrc.baidu.com/forum/pic/item/"); //imgsrc
         temp = temp.replace(/(https|http):\/\/tiebapic\.baidu\.com\/forum\/w%3D580%3B\/sign=.*?\//g, "https://tiebapic.baidu.com/forum/pic/item/"); //tiebapic
         temp = temp.replace(/(https|http):\/\/tieba\.baidu\.com\/p\/undefined/g, ""); //清理无效的视频链接
         return temp;
     }
     ///(https|http):\/\/imgsa\.baidu\.com\/forum\/w%3D580%3B\/sign=.*\//g
     ///(https|http):\/\/tiebapic\.baidu\.com\/forum\/w%3D580%3B\/sign=.*\//g
     //https://imgsrc.baidu.com/forum/pic/item/
     //https://tiebapic.baidu.com/forum/pic/item/
 module.exports = tieba;