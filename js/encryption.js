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
            let options = rawData.match(/\{\{(.+?)\}\}/g);
            if (options && options.length > 0) {
                let option = options[0];
                if (option) {
                    validData = option.substring(2, option.length - 2);
                }
            }

            this.log(`raw data : ${rawData} , valid data : ${validData}`);
            return validData.toString();
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

        /**
         * @param name 加密方式名称
         */
        constructor(name) {
            this.name = name;

            // pm 参数
            this.JSON = env.JSON;
            this.CryptoJS = env.CryptoJS;
            this.environment = env.pm.environment;
        }

        /**
         * 开始加密
         */
        start(raw) {
            if (raw.indexOf(this.name + this.splitter) !== -1) {
                let encryptValue = this._getEncryptedContent(raw);
                this._save(raw, this.overrder(encryptValue, raw).toLocaleUpperCase());
            }
        }

        /**
         * 获取加密内容，如果为环境变量返回环境变量值，否则直接返回内容
         * 
         * @param data 要加密的数据，右边为数据，左边为加密方式
         */
        _getEncryptedContent(data) {
            let content = data.split(this.name + this.splitter)[1];
            let encryptedContent = this.environment.get(content);
            encryptedContent = encryptedContent ? encryptedContent : content;
            return encryptedContent;
        }

        /**
         * 保存数据到本地
         * 
         * @param name  环境变量名称
         * @param value 加密后结果
         */
        _save(name, value) {
            // 把加密后的结果，设置到环境变量中
            this.environment.set(name, value);

            // 所有动态生成的环境变量
            let encryptionHistory = {};
            if (this.environment.has("HistoryTrace")) {
                encryptionHistory = this.JSON.parse(this.environment.get("HistoryTrace"));
            }

            encryptionHistory[name] = value;
            this.environment.set("HistoryTrace", this.JSON.stringify(encryptionHistory));
        }

        /**
         * @param after  解析后的数据，返回为待加密内容
         * @param before 解析前数据，返回了待加密内容及加密方式
         * 
         * 子类重写此方法，实现具体加密, 返回加密结果
         */
        overrder(after, before) {
            return '';
        }

        toString() {
            return this.name;
        }
    }


    /**
     * MD5 加密
     */
    class MD5 extends AbsEncrypt {

        constructor() {
            super('md5');
        }

        overrder(data) {
            return this.CryptoJS.MD5(data).toString();
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
        constructor(key, iv) {
            super('aes');
            this.iv = iv;
            this.key = key;
        }

        overrder(data) {
            if (!this.key) { throw new Error("没有在初始化配置中找到AES Key"); }
            if (!this.iv) { throw new Error("没有在初始化配置中找到AES iv"); }

            return this.CryptoJS.AES.encrypt(data, this.CryptoJS.enc.Utf8.parse(this.key), {
                iv: this.CryptoJS.enc.Utf8.parse(this.iv), // 偏移量
                mode: this.CryptoJS.mode.CBC,              // 加密模式
                padding: this.CryptoJS.pad.Pkcs7           // 填充模式
            }).toString();
        }
    }


    /**
     * RSA加密
     */
    class RSA extends AbsEncrypt {
        constructor(privateKey) {
            super('rsa');
        }
    }


    // 初始化
    function register(configs = {
        log: true,         // 日志开关
        splitter: "@",      // 加密分割符，分割加密方式和加密内容
        key: pm.environment.get("aes_key"),         // AES 密钥
        iv: pm.environment.get("aes_iv"),           // AES 偏移量
        pubKey: pm.environment.get('rsa_key')   // RSA 私钥
    }, encryptMethods = []) {
        const util = new _Util(env, configs.log);
        const requestParameters = util.findRequestParameter();

        // 支持的加密方式
        let supportMethods = encryptMethods.concat([
            new MD5(),
            new AES(configs.key, configs.iv),
            new RSA('-----BEGIN PUBLIC KEY-----\n' + configs.pubKey + '-----END PUBLIC KEY-----')
        ]);

        // 设置分隔符号
        supportMethods.forEach(method => method.splitter = configs.splitter);

        // 遍历所有请求参数，执行加密
        Object.keys(requestParameters).map(key => {
            let value = requestParameters[key].toString();
            if (value.indexOf("{{") !== -1) {
                let validData = util.findValidData(value); // 找回要加密内容
                supportMethods.forEach(method => method.start(validData));
            }
        });
    }

    // 导出方法, 对象
    env.register = register;
    env.AbsEncrypt = AbsEncrypt;
})(this);