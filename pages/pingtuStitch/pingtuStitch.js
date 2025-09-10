import request, { uploadFile } from "../../utils/request";
import Toast from '@vant/weapp/toast/toast';

const app = getApp();
Page({
  data: {
    type: 'vertical', // 默认为纵向拼接
    images: [],
    spacing: 10, // 拼接间距
    bgColor: '#ffffff', // 背景颜色
    maxCount: 9 // 最大图片数量，九宫格最多9张
  },

  onLoad(options) {
    this.setData({
      type: options.type || 'vertical',
      // 九宫格最多9张，其他类型最多10张
      maxCount: options.type === 'grid' ? 9 : 10
    });
  },

  // 选择图片
  chooseImage() {
    const remaining = this.data.maxCount - this.data.images.length;
    if (remaining <= 0) return;
    let self = this;

    wx.chooseImage({
      count: remaining,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        
        tempFilePaths.forEach((imgUrl)=>{
          Toast.loading({
            duration: 0, // 持续展示 toast
            message: '图片验证中...',
            forbidClick: true,
          });
          // 可以将文件路径 file.path 进行后续操作，如上传到服务器或本地处理
          uploadFile({
            url: app.uploadUrl, // 替换为你的服务器上传地址
            filePath: imgUrl,
            name: 'file',
            method: "post",
            success: async (resUpload)=> {
              const data = resUpload.data.data;
              // 处理上传成功的结果
              console.log(data);
              
              request({
                url: app.mediaCheckUrl,
                method: "post",
                data:{
                  openid: wx.getStorageSync("openid"),
                  filename: data.filename
                },
                success:(resCheck)=>{
                  if(resCheck.data.data && resCheck.data.data.result.suggest != 'risky'){
                    self.setData({
                      images: [...self.data.images, imgUrl]
                    });
                    Toast.clear();
                  }else{
                    Toast.fail('图片验证失败，请重新选择！');
                  }
                }
              });
            },
            fail(res) {
              // 处理上传失败的情况
              console.error(res);
              Toast.clear();
            },
          })
        })
      }
    });
  },

  // 移除图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  // 设置间距
  setSpacing(e) {
    this.setData({
      spacing: e.detail.value
    });
  },

  // 设置背景颜色
  setBgColor(e) {
    this.setData({
      bgColor: e.currentTarget.dataset.color
    });
  },

  // 打开颜色选择器
  openColorPicker() {
    wx.showModal({
      title: '自定义颜色',
      content: '',
      editable: true,
      placeholderText: '#ffffff',
      success: (res) => {
        if (res.confirm) {
          const color = res.content.trim();
          // 简单验证颜色格式
          if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
            this.setData({ bgColor: color });
          } else {
            wx.showToast({
              title: '颜色格式不正确',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 拼接图片
  stitchImages() {

    if (this.data.images.length < 2 && this.data.type !== 'grid') {
      wx.showToast({
        title: '至少选择2张图片',
        icon: 'none'
      });
      return;
    }

    if (this.data.type === 'grid' && this.data.images.length < 1) {
      wx.showToast({
        title: '至少选择1张图片',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '拼接中...',
      mask: true
    });

    // 获取所有图片的信息
    Promise.all(this.data.images.map(path => this.getImageInfo(path)))
      .then(imagesInfo => {
        if (this.data.type === 'vertical') {
          return this.stitchVertical(imagesInfo);
        } else if (this.data.type === 'horizontal') {
          return this.stitchHorizontal(imagesInfo);
        } else {
          return this.stitchGrid(imagesInfo);
        }
      })
      .then(resultPath => {
        wx.hideLoading();
        // 保存到历史记录
        this.saveToHistory(resultPath);
        // 跳转到结果页
        wx.navigateTo({
          url: `/pages/imgResult/imgResult?imagePath=${resultPath}`
        });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '拼接失败',
          icon: 'none'
        });
        console.error('拼接失败:', err);
      });
  },

  // 获取图片信息
  getImageInfo(path) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: path,
        success: resolve,
        fail: reject
      });
    });
  },

  // 纵向拼接
  stitchVertical(imagesInfo) {
    return new Promise((resolve, reject) => {
      // 计算画布宽度（取第一张图片宽度）和高度
      const canvasWidth = imagesInfo[0].width;
      let canvasHeight = 0;
      
      // 计算总高度：所有图片高度之和 + 间距*(图片数量-1)
      imagesInfo.forEach((img, index) => {
        canvasHeight += img.height;
        if (index < imagesInfo.length - 1) {
          canvasHeight += this.data.spacing;
        }
      });

      // 设置画布尺寸
      const query = wx.createSelectorQuery();
      query.select('#stitchCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 设置画布尺寸
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          // 填充背景色
          ctx.fillStyle = this.data.bgColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          // 绘制图片
          let currentY = 0;
          imagesInfo.forEach((imgInfo, index) => {
            const img = canvas.createImage();
            img.src = imgInfo.path;
            img.onload = () => {
              ctx.drawImage(img, 0, currentY, canvasWidth, imgInfo.height);
              currentY += imgInfo.height + this.data.spacing;
              
              // 最后一张图片绘制完成后保存
              if (index === imagesInfo.length - 1) {
                setTimeout(() => {
                  wx.canvasToTempFilePath({
                    canvas,
                    success: (res) => {
                      resolve(res.tempFilePath);
                    },
                    fail: reject
                  });
                }, 100);
              }
            };
            img.onerror = reject;
          });
        });
    });
  },

  // 横向拼接
  stitchHorizontal(imagesInfo) {
    return new Promise((resolve, reject) => {
      // 计算画布高度（取第一张图片高度）和宽度
      const canvasHeight = imagesInfo[0].height;
      let canvasWidth = 0;
      
      // 计算总宽度：所有图片宽度之和 + 间距*(图片数量-1)
      imagesInfo.forEach((img, index) => {
        canvasWidth += img.width;
        if (index < imagesInfo.length - 1) {
          canvasWidth += this.data.spacing;
        }
      });

      // 设置画布尺寸
      const query = wx.createSelectorQuery();
      query.select('#stitchCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 设置画布尺寸
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          // 填充背景色
          ctx.fillStyle = this.data.bgColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          // 绘制图片
          let currentX = 0;
          imagesInfo.forEach((imgInfo, index) => {
            const img = canvas.createImage();
            img.src = imgInfo.path;
            img.onload = () => {
              ctx.drawImage(img, currentX, 0, imgInfo.width, canvasHeight);
              currentX += imgInfo.width + this.data.spacing;
              
              // 最后一张图片绘制完成后保存
              if (index === imagesInfo.length - 1) {
                setTimeout(() => {
                  wx.canvasToTempFilePath({
                    canvas,
                    success: (res) => {
                      resolve(res.tempFilePath);
                    },
                    fail: reject
                  });
                }, 100);
              }
            };
            img.onerror = reject;
          });
        });
    });
  },

  // 九宫格拼接
  stitchGrid(imagesInfo) {
    return new Promise((resolve, reject) => {
      const count = imagesInfo.length;
      // 计算行列数
      const rows = count <= 3 ? 1 : count <= 6 ? 2 : 3;
      const cols = Math.ceil(count / rows);
      
      // 计算每个格子的尺寸（取最小宽度和高度）
      const cellWidth = Math.min(...imagesInfo.map(img => img.width));
      const cellHeight = Math.min(...imagesInfo.map(img => img.height));
      
      // 计算画布尺寸
      const canvasWidth = cellWidth * cols + this.data.spacing * (cols - 1);
      const canvasHeight = cellHeight * rows + this.data.spacing * (rows - 1);

      // 设置画布尺寸
      const query = wx.createSelectorQuery();
      query.select('#stitchCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 设置画布尺寸
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          // 填充背景色
          ctx.fillStyle = this.data.bgColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          // 绘制图片
          let completedCount = 0;
          imagesInfo.forEach((imgInfo, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = col * (cellWidth + this.data.spacing);
            const y = row * (cellHeight + this.data.spacing);
            
            const img = canvas.createImage();
            img.src = imgInfo.path;
            img.onload = () => {
              // 绘制图片并适应格子大小
              ctx.drawImage(img, x, y, cellWidth, cellHeight);
              completedCount++;
              
              // 所有图片绘制完成后保存
              if (completedCount === imagesInfo.length) {
                setTimeout(() => {
                  wx.canvasToTempFilePath({
                    canvas,
                    success: (res) => {
                      resolve(res.tempFilePath);
                    },
                    fail: reject
                  });
                }, 100);
              }
            };
            img.onerror = reject;
          });
        });
    });
  },

  // 保存到历史记录
  saveToHistory(imagePath) {
    let history = wx.getStorageSync('stitchHistory') || [];
    history.push({
      path: imagePath,
      createTime: Date.now(),
      type: this.data.type
    });
    // 只保留最近20条记录
    if (history.length > 20) {
      history = history.slice(-20);
    }
    wx.setStorageSync('stitchHistory', history);
  }
});
