Page({
  data: {
    history: []
  },

  onLoad() {
    // 加载历史记录
    this.loadHistory();
  },

  onShow() {
    // 每次显示页面时刷新历史记录
    this.loadHistory();
  },

  // 加载历史记录
  loadHistory() {
    const history = wx.getStorageSync('stitchHistory') || [];
    this.setData({
      history: history.slice(-5) // 只显示最近5条
    });
  },

  // 选择拼接类型
  chooseType(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/pingtuStitch/pingtuStitch?type=${type}`
    });
  },

  // 查看历史记录
  viewHistory(e) {
    const index = e.currentTarget.dataset.index;
    const imagePath = this.data.history[index];
    wx.navigateTo({
      url: `/pages/pingtuResult/pingtuResult?imagePath=${imagePath}&fromHistory=true`
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
});
