(function (env) {
    // 内置工具类
    class _Util {
        constructor(env, log) {
            this.isLog = log;
            this.JSON = env.JSON;
            this.request = env.request;
            this.console = env.console;
        }

        // 日志
        log(message) {
            this.isLog && this.console.log(message);
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
            this.log('------------ findValidData ------------');
            return validData;
        }

        // FORM-DATA 参数转为对象返回
        findFormDataParameter(parameters) {
            return (typeof parameters === "string") ? this.JSON.parse(parameters) : parameters;
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

            this.log('------------ URL上的参数 ------------');
            return parameter;
        }

        // 所有请求参数以对象返回
        findRequestParameter(data = this.request.data, url = this.request.url) {
            return Object.assign(this.findUrlParameter(url), this.findFormDataParameter(data), this.request.headers);
        }
    }

    /**
     * 加密抽象类
     */
    class AbsEncrypt {

        constructor(name, splitter) {
            this.name = name;
            this.localStore = {};
            this.splitter = splitter;
        }

        getEncryptedContent(raw) {
            let raw = raw.split(`${this.name + this.splitter}`)[1];
            let encryptedContent = env.pm.environment.get(raw);
            encryptedContent = encryptedContent ? encryptedContent : raw;
            return encryptedContent;
        }

        encrypt(raw) {
            let encryptValue = this.getEncryptedContent(raw);
            this.localStore[content] = this.overrder(encryptValue);
            pm.environment.set("localStore", JSON.stringify(this.localStore));
        }

        overrder(raw) {
            // 子类重写此方法，实现具体加密
        }
    }


    /**
     * MD5 加密
     */
    class MD5 extends AbsEncrypt {

        constructor(splitter) {
            super('md5', splitter);
        }

        overrder(data) {
            return CryptoJS.MD5(data).toString();
        }
    }


    /**
     * AES加密
     */
    class AES extends AbsEncrypt {

        /**
         * @param {*} splitter // 加密分割符, 分割加密方式和加密内容
         * @param {*} key      // AES 密钥
         * @param {*} iv       // AES 偏移量
         */
        constructor(splitter, key, iv) {
            super('aes', splitter);
            this.iv = iv;
            this.key = key;

            if (!this.key) { throw new Error("没有在初始化配置中找到AES Key"); }
            if (!this.iv) { throw new Error("没有在初始化配置中找到AES iv"); }
        }

        overrder(data) {
            return CryptoJS.AES.encrypt(data, this.key, {
                iv: this.iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
        }
    }


    // 初始化
    function register(configs = {
        log: false,         // 日志开关
        splitter: "$",      // 加密分割符，分割加密方式和加密内容
        key: '',            // AES 密钥
        iv: '',             // AES 偏移量
        privateKey: ''      // RSA 私钥
    }, encryptMethods) {
        const util = new _Util(env, configs.log);
        const requestParameters = util.findRequestParameter();

        // 支持的加密方式
        let supportMethods = [new AES(configs.splitter, configs.key, configs.iv), new MD5(configs.splitter)];

        // 遍历所有请求参数，执行加密
        Object.keys(requestParameters).map(key => {
            let value = requestParameters[key].toString();
            if (value.indexOf("{{") !== -1) {
                let validData = util.findValidData(value);
                supportMethods.forEach(method => method.encrypt(validData));
            }
        });
    }


    // 导出方法, 对象
    env.register = register;
    env.AbsEncrypt = AbsEncrypt;
})(this);



this.register({ log: true });