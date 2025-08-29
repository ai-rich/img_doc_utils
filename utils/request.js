let isLogin = false;
function isTokenExpiration() {
  // 当前时间
  var timestamp = Date.parse(new Date());
  // 缓存中的过期时间
  var data_expiration = wx.getStorageSync("token_expiration");
  // 如果缓存中没有data_expiration，说明也没有token，还未登录
  if (data_expiration) {
    // 如果超时了，清除缓存，重新登录
    if (timestamp > data_expiration) {
      wx.removeStorageSync('token_expiration');
      wx.removeStorageSync('token');
      return true;
    }else{
      return false;
    }
  }
  return true;
}

export function login(success,url){
  const app = getApp();
  if(!isLogin){
    isLogin = true;
    wx.login({
      success(res) {
        wx.request({
              url: `${ url || app.url }/miniapp/user/login`,
              data: { "code": res.code},
              method: "GET",
              success: (res)=> {
                if (res.data.code == 200) {
                  isLogin = false;
                  wx.setStorageSync('token', res.data.data.access_token);
                  // 当前时间
                  var timestamp = Date.parse(new Date());
                  // 加上过期期限
                  var expiration = timestamp + 1200000; //缓存20分钟
                  wx.setStorageSync('token_expiration', expiration);
                  success && success();
                }
              },
          })
      }
    })
  }else{
    setTimeout(() => {
      success && success();
    }, 500);
  }
}

export function uploadFile({filePath,url,header,success,
  ...params}){
  // 可以将文件路径 file.path 进行后续操作，如上传到服务器或本地处理

  const app = getApp();
  header = header || {};

  wx.uploadFile({
    url: `${app.url}${url}`,
    filePath,
    header,
    name: 'file',
    success: (res)=>{
      console.log('res',res)
      const data = JSON.parse(res.data)
      res.data = data;
      if(data.code==200){
        success(res);
      }else if (data.code == 401) {
        wx.removeStorageSync('token');
        wx.removeStorageSync('token_expiration');
        login(function(){
          request({
            url,
            header,
            success,
            ...params
          });
        });
      }else{
        wx.showToast({ title: '系统维护中，稍后再试', icon: 'none' });
      }
    },
    ...params
  })
}

export default function request({
  url,
  header,
  success,
  ...params
}) {
  const app = getApp();
  header = header || {};

  if (url != '/miniapp/user/login') {
    const token = wx.getStorageSync('token');
    if(token){
      header.Authorization = `Bearer ${token}`;
    }
  }

  wx.request({
    header,
    url: app.url + url,
    success: (res)=>{
      if(res.data.code==200){
        success(res);
      }else if (res.data.code == 401) {
        wx.removeStorageSync('token');
        wx.removeStorageSync('token_expiration');
        login(function(){
          request({
            url,
            header,
            success,
            ...params
          });
        });
      }else{
        wx.showToast({ title: '系统维护中，稍后再试', icon: 'none' });
      }
    },
    ...params
  })
}