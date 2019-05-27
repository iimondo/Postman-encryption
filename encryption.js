// ------------ 通用方法 ------------
// 提取{{}}中内容
function getBracketStr(text) {
  let result = "";
  let regex = /\{\{(.+?)\}\}/g;
  let options = text.match(regex);
  if (options && options.length > 0) {
    let option = options[0];
    if (option) {
      result = option.substring(2, option.length - 2);
    }
  }

  return result;
}

// 获取get请求所有参数
function getQueryParams() {
  const url = request.url;
  if (url.indexOf("?") !== -1) {
    let o = {};
    url
      .substr(url.indexOf("?") + 1)
      .split("&")
      .filter(i => i.length > 0)
      .forEach(i => {
        let s = i.split("=");
        o[s[0]] = s[1];
      });
    return o;
  }
}

// 获取form-data请求数据
function getFormDataParams() {
  if (typeof request.data === "string") {
    return JSON.parse(request.data);
  } else {
    return request.data;
  }
}

// ------------ 导入RSA ------------
if (!pm.globals.has("forgeJS")) {
  pm.sendRequest(
    "https://raw.githubusercontent.com/iimondo/Postman-encryption/master/forge.js",
    (err, res) => {
      if (!err) {
        pm.globals.set("forgeJS", res.text());
      }
    }
  );
}

eval(postman.getGlobalVariable("forgeJS"));

// ------------ AES 加密 ------------
function aesEncrypt(source, key, iv) {
  if (!key) {
    throw new Error("没有在初始化配置中找到AES Key");
  }

  if (!iv) {
    throw new Error("没有在初始化配置中找到AES iv");
  }

  const encrypted = CryptoJS.AES.encrypt(source, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString();
}

// ------------ RSA 加密 ------------
function rsaEncrypt(source, pubKey) {
  if (!pubKey) {
    throw new Error("未初始化RSA加密公钥，请配置环境变量");
  }

  const publicKey = forge.pki.publicKeyFromPem(pubKey);
  const encryptedText = forge.util.encode64(
    publicKey.encrypt(source, "RSAES-PKCS1-V1_5", {
      md: forge.md.sha1.create(),
      mgf: forge.mgf.mgf1.create(forge.md.sha1.create())
    })
  );

  return encryptedText;
}

// ------------ 初始化配置 ------------
// 所有请求参数
let requestParams = Object.assign(
  getFormDataParams(),
  request.headers,
  getQueryParams()
);

// 开始
function start(configs) {
  configs = Object.assign({ splitter: "$", pubKeyName: "pubKey"}, configs);
//   if (!pm.environment.has(configs.configsName)) {
//     pm.environment.set(configs.configsName, JSON.stringify(configs));
//   }

  let localStore = {};
  if (pm.environment.has("localStore")) {
    localStore = JSON.parse(pm.environment.get("localStore"));
  }

  Object.keys(requestParams).map(key => {
    let value = requestParams[key] + "";
    if (value.indexOf("{{") !== -1) {
      let content = getBracketStr(value);
      if (content.indexOf(`aes${configs.splitter}`) !== -1) {
        let c = content.split(`aes${configs.splitter}`)[1];
        let encryptedContent = pm.environment.get(c); // 变量内容
        encryptedContent = encryptedContent ? encryptedContent : c;
        pm.environment.set(
          content,
          aesEncrypt(encryptedContent, configs.key, configs.iv)
        );
        localStore[content] = aesEncrypt(
          encryptedContent,
          configs.key,
          configs.iv
        );
      } else if (content.indexOf(`rsa${configs.splitter}`) !== -1) {
        let c = content.split(`rsa${configs.splitter}`)[1];
        let encryptedContent = pm.environment.get(c); // 变量内容
        encryptedContent = encryptedContent ? encryptedContent : c;
        pm.environment.set(
          content,
          rsaEncrypt(encryptedContent, pm.environment.get(configs.pubKeyName))
        );
        localStore[content] = rsaEncrypt(
          encryptedContent,
          pm.environment.get(configs.pubKeyName)
        );
      } else if (content.indexOf(`md5${configs.splitter}`) !== -1) {
        let c = content.split(`md5${configs.splitter}`)[1];
        let encryptedContent = pm.environment.get(c); // 变量内容
        encryptedContent = encryptedContent ? encryptedContent : c;
        pm.environment.set(content, CryptoJS.MD5(encryptedContent).toString());
        localStore[content] = CryptoJS.MD5(encryptedContent).toString();
      }
    }
  });

  // 环境变量的Key和value
  pm.environment.set("localStore", JSON.stringify(localStore));
}
