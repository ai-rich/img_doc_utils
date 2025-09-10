Page({
  data: {
    imagePath: '',
    fromHistory: false
  },

  onLoad(options) {
    this.setData({
      imagePath: options.imagePath,
      fromHistory: options.fromHistory === 'true'
    });
  },

  // 图片加载完成
  imageLoaded() {
    // 可以在这里添加图片加载完成后的逻辑
  },

  // 保存图片到相册
  saveImage() {
    wx.showLoading({
      title: '保存中...'
    });

    // 先检查是否有保存图片权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          // 没有权限，申请权限
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.doSaveImage();
            },
            fail: () => {
              wx.hideLoading();
              // 权限申请失败，引导用户去设置页面开启
              wx.showModal({
                title: '权限不足',
                content: '需要开启保存图片到相册的权限才能使用此功能',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
          });
        } else {
          // 已有权限，直接保存
          this.doSaveImage();
        }
      }
    });
  },

  // 执行保存图片操作
  doSaveImage() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.imagePath,
      success: () => {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功'
        });
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
        console.error('保存图片失败:', err);
      }
    });
  },

  // 分享图片
  shareImage() {
    wx.showShareImageMenu({
      path: this.data.imagePath,
      success: () => {
        console.log('分享成功');
      },
      fail: (err) => {
        console.error('分享失败:', err);
        wx.showToast({
          title: '分享失败',
          icon: 'none'
        });
      }
    });
  },

  // 重新拼接
  newStitch() {
    wx.navigateBack({
      delta: this.data.fromHistory ? 2 : 1
    });
  },

  // 分享页面
  onShareAppMessage() {
    return {
      title: '图片拼接工具',
      path: '/pages/index/index'
    };
  }
});
