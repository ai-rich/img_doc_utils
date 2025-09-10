import Toast from '@vant/weapp/toast/toast';
import request, { uploadFile } from '../../utils/request';

const app = getApp();

Page({
  data: {
    // 图片路径
    originalImageUrl: '',
    watermarkedImageUrl: '',
    
    // 水印配置参数 - 最优默认值
    watermarkText: '二狗拼图改图',
    fontSize: 24,         // 适中的字体大小
    opacity: 30,          // 30%透明度，平衡可见性和干扰性
    rotate: 45,          // 倾斜角度，经典水印角度
    color: '#000000',     // 默认黑色
    density: 'medium',    // 适中密度
    
    // 提示信息
    showToast: false,
    toastMessage: ''
  },
  
  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 临时图片路径
        const tempFilePath = res.tempFilePaths[0]

        Toast.loading({
          duration: 0, // 持续展示 toast
          message: '图片验证中...',
          forbidClick: true,
        });
        
        // 可以将文件路径 file.path 进行后续操作，如上传到服务器或本地处理
        uploadFile({
          url: app.uploadUrl, // 替换为你的服务器上传地址
          filePath: tempFilePath,
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
                  this.setData({
                    originalImageUrl: tempFilePath,
                    watermarkedImageUrl: '' // 重置水印图片
                  })
                  // 自动生成一次水印
                  this.generateWatermark()
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

        
      }
    })
  },
  
  // 生成水印
  generateWatermark() {

    if (!this.data.originalImageUrl) {
      this.showToast('请先选择图片')
      return
    }
    
    if (!this.data.watermarkText.trim()) {
      this.showToast('请输入水印文字')
      return
    }

    // 显示加载中
    wx.showLoading({
      title: '生成水印中...',
      mask: true
    })
    
    // 获取图片信息
    wx.getImageInfo({
      src: this.data.originalImageUrl,
      success: (imgInfo) => {
        const ctx = wx.createCanvasContext('watermarkCanvas')
        const dpr = wx.getSystemInfoSync().pixelRatio || 1
        
        // 设置Canvas尺寸，考虑设备像素比
        const canvasWidth = imgInfo.width
        const canvasHeight = imgInfo.height
        
        // 设置canvas尺寸
        const query = wx.createSelectorQuery()
        query.select('#watermarkCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            
            // 设置canvas实际尺寸
            canvas.width = canvasWidth * dpr
            canvas.height = canvasHeight * dpr
            ctx.scale(dpr, dpr)
            console.log(this.data.originalImageUrl)
            // 绘制原图
            const img = canvas.createImage();
            img.src = imgInfo.path;
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
            
              // 根据密度设置间距
              let spacing = 150
              switch(this.data.density) {
                case 'low':
                  spacing = 220
                  break
                case 'high':
                  spacing = 100
                  break
                default:
                  spacing = 150
              }
              
              // 水印文本
              const text = this.data.watermarkText
              // 计算不透明度
              const alpha = this.data.opacity / 100
              
              // 设置水印样式
              ctx.font = `${this.data.fontSize}px sans-serif`
              ctx.fillStyle = this.hexToRgba(this.data.color, alpha)
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              
              // 旋转上下文
              ctx.save()
              
              // 计算水印绘制范围，覆盖整个图片
              const cols = Math.ceil(canvasWidth / spacing) + 1
              const rows = Math.ceil(canvasHeight / spacing) + 1
              
              // 绘制水印网格
              for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                  // 计算位置，交错排列增强水印效果
                  const x = j * spacing + (i % 2 === 0 ? 0 : spacing / 2)
                  const y = i * spacing
                  
                  ctx.save()
                  ctx.translate(x, y)
                  ctx.rotate(this.data.rotate * Math.PI / 180)
                  ctx.fillText(text, 0, 0)
                  ctx.restore()
                }
              }
              
              ctx.restore()
            }

            
            
            // 将canvas内容转为图片
            setTimeout(() => {
              wx.canvasToTempFilePath({
                canvasId: 'watermarkCanvas',
                canvas: canvas,
                x: 0,
                y: 0,
                width: canvasWidth,
                height: canvasHeight,
                destWidth: canvasWidth,
                destHeight: canvasHeight,
                success: (res) => {
                  this.setData({
                    watermarkedImageUrl: res.tempFilePath
                  })
                  wx.hideLoading()
                  this.showToast('水印生成成功')
                },
                fail: (err) => {
                  console.error('生成水印失败', err)
                  wx.hideLoading()
                  this.showToast('水印生成失败，请重试')
                }
              })
            }, 500)
          })
      },
      fail: (err) => {
        console.error('获取图片信息失败', err)
        wx.hideLoading()
        this.showToast('获取图片信息失败，请重试')
      }
    })
  },
  
  // 保存图片到相册
  saveImage() {
    if (!this.data.watermarkedImageUrl) {
      this.showToast('请先生成水印图片')
      return
    }
    // 先检查是否有保存图片权限
    wx.getSetting({
      success: (res) => {

        if (!res.authSetting['scope.writePhotosAlbum']) {
          // 申请权限
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.saveImageToAlbum()
            },
            fail: () => {
              // 用户拒绝授权，引导用户去设置页面开启
              wx.showModal({
                title: '权限提示',
                content: '需要获取保存图片到相册的权限，请在设置中开启',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting()
                  }
                }
              })
            }
          })
        } else {
          // 已有权限，直接保存
          this.saveImageToAlbum()
        }
      },
      fail: (e)=>{
        console.log(e);
      }
    })
  },
  
  // 保存图片到相册的具体实现
  saveImageToAlbum() {
    wx.showLoading({
      title: '保存中...',
      mask: true
    })
    
    wx.saveImageToPhotosAlbum({
      filePath: this.data.watermarkedImageUrl,
      success: () => {
        wx.hideLoading()
        this.showToast('图片已保存到相册')
      },
      fail: (err) => {
        console.error('保存图片失败', err)
        wx.hideLoading()
        this.showToast('保存图片失败，请重试')
      }
    })
  },
  
  // 显示提示信息
  showToast(message) {
    this.setData({
      showToast: true,
      toastMessage: message
    })
    
    setTimeout(() => {
      this.setData({
        showToast: false
      })
    }, 2000)
  },
  
  // 转换颜色格式：hex to rgba
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  },
  
  // 水印文字变化
  onTextChange(e) {
    this.setData({
      watermarkText: e.detail.value
    })
  },
  
  // 字体大小变化
  onFontSizeChange(e) {
    this.setData({
      fontSize: e.detail.value
    })
  },
  
  // 透明度变化
  onOpacityChange(e) {
    this.setData({
      opacity: e.detail.value
    })
  },
  
  // 旋转角度变化
  onRotateChange(e) {
    this.setData({
      rotate: e.detail.value
    })
  },
  
  // 颜色变化
  onColorChange(e) {
    this.setData({
      color: e.currentTarget.dataset.color
    })
  },
  
  // 密度变化
  onDensityChange(e) {
    this.setData({
      density: e.currentTarget.dataset.density
    })
  }
})
