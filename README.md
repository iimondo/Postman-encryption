> 没有开放AES和RSA模式的接口, 如果你有需要或其他建议可以联系本人, QQ:1428728432

# Postman-encryption
Postman加密Pre-request Script

# 配置参数说明
- key: AES的Key
- iv: AES的iv,即偏移量
- splitter: 分割符，区别加密模式和加密内容, 默认值 '$'
- pubKeyName: 存储RSA公钥的环境变量名称, 默认值 pubkey

# 添加脚本
## 在Collections的Pre-request script添加
```
// ------ 导入加密脚本 ------
if(!pm.environment.has("autoEncryption")){
    pm.sendRequest("https://raw.githubusercontent.com/iimondo/Postman-encryption/master/encryption.js", (err, res) => {
    if (!err) {
        pm.environment.set("autoEncryption", res.text());
    }
})}

eval(pm.environment.get("autoEncryption"));

// 初始化配置
start({
    key: '123456789',
    iv: '123456789',
    pubKeyName: 'RSA_Public_Key'
});
```
## 在Collections的Tests中添加
```
if(!pm.environment.has("autoClear")){
    pm.sendRequest("https://raw.githubusercontent.com/iimondo/Postman-encryption/master/clear.js", (err, res) => {
    if (!err) {
        pm.environment.set("autoClear", res.text());
    }
})}

eval(pm.environment.get("autoClear"));
```
Tests中的脚本是用来清除动态生成的环境变量，如果你想保留，可以不添加此脚本

# 注意事项
- RSA公钥添加时必须首尾加上特殊字符，如下:<br>'-----BEGIN PUBLIC KEY-----\n' + pub_key + '-----END PUBLIC KEY-----'<br>
一般用户在登录后返回rsa的公钥，我们可以在登录接口的tests添加如下脚本：
```
const body = JSON.parse(responseBody);
if(body.code === 200){
    // 设置公钥
    pm.environment.set("RSA_Public_Key", 
    '-----BEGIN PUBLIC KEY-----\n' + body.data.pub_key + '-----END PUBLIC KEY-----');
}
```
当然如果你的公钥是存放在本地，则可以直接写死在环境变量中
- 加密使用的是[forge Project](https://github.com/digitalbazaar/forge)

# 例子
- 用md5, 加密GET请求query参数
<div align=center>
<img src="images/md5.png" />
</div>

- 用AES，加密Post请求中的Body, {{aes$mobile}}中的mobile是已有环境变量
<div align=center>
<img src="images/aes.png" />
</div>