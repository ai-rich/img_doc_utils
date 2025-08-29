// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    
  },

  onShareAppMessage() {
    return {
      title: '图片文档工具',
      path: '/pages/index/index'
    }
  },

  goNextPage(e){
    const { url } = e.currentTarget.dataset;
    wx.navigateTo({
      url,
    });
  },
})
