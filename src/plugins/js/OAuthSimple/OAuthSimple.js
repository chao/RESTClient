/* OAuthSimple
  * A simpler version of OAuth
  *
  * author:     jr conlin
  * mail:       src+oa@jrconlin.com
  * copyright:  unitedHeroes.net
  * version:    1.2
  * url:        http://unitedHeroes.net/OAuthSimple
  *
  * Copyright (c) 2011, unitedHeroes.net
  *
  * Redistribution and use in source and binary forms, with or without
  * modification, are permitted provided that the following conditions are met:
  *     * Redistributions of source code must retain the above copyright
  *       notice, this list of conditions and the following disclaimer.
  *     * Redistributions in binary form must reproduce the above copyright
  *       notice, this list of conditions and the following disclaimer in the
  *       documentation and/or other materials provided with the distribution.
  *     * Neither the name of the unitedHeroes.net nor the
  *       names of its contributors may be used to endorse or promote products
  *       derived from this software without specific prior written permission.
  *
  * THIS SOFTWARE IS PROVIDED BY UNITEDHEROES.NET ''AS IS'' AND ANY
  * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  * DISCLAIMED. IN NO EVENT SHALL UNITEDHEROES.NET BE LIABLE FOR ANY
  * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var OAuthSimple;

if (OAuthSimple === undefined) {
    /* Simple OAuth
     *
     * This class only builds the OAuth elements, it does not do the actual
     * transmission or reception of the tokens. It does not validate elements
     * of the token. It is for client use only.
     *
     * api_key is the API key, also known as the OAuth consumer key
     * shared_secret is the shared secret (duh).
     *
     * Both the api_key and shared_secret are generally provided by the site
     * offering OAuth services. You need to specify them at object creation
     * because nobody <explative>ing uses OAuth without that minimal set of
     * signatures.
     *
     * If you want to use the higher order security that comes from the
     * OAuth token (sorry, I don't provide the functions to fetch that because
     * sites aren't horribly consistent about how they offer that), you need to
     * pass those in either with .signatures() or as an argument to the
     * .sign() or .getHeaderString() functions.
     *
     * Example:
       <code>
        var oauthObject = OAuthSimple().sign({path:'http://example.com/rest/',
                                              parameters: 'foo=bar&gorp=banana',
                                              signatures:{
                                                api_key:'12345abcd',
                                                shared_secret:'xyz-5309'
                                             }});
        document.getElementById('someLink').href=oauthObject.signed_url;
       </code>
     *
     * that will sign as a "GET" using "SHA1-MAC" the url. If you need more than
     * that, read on, McDuff.
     */

    /** OAuthSimple creator
     *
     * Create an instance of OAuthSimple
     *
     * @param api_key {string}       The API Key (sometimes referred to as the consumer key) This value is usually supplied by the site you wish to use.
     * @param shared_secret (string) The shared secret. This value is also usually provided by the site you wish to use.
     */
    OAuthSimple = function (consumer_key, shared_secret) {
/*        if (api_key == undefined)
            throw("Missing argument: api_key (oauth_consumer_key) for OAuthSimple. This is usually provided by the hosting site.");
        if (shared_secret == undefined)
            throw("Missing argument: shared_secret (shared secret) for OAuthSimple. This is usually provided by the hosting site.");
*/  
        var self = {};
        self._secrets = {};


        // General configuration options.
        if (consumer_key !== undefined) {
            self._secrets['consumer_key'] = consumer_key;
        }
        if (shared_secret !== undefined) {
            self._secrets['shared_secret'] = shared_secret;
        }
        self._default_signature_method = 'HMAC-SHA1';
        self._action = 'GET';
        self._nonce_chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        self._parameters = {};


        self.reset = function () {
            this._parameters = {};
            this._path = undefined;
            this.sbs = undefined;
            return this;
        };
        self.setRealm = function(realm)
        {
            this._realm = realm;
        }


        /** set the parameters either from a hash or a string
         *
         * @param {string,object} List of parameters for the call, this can either be a URI string (e.g. "foo=bar&gorp=banana" or an object/hash).
         */
        self.setParameters = function (parameters) {
            if (parameters === undefined) {
                parameters = {};
            }
            if (typeof (parameters) == 'string') {
                parameters = this._parseParameterString(parameters);
            }
            console.log('[OAuthSimple.js] setParameters', parameters, this._parameters);
            this._parameters = Object.assign(this._parameters, parameters);
            console.log('[OAuthSimple.js] setParameters result', this._parameters);
            if (this._parameters['oauth_nonce'] === undefined) {
                this._getNonce();
            }
            if (this._parameters['oauth_timestamp'] === undefined) {
                this._getTimestamp();
            }
            if (this._parameters['oauth_signature_method'] === undefined) {
                this.setSignatureMethod();
            }
            if (this._parameters['oauth_consumer_key'] === undefined) {
                this._getApiKey();
            }
            if (this._parameters['oauth_token'] === undefined) {
                this._getAccessToken();
            }
            if (this._parameters['oauth_version'] === undefined) {
                this._parameters['oauth_version'] = '1.0';
            }

            return this;
        };

        /** Set the target URL (does not include the parameters)
         *
         * @param path {string} the fully qualified URI (excluding query arguments) (e.g "http://example.org/foo").
         */
        self.setURL = function (path) {
            // TODO: The scheme and host MUST be in lowercase.
            // TODO: The port MUST be included if it is not the default port for the scheme, and MUST be excluded if it is the default. 

            if (path === '') {
                throw ('No path specified for OAuthSimple.setURL');
            }
            this._path = path;
            return this;
        };

        /** set the "action" for the url, (e.g. GET,POST, DELETE, etc.)
         *
         * @param action {string} HTTP Action word.
         */
        self.setAction = function (action) {
            if (action === undefined) {
                action = 'GET';
            }
            action = action.toUpperCase();
            if (action.match('[^A-Z]')) {
                throw ('Invalid action specified for OAuthSimple.setAction');
            }
            this._action = action;
            return this;
        };

        /** set the signatures (as well as validate the ones you have)
         *
         * @param signatures {object} object/hash of the token/signature pairs {api_key:, shared_secret:, oauth_token: oauth_secret:}.
         */
        self.signatures = function (signatures) {
            if (signatures) {
                this._secrets = this._merge(signatures, this._secrets);
            }
            // Aliases
            if (this._secrets['api_key']) {
                this._secrets.consumer_key = this._secrets.api_key;
            }
            if (this._secrets['access_token']) {
                this._secrets.oauth_token = this._secrets.access_token;
            }
            if (this._secrets['access_secret']) {
                this._secrets.shared_secret = this._secrets.access_secret;
            }
            if (this._secrets['oauth_token_secret']) {
                this._secrets.oauth_secret = this._secrets.oauth_token_secret;
            }
            // Gauntlet
            if (this._secrets.consumer_key === undefined) {
                throw ('Missing required consumer_key in OAuthSimple.signatures');
            }
            if (this._secrets.shared_secret === undefined) {
                throw ('Missing required shared_secret in OAuthSimple.signatures');
            }
            if ((this._secrets.oauth_token !== undefined) && (this._secrets.oauth_secret === undefined)) {
                throw ('Missing oauth_secret for supplied oauth_token in OAuthSimple.signatures');
            }
            return this;
        };

        self.setTokensAndSecrets = function (signatures) {
            return this.signatures(signatures);
        };

        /** set the signature method (currently only Plaintext or SHA-MAC1)
         *
         * @param method {string} Method of signing the transaction (only PLAINTEXT and SHA-MAC1 allowed for now).
         */
        self.setSignatureMethod = function (method) {
            if (method === undefined) {
                method = this._default_signature_method;
            }
            if (method.toUpperCase().match(/(PLAINTEXT|HMAC-SHA1|HMAC-SHA256)/) === undefined) {
                throw ('Unknown signing method specified for OAuthSimple.setSignatureMethod');
            }
            this._parameters['oauth_signature_method'] = method.toUpperCase();
            return this;
        };

        /** sign the request
         *
         * note: all arguments are optional, provided you've set them using the
         * other helper functions.
         *
         * @param args {object} hash of arguments for the call
         *                   {action:, path:, parameters:, method:, signatures:}
         *                   all arguments are optional.
         */
        self.sign = function (args) {
            if (args === undefined) {
                args = {};
            }
            // Set any given parameters
            if (args['action'] !== undefined) {
                this.setAction(args['action']);
            }
            if (args['path'] !== undefined) {
                this.setPath(args['path']);
            }
            if (args['method'] !== undefined) {
                this.setSignatureMethod(args['method']);
            }

            if (typeof args['signatures'] !== 'undefined') {
                this.signatures(args['signatures']);
            }
            if (typeof args['parameters'] !== 'undefined')
            {
                this.setParameters(args['parameters']);
            }
            
            // check the parameters
            var normParams = this._normalizedParameters();
            console.log('[OAuthSimple.js] sign', this._parameters, normParams);
            this._parameters['oauth_signature'] = this._generateSignature(normParams);
            console.log('[OAuthSimple.js] sign', normParams, this._parameters['oauth_signature']);
            var signature = this._oauthEscape(this._parameters['oauth_signature']);

            return {
                parameters: this._parameters,
                signature: this._parameters['oauth_signature'],
                signed_url: this._path + '?' + normParams + '&oauth_signature=' + signature,
                header: this.getHeaderString()
            };
        };

        /** Return a formatted "header" string
         *
         * NOTE: This doesn't set the "Authorization: " prefix, which is required.
         * I don't set it because various set header functions prefer different
         * ways to do that.
         *
         * @param args {object} see .sign.
         */
        self.getHeaderString = function (args) {
            if (this._parameters['oauth_signature'] === undefined) {
                this.sign(args);
            }
            
            var j, pName, pLength, prefix = 'OAuth ', result = '';
            if (typeof this._realm === 'string' || this._realm === true)
            {
                var realm = '';
                if (typeof this._realm === 'boolean' && isWebUrl(this._path))
                {
                    var realm = urlResolve(this._path, '/');
                }
                else
                {
                    realm = this._realm || '';
                }
                realm = realm.replace(/[\""]/g, '\\"');
                prefix += 'realm="' + realm + '", ';
            }
            for (pName in this._parameters) {
                if (this._parameters.hasOwnProperty(pName)) {
                    console.log('[OAuthSimple.js] getHeaderString', pName, pName.match(/^oauth/));
                    if (!pName.match(/^oauth/)) {
                        continue;
                    }
                    if ((this._parameters[pName]) instanceof Array) {
                        pLength = this._parameters[pName].length;
                        for (j = 0; j < pLength; j++) {
                            result += pName + '="' + this._oauthEscape(this._parameters[pName][j]) + '", ';
                        }
                    }
                    else {
                        result += pName + '="' + this._oauthEscape(this._parameters[pName]) + '", ';
                    }
                }
            }
            return prefix + result.replace(/,\s+$/, '');
        };

        // Start Private Methods.

        /** convert the parameter string into a hash of objects.
         *
         */
        self._parseParameterString = function (paramString) {
            var elements = paramString.split('&'),
                result = {},
                element;
            for (element = elements.shift(); element; element = elements.shift()) {
                var keyToken = element.split('='),
                    value = '';
                if (keyToken[1]) {
                    value = decodeURIComponent(keyToken[1]);
                }
                if (result[keyToken[0]]) {
                    if (!(result[keyToken[0]] instanceof Array)) {
                        result[keyToken[0]] = new Array(result[keyToken[0]], value);
                    }
                    else {
                        result[keyToken[0]].push(value);
                    }
                }
                else {
                    result[keyToken[0]] = value;
                }
            }
            return result;
        };

        self._oauthEscape = function (string) {
            if (string === undefined) {
                return '';
            }
            if (string instanceof Array) {
                throw ('Array passed to _oauthEscape');
            }
            return encodeURIComponent(string).replace(/\!/g, '%21').
                replace(/\*/g, '%2A').
                replace(/'/g, '%27').
                replace(/\(/g, '%28').
                replace(/\)/g, '%29');
        };
        
        self._getNonce = function (length) {
            if (length === undefined) {
                length = 5;
            }
            var result = '',
                i = 0,
                rnum,
                cLength = this._nonce_chars.length;
            for (; i < length; i++) {
                rnum = Math.floor(Math.random() * cLength);
                result += this._nonce_chars.substring(rnum, rnum + 1);
            }
            this._parameters['oauth_nonce'] = result;
            return result;
        };

        self._getApiKey = function () {
            if (this._secrets.consumer_key === undefined) {
                throw ('No consumer_key set for OAuthSimple.');
            }
            this._parameters['oauth_consumer_key'] = this._secrets.consumer_key;
            return this._secrets.consumer_key;
        };

        self._getAccessToken = function () {
            if (this._secrets['oauth_secret'] === undefined) {
                return '';
            }
            if (this._secrets['oauth_token'] === undefined) {
                throw ('No oauth_token (access_token) set for OAuthSimple.');
            }
            this._parameters['oauth_token'] = this._secrets.oauth_token;
            return this._secrets.oauth_token;
        };

        self._getTimestamp = function () {
            var ts = Math.floor((new Date()).getTime() / 1000);
            this._parameters['oauth_timestamp'] = ts;
            return ts;
        };

        self.b64_hmac_sha1 = function (key, base_string) {
            return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
        };
        self.b64_hmac_sha256 = function (key, base_string) {
            return CryptoJS.HmacSHA256(base_string, key).toString(CryptoJS.enc.Base64);
        };

        self._normalizedParameters = function () {
            var elements = [],
                paramNames = [],
                i = 0,
                ra = 0;
            for (var paramName in this._parameters) {
                if (this._parameters.hasOwnProperty(paramName)) {
                    if (ra++ > 1000) {
                        throw ('runaway 1');
                    }
                    paramNames.unshift(paramName);
                }
            }
            paramNames = paramNames.sort();
            var pLen = paramNames.length;
            for (; i < pLen; i++) {
                paramName = paramNames[i];
                //skip secrets.
                if (paramName.match(/\w+_secret/)) {
                    continue;
                }
                if (this._parameters[paramName] instanceof Array) {
                    var sorted = this._parameters[paramName].sort(),
                        spLen = sorted.length,
                        j = 0;
                    for (; j < spLen; j++) {
                        if (ra++ > 1000) {
                            throw ('runaway 1');
                        }
                        elements.push(this._oauthEscape(paramName) + '=' +
                            this._oauthEscape(sorted[j]));
                    }
                    continue;
                }
                elements.push(this._oauthEscape(paramName) + '=' +
                    this._oauthEscape(this._parameters[paramName]));
            }
            return elements.join('&');
        };

        self._generateSignature = function (normParams) {
            if (normParams == null) {
                normParams = "";
            }
            var secretKey = this._oauthEscape(this._secrets.shared_secret) + '&' +
                this._oauthEscape(this._secrets.oauth_secret);
            console.log('[OAuthSimple.js] self._generateSignature', this._parameters['oauth_signature_method'], secretKey);
            if (this._parameters['oauth_signature_method'] == 'PLAINTEXT') {
                return secretKey;
            }
            if (normParams == "") {
                normParams = this._normalizedParameters();
            }
            if (this._parameters['oauth_signature_method'] == 'HMAC-SHA1') {
                var sigString = this._oauthEscape(this._action) + '&' + this._oauthEscape(this._path) + '&' + this._oauthEscape(normParams);
                console.log('[OAuthSimple.js] _generateSignature', secretKey, sigString);
                var result = this.b64_hmac_sha1(secretKey, sigString);
                console.log('[OAuthSimple.js] b64_hmac_sha1', result);
                return result;
            }
            if (this._parameters['oauth_signature_method'] == 'HMAC-SHA256') {
                var sigString = this._oauthEscape(this._action) + '&' + this._oauthEscape(this._path) + '&' + this._oauthEscape(normParams);
                console.log('[OAuthSimple.js] _generateSignature', secretKey, sigString);
                var result = this.b64_hmac_sha256(secretKey, sigString);
                console.log('[OAuthSimple.js] b64_hmac_sha256', result);
                return result;
            }
            return null;
        };

        self._merge = function (source, target) {
            if (source === undefined)
                source = {};
            if (target === undefined)
                target = {};
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
            return target;
        };

        return self;
    };
}
