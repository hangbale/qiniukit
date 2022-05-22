const qiniu = require('qiniu');
const vscode = require('vscode');
let BucketManager = null;
let Uploader = null;
let UserConfig = null;

function correctDomain (domain) {
  if (domain.endsWith('/')) {
    return domain;
  }
  domain = domain + '/';
  if (domain.startsWith('http')) {
    return domain;
  }
  domain = 'http://' + domain;
  return domain;
}

function getUserConfig () {
  if (UserConfig) {
    return UserConfig;
  }
  let t = vscode.workspace.getConfiguration().get('qiniukey');
  if (!t.ak || !t.sk || !t.zone) {
    vscode.window.showErrorMessage('请在设置中配置七牛API');
    throw new Error('请在设置中配置七牛API');
  }
  t.domain = correctDomain(t.domain);
  userConfig = t;
  return userConfig;
}

function findZone(name) {
  let maps = [
    {
      name: '华东',
      url: 'Zone_z0'
    },
    {
      name: '华北',
      url: 'Zone_z1'
    },
    {
      name: '华南',
      url: 'Zone_z2'
    },
    {
      name: '北美',
      url: 'Zone_na0'
    }
  ]
  let ret = maps.find(function (item) {
    return item.name === name;
  })
  if (!ret) {
    throw new Error('未找到对应的Zone');
  }
  return ret.url;
}

function getMac(accessKey, secretKey) {
  return new qiniu.auth.digest.Mac(accessKey, secretKey);
}
function getBucketManager() {
  if (BucketManager) {
    return BucketManager;
  }
  
  let userConfig = getUserConfig();
  let mac = getMac(userConfig.ak, userConfig.sk);
  let config = new qiniu.conf.Config();
  config.zone = qiniu.zone[findZone(userConfig.zone)];
  BucketManager = new qiniu.rs.BucketManager(mac, config);
  return BucketManager;
}
function processImgUrl(key) {
  let config = getUserConfig();
  let processor = config.processor;
  let separator = config.separator;
  let domain = config.domain;
  let suffix = separator + processor;
  return domain + key + suffix;
}
function getUploadToken () {
  let config = getUserConfig();
  let policy = new qiniu.rs.PutPolicy({
    scope: config.bucket
  })
  let mac = getMac(config.ak, config.sk);
  return policy.uploadToken(mac);
}
function getUploader () {
  if (Uploader) {
    return Uploader;
  }
  let qiniuConfig = new qiniu.conf.Config();
  qiniuConfig.zone = qiniu.zone[findZone(getUserConfig().zone)];
  Uploader = new qiniu.form_up.FormUploader(qiniuConfig);
  return Uploader;
}

module.exports = {
  upload: function (filepath, name) {
    let uploader = getUploader();
    let extra = new qiniu.form_up.PutExtra();
    let token = getUploadToken();
    let encodedName = encodeURIComponent(name);
    console.log(uploader)
    console.log(token)
    console.log(filepath)
    console.log(extra)
    uploader.putFile(token, encodedName, filepath, extra, function (err, body, info) {
      
      if (!err && info.statusCode == 200) {
        let url = processImgUrl(body.key);
        vscode.env.clipboard.writeText(url).then(() => {
          vscode.window.showInformationMessage('上传成功,外链已复制到粘贴板');
        })
      } else {
        vscode.window.showErrorMessage('上传至七牛云失败：' + JSON.stringify(err));
      }
    })
  },
  list: function (option, cb) {
    let manager = getBucketManager();
    let opt = {
      limit: option.limit || 20,
      prefix: option.prefix || ''
    }
    if (option.marker) {
      opt.marker = option.marker
    }
    let bucket = getUserConfig().bucket;
    
    manager.listPrefix(bucket, opt, (err, respBody, respInfo) => {
      if (err) {
        console.log(err);
        throw err;
      }
      if (respInfo.statusCode == 200) {
        respBody.items.forEach(item => {
          item.url = processImgUrl(item.key);
        })
        cb({
          list: respBody.items,
          marker: respBody.marker
        })
      } else {
        console.log(respBody);
        vscode.window.showInformationMessage('获取七牛云列表失败：' + JSON.stringify(respBody));
      }
    });
  },
  remove(key) {
    let manager = getBucketManager();
    let bucket = getUserConfig().bucket;
    manager.delete(bucket, key, function (err, respBody, respInfo) {
      if (err) {
        console.log(err);
        vscode.window.showErrorMessage('删除失败：' + JSON.stringify(err));
        //throw err;
      } else {
        vscode.window.showInformationMessage('删除成功');
      }
    });
  }
}