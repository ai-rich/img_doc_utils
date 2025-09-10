// app.js
App({
  // 接口地址前缀
  url:"https://api.aitgc.cn/api",
  // 登录接口地址，获取openid
  loginUrl: "/weixin/login",
  // 上传接口
  uploadUrl: "/weixin/upload",
  // 图片检测接口
  mediaCheckUrl: '/weixin/mediaCheckAsync',

  onLaunch() {
    // 登录
    wx.login({
      success: (res) => {
        console.log(res)
        // 通过code换取openid
        if (res.code) {
          wx.request({
              url: `${this.url}${this.loginUrl}`,
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
