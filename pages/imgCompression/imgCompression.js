import Toast from '@vant/weapp/toast/toast';
import request, { uploadFile } from '../../utils/request';
// pages/imgCompression/imgCompression.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgUrl: null,
    sizeValue: 100,
    qualityValue: 60,

    curWidth: 0,
    curHeight: 0,
    curFileSize: 0,

    compressedWidth: 0,
    compressedHeight: 0,
    compressedFileSize: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  onSizeSliderDrag(e){
    const sizeSlider = e.detail.value;
    this.setData({
      sizeSlider,
      imgWidth: parseInt(this.data.selectedImgWidth * sizeSlider / 100).toFixed(0),
      imgHeight: parseInt(this.data.selectedImgHeight * sizeSlider / 100).toFixed(0),
    })
  },

  chooseImage(){
    const self = this;
    const {sizeValue,qualityValue} = self.data;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success(res) {
        const imgUrl = res.tempFiles[0].tempFilePath;

        // 可以将文件路径 file.path 进行后续操作，如上传到服务器或本地处理
        uploadFile({
          url: `/weixin/upload`, // 替换为你的服务器上传地址
          filePath: imgUrl,
          name: 'file',
          method: "post",
          success: async (resUpload)=> {
            const data = resUpload.data.data;
            // 处理上传成功的结果
            console.log(data);
            request({
              url: '/weixin/mediaCheckAsync',
              method: "post",
              data:{
                openid: wx.getStorageSync("openid"),
                filename: data.filename
              },
              success:(resCheck)=>{
                if(resCheck.data.data && resCheck.data.data.result.suggest == 'pass'){
                  const fileSize = parseInt(res.tempFiles[0].size/1024);
                  wx.getImageInfo({
                    src: imgUrl, // 这里替换为你要获取尺寸的图片的 URL
                    success(res) {
                      self.setData({
                        compressedHeight: res.height * sizeValue/100,
                        compressedWidth: res.width,
                        compressedFileSize: parseInt(fileSize * Math.min(qualityValue/100,sizeValue/100)).toFixed(0),
                        curHeight: res.height,
                        curWidth:  res.width,
                        curFileSize: fileSize
                      })
                    },
                    fail(err) {
                      console.error('获取图片信息失败', err);
                    }
                  });
                 self.setData({
                   imgUrl
                 })
                }else{
                  self.setData({
                    imgUrl: null
                  })
                  Toast.fail('图片验证失败，请重新选择！');
                }
              }
            });
          },
          fail(res) {
            // 处理上传失败的情况
            console.error(res);
          }
        })

        
      }
    })
  },

  onqualityValueDrag(e){
    const qualityValue = e.detail.value;
    this.setData({
      qualityValue: qualityValue,
    })
  },

  imgCompression(){
    const self = this;
    const {imgUrl,qualityValue,compressedWidth} = this.data;

    if(!imgUrl){
      Toast.fail('请选择图片');
      return;
    }

    Toast.loading({
      message: '图片压缩中...',
      duration: 5000, // 持续展示 toast
      forbidClick: true,
    });

    wx.compressImage({
      src: imgUrl,
      quality: qualityValue,
      compressedWidth,
      success(res){
        self.downloadImage(res.tempFilePath);
      },
    });
    return;
  },

  downloadImage(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: function() {
        Toast.success('图片保存成功');
      },
      fail: function(err) {
        console.error('保存图片失败:', err);
      }
    });
  },

  onSizeDrag(e){
    const sizeValue = e.detail.value;
    this.setData({
      sizeValue,
      compressedWidth: parseInt(this.data.curWidth * sizeValue/100).toFixed(0),
      compressedHeight: parseInt(this.data.curHeight * sizeValue/100).toFixed(0),
      compressedFileSize: parseInt(this.data.curFileSize * Math.min(this.data.qualityValue/100,sizeValue/100)).toFixed(0),
    })
  },

  onQualityDrag(e){
    this.setData({
      qualityValue: e.detail.value,
      compressedFileSize: parseInt(this.data.curFileSize * Math.min(e.detail.value/100,this.data.sizeValue/100)).toFixed(0),
    })
  }
  
})