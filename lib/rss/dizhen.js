const dizhen = (context) => {
    //console.log("233333333333333333");
    let s = "";
    let temp = context.split("\n");
    for (let i = 0; i < temp.length; i++) {
        if (temp[i].search("参考位置") == -1) {
            s = s + temp[i] + "\n";
        }
    }
    return s;
}
module.exports = dizhen;