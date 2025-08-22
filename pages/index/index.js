// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Component({
  data: {
  },
  methods: {
    goNextPage(e){
      const { url } = e.currentTarget.dataset;
      wx.navigateTo({
        url,
      });
    },
    
  }
})
