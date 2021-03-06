module.exports = {
    socket: {
        api: 'ws://127.0.0.1:8080/ws/api/',
        event: 'ws://127.0.0.1:8080/ws/event/'
    },
    plugin: {
        rss: {
            check_interval: 3 * 60 * 1000, //定时获取信息
            cd: 3 * 1000, //api使用延迟
            FANBOX_SESSION_ID: "",
            pixiv: "pixiv.pximg.net",
            fanbox: "downloads.fanbox.cc",
            translate:
            {
                // 有道翻译的api授权
                youdao: {
                    appid: '',
                    key: '',
                    translate: false
                },
                // 百度翻译的api授权
                baidu: {
                    appid: '',
                    key: '',
                    translate: false
                },
                tx:
                {
                    translate: true
                }
            }
        },
        whois: {
            token: '' // 查询Whois的API
        },
        sec: {
            cookie: '' // 微步的cookie
        },
        vtb: {
            host: 'https://api.vtbs.moe', // socket.io的连接地址
            groups: [] // vtb插件消息发送群号
        }
    },
    logger: {
        level: 'DEBUG', // 日志等级
    },
    owner: '', // 所属人QQ号
    proxy: {
        host: "",
        port: 0
    }
}