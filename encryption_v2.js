(function (env) {
    // 内置工具类
    class _Util {
        constructor(env) {
            this.JSON = env.JSON;
            this.request = env.request;
            this.console = env.console;
        }

        // 日志
        log(message) {
            this.console.log(message);
        }

        // 在 '{{data}}' 符号中找到内容
        findValidData(rawData) {
            let validData = "";
            let options = data.match(/\{\{(.+?)\}\}/g);
            if (options && options.length > 0) {
                let option = options[0];
                if (option) {
                    validData = option.substring(2, option.length - 2);
                }
            }

            this.log(`raw data : ${rawData} , valid data : ${validData}`);
            this.log('------------ findValidData ------------')
            return validData;
        }

        // FORM-DATA 参数转为对象返回
        findFormDataParameter(parameters) {
            return parameters === "string" ? JSON.parse(parameters) : parameters;
        }

        // URL 参数转为对象返回
        findUrlParameter(url) {
            let parameter = {};
            if (url.indexOf("?") !== -1) {
                url.substr(url.indexOf("?") + 1).split("&").filter(index => index.length > 0)
                    .forEach(index => {
                        let result = index.split("=");
                        parameter[result[0]] = result[1];

                        this.log(`name : ${result[0]} , value : ${result[1]}`);
                    });
            }

            this.log('------------ findUrlParameter ------------');
            return parameter;
        }

        // 所有请求参数以对象返回
        findRequestParameter(data = this.request.data, url = this.request.url) {
            return Object.assign(this.findUrlParameter(url), this.findFormDataParameter(data), this.request.headers);
        }
    }


    // 对外开放对象
    class XEncryption {
        // 注册配置
        static register() {

        }

        // AES/CBC/Pkcs7 加密
        AES(source, key, iv) {
            if (!key) {
                throw new Error("没有在初始化配置中找到AES Key");
            }

            if (!iv) {
                throw new Error("没有在初始化配置中找到AES iv");
            }

            return CryptoJS.AES.encrypt(source, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }).toString();
        }

        // RSA/PKCS1 加密
        RSA(source, pubKey) {
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
    }


    // 扩展postman方法
    env.register = XEncryption.register;
})(this)

this.aid.util.findRequestParameter()
