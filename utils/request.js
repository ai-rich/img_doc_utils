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

  wx.request({
    header,
    url: app.url + url,
    success: (res)=>{
      if(res.data.code==200){
        success(res);
      }else{
        wx.showToast({ title: '系统维护中，稍后再试', icon: 'none' });
      }
    },
    ...params
  })
}