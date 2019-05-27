// ------ 通用方法 ------
// 提取{{}}中内容
function getBracketStr(text) {
    let result = ''
    let regex = /\{\{(.+?)\}\}/g;
    let options = text.match(regex);
    if (options && options.length > 0) {
        let option = options[0];
        if (option) {
            result = option.substring(2, option.length - 2)
        }
    }
    
    return result
}


// ------ 导入RSA ------
if(!pm.globals.has("forgeJS")){
    pm.sendRequest("https://raw.githubusercontent.com/loveiset/RSAForPostman/master/forge.js", (err, res) => {
    if (!err) {
        pm.globals.set("forgeJS", res.text())
    }
})}

eval(postman.getGlobalVariable("forgeJS"));


// ------------ AES 加密 ------------
function aesEncrypt(content){
    //console.log('AES: ' + content);
    const key = CryptoJS.enc.Utf8.parse("Y5MUIOM7BUWI7BQR");
    const iv = CryptoJS.enc.Utf8.parse('S41AXIPFRFVJL73Z');
    const encrypted = CryptoJS.AES.encrypt(content, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
    return encrypted.toString();
}


// ------------ RSA 加密 ------------
function rsaEncrypt(content){
    const pubKey = pm.environment.get("RSA_Public_Key");
    if(pubKey){
        const publicKey = forge.pki.publicKeyFromPem(pubKey);
        const encryptedText = forge.util.encode64(
            publicKey.encrypt(content, 'RSAES-PKCS1-V1_5', {
              md: forge.md.sha1.create(),
              mgf: forge.mgf.mgf1.create(forge.md.sha1.create())
        }));
        
        return encryptedText;
    }
    
    throw new Error('未初始化RSA加密公钥，请配置RSA_Public_Key环境变量');
}


// ------ 存储所有未加密环境变量 ------
if(!pm.environment.has('localStore')){
    pm.environment.set('localStore', '{}');
}
let localStore = JSON.parse(pm.environment.get('localStore'));
// 获取当前请求中的加密变量
let requestData; 
if((typeof request.data) === 'string'){
    requestData = JSON.parse(request.data)
} else {
    requestData = request.data;
}

requestData = Object.assign(requestData, request.headers);
Object.keys(requestData).map(key => {
    let value = requestData[key] + ''; // 内容
    if (value.indexOf('{{') !== -1) { // 是否为变量
        let content = getBracketStr(value);
        // 判断是否加密
        if (content.indexOf('aes$') !== -1) {
            let c = content.split('aes$')[1];
            let encryptedContent = pm.environment.get(c); // 变量内容
            encryptedContent = encryptedContent ? encryptedContent : c;
            pm.environment.set(content, aesEncrypt(encryptedContent));
            localStore[content] = aesEncrypt(encryptedContent);
        } else if (content.indexOf('rsa$') !== -1) {
            let c = content.split('rsa$')[1];
            let encryptedContent = pm.environment.get(c); // 变量内容
            encryptedContent = encryptedContent ? encryptedContent : c;
            pm.environment.set(content, rsaEncrypt(encryptedContent));
            localStore[content] = rsaEncrypt(encryptedContent);
        } else if(content.indexOf('md5$') !== -1){
            let c = content.split('md5$')[1];
            let encryptedContent = pm.environment.get(c); // 变量内容
            encryptedContent = encryptedContent ? encryptedContent : c;
            pm.environment.set(content, CryptoJS.MD5(encryptedContent).toString());
            localStore[content] = CryptoJS.MD5(encryptedContent).toString();
        }
    }
});

pm.environment.set('localStore', JSON.stringify(localStore));
