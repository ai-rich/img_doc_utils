// app.js
App({
  url:"https://api.aitgc.cn/api",
  onLaunch() {
    console.log(1)
    // 登录
    wx.login({
      success: (res) => {
        console.log(res)
        // 通过code换取openid
        if (res.code) {
          wx.request({
              url: `${this.url}/weixin/login`,
              method: "post",
              data: {
                  code: res.code,
              },
              success: (res) => {
                console.log(res.data)
                  if (res.data && res.data.openid) {
                      // 获取的openid存入storage，方便之后使用
                      wx.setStorageSync("openid", res.data.openid);
                  }
              },
          });
        }
      },
      fail: (e) => {
        console.log(e)
      },
      complete: () => {
        console.log(2)
      },
    });
  }
})
