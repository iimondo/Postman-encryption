# Postman-encryption
Postman加密请求参数，支持AES, MD5，RSA...可自定加密方式.
> 微信号：onepiece2019

# 例子
下载本项目postman文件下的两个json文件, 分别为collections和环境变量，将其导入到Postman.
- Postman加密示例.postman_collection.json 导入到collection中
- Postman加密示例.postman_environment.json 导入到环境变量中

以下是用MD5加密的示例
<div align=center>
<img src="https://gitee.com/aletto/Postman-encryption/raw/master/console.png" />
<!-- <img src="images/console.png" /> -->
</div>

# 原理
Postman支持在**Pre-request Script**和**Tests**中编写Js脚本，并且内置了一些方法比如可以用 
```pm.environment.get(mobile)```方法来获取当前环境下mobile变量的内容，
```pm.environment.set(key,value)```方法则动态添加变量的名称及内容...详情[教程](https://learning.postman.com/docs/postman/scripts/test-scripts/)请查看官网.

在Postman内置的方法中，有些可以获取当前请求信息(请求方式、请求头、请求体...)，但它并不支持修改请求信息，比如我们无法把POST请求中的mobile参数修改为加密后的结果，一句话**Postman只支持读不支持写**.

那我们如何进行加密呢？我的想法是**将加密结果设置在环境变量中**，用Postman提交请求时如果我们的参数为变量，通过脚本获取到的参数则是变量的名称，比如在POST请求其中参数```{{mobile}}```为变量，那我们通过脚本获所取的请求参数为{{mobile}}字符串，我们通过```get```方法获取mobile变量的原始内容将其加密，然后将其替换为加密的结果，这样我们在请求的时候mobile变量是加密后的内容了.

上面用MD5加密的例子中，我们通过@符号分隔加密方式和加密内容，加密内容支持变量和非变量，在请求的过程中，会获取右边待加密的值，然后将其加密并设置到这个变量中，在Postman中如果请求参数用{{}}符号包裹，其内部会自动从当前或全局变量中查找其对应的值，在上述例子中我们动态创建{{md5@1234}}这个变量，并将加密好的内容设置到了这个变量中，所以在请求时，Postman查找的变量就成了加密后结果.

# 实现RSA加密原理
虽然我们的AES和MD5加密是用Postman中内置的CryptoJS库完成的，但这个库有一个缺点，就是不支持RSA加密，那如何解决RSA加密的问题呢？

要实现RSA加密需要用到两个关键的方法```pm.sendRequest```和```eval```, 通过```pm.sendRequest```获取返回的脚本字符串然后再用```eval```执行这个脚本，这样在Postman的环境中就会存在该脚本了，这里我用的是[forge.js](https://github.com/digitalbazaar/forge)进行RSA加密.

```javascript
if (!pm.globals.has("forgeJS")) {
  pm.sendRequest(
    "https://gitee.com/time895/Postman-encryption/raw/master/encryption.js",
    (err, res) => {
        if (!err) {
            pm.globals.set("forgeJS", res.text());
        }
    }
  );
}

eval(postman.getGlobalVariable("forgeJS"));
```