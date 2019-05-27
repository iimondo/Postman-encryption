# Postman-encryption
Postman加密Pre-request Script

# 配置参数说明
- key: AES的Key
- iv: AES的iv,即偏移量
- splitter: 分割符，区别加密模式和加密内容, 默认值 '$'
- pubKeyName: 存储RSA公钥的环境变量名称, 默认值 pubkey

# 使用
在Collections的Pre-request script添加
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
    key: 'Y5MUIOM7BUWI7BQR',
    iv: 'S41AXIPFRFVJL73Z',
    pubKeyName: 'RSA_Public_Key'
});
```
