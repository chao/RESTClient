/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

This script is based on oAuthSimple (http://github.com/jrconlin/oauthsimple).

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may
      be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ***** END LICENSE BLOCK ***** */

"use strict";

restclient.oauth = {
  _nonceRange : "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  reset: function() {
    delete this._parameters;
    delete this._path;
    delete this._secret;
    delete this._realm;
  },
  sign: function(arg) {
    //restclient.log(arg);
    if(arg.action)
      this.setAction(arg.action);
    if(arg.signatures)
      this.setSignatures(arg.signatures);
    if(arg.parameters)
      this.setParameters(arg.parameters);
    if(arg.path)
      this.setPath(arg.path);
    if(typeof arg.realm !== 'undefined')
      this._realm = arg.realm;

    var normParams = this.normalizeToString();
    //restclient.log(normParams);
    var oauth_signature = this.generateSignature(normParams);
    //console.error(oauth_signature);
    this._parameters['oauth_signature'] = oauth_signature;

    return {
        parameters: this._parameters,
        signature: this.oauthEscape(oauth_signature),
        signed_url: this._path + '?' + this.normalizeToString(),
        headerString: this.getHeaderString()
    };
  },
  setAction: function(action) {
    if (typeof action === "undefined") {
        action="GET";
    }
    action = action.toUpperCase();
    if (action.match('[^A-Z]')) {
        throw ('Invalid action specified for restclient.oauth.setAction');
    }
    this._action = action;
    return this;
  },
  setPath: function(path) {
    if (path == '') {
      throw ('path is empty for restclient.oauth.setPath');
    }
    this._path = path;
    return this;
  },
  setSignatureMethod: function(method) {
    method = (typeof method === 'undefined') ? 'PLAINTEXT' : method.toUpperCase();
    if (typeof method.match(/(PLAINTEXT|HMAC-SHA1)/) === 'undefined') {
        throw ('Signing method [' + method + '] is unsupported for restclient.oauth.setSignatureMethod');
    }
    if (!this._parameters)
      this._parameters = {};
    this._parameters['oauth_signature_method'] = method;
    return this;
  },
  setSignatures: function(signatures) {
    if(!this._secrets)
      this._secrets = {};

    if(signatures.consumer_key)
      this._secrets.consumer_key = signatures.consumer_key;
    else
      throw('Missing required consumer_key in resclient.oauth.setSignatures');

    if(signatures.consumer_secret)
      this._secrets.consumer_secret = signatures.consumer_secret;
    else
      throw('Missing required consumer_secret in resclient.oauth.setSignatures');

    if(signatures.access_token)
      this._secrets.oauth_token = signatures.access_token;

    if(signatures.access_secret)
      this._secrets.oauth_secret = signatures.access_secret;

    if(signatures.oauth_token)
      this._secrets.oauth_token = signatures.oauth_token;

    if(signatures.oauth_token_secret)
      this._secrets.oauth_secret = signatures.oauth_token_secret;

    if(typeof signatures.oauth_token == 'string' && typeof this._secrets.oauth_secret == 'undefined')
      throw('Missing required oauth_secret in resclient.oauth.setSignatures');
  },
  setConsumerKey: function() {
    if (!this._secrets['consumer_key'])
        throw('No consumer_key set for restclient.oauth.setConsumerKey');

    return this._parameters['oauth_consumer_key'] = this._secrets.consumer_key;
  },
  setAccessToken: function() {
    if (!this._secrets['oauth_secret'])
        return '';

    if (!this._secrets['oauth_token'])
        throw('No oauth_token (access_token) set for restclient.oauth.setAccessToken');
    return this._parameters['oauth_token'] = this._secrets.oauth_token;
  },
  setParameters: function(p) {
    if (!p) p = {};
    if (!this._parameters)
      this._parameters = {};

    $.extend(this._parameters, p);
    if (!p['oauth_nonce'])
      this._parameters.oauth_nonce = this.getNonce();

    if (!p['oauth_timestamp'])
      this._parameters.oauth_timestamp = this.getTimeStamp();

    if (!p['oauth_version'])
      this._parameters.oauth_version = '1.0';

    if (!p['oauth_signature_method'])
      this.setSignatureMethod();

    if (!p['oauth_consumer_key'])
        this.setConsumerKey();

    if(!p['oauth_token'])
        this.setAccessToken();
  },
  generateSignature: function(str){
    var consumer_secret = this._secrets['consumer_secret'],
        oauth_secret = this._secrets['oauth_secret'],
        encrypt = this._parameters['oauth_signature_method'] || 'PLAINTEXT';

    var secretKey = restclient.oauth.oauthEscape(consumer_secret) + '&' +
        restclient.oauth.oauthEscape(oauth_secret);
    if (encrypt == 'PLAINTEXT')
    {
      return secretKey;
    }
    if (encrypt == 'HMAC-SHA1')
    {
      //restclient.log(this._parameters);
      //restclient.log(str);
      var toSign = restclient.oauth.oauthEscape(this._action)
                        + '&' + restclient.oauth.oauthEscape(this._path)
                        + '&' + restclient.oauth.oauthEscape(str);
      //restclient.log(toSign);
      //restclient.log(secretKey);
      return this.b64_hmac_sha1(secretKey, toSign);
    }
    return null;
  },
  normalizeToString: function(parameters) {
    parameters = parameters || this._parameters;
    //restclient.log(parameters);
    var names = [], result = [];
    for(var n in parameters) {
      if(!parameters.hasOwnProperty(n))
        continue;

      names.push(n);
    }
    names = names.sort();

    for(var i=0, n; n = names[i]; i++) {
      //restclient.log(n);
      if(n.match(/\w+_secret/))
        continue;
      //restclient.log(n);
      if(Object.prototype.toString.call(parameters[n]) == '[object Array]')
      {
        var sorted = parameters[n].sort();
        for(var j=0, s; s = sorted[j]; j++) {
          result.push(
            restclient.oauth.oauthEscape(n) + "=" + restclient.oauth.oauthEscape(s)
          );
        }
        continue;
      }

      result.push(
        restclient.oauth.oauthEscape(n) + "=" + restclient.oauth.oauthEscape(parameters[n])
      );
    }

    return result.join('&');
  },
  oauthEscape: function(obj) {
    if (typeof obj === 'undefined') {
      return "";
    }
    if (obj instanceof Array)
    {
      throw('Array passed to restclient.main.oauthEscape: ' + JSON.stringify(obj));
    }
    return encodeURIComponent(obj).replace(/\!/g, "%21")
                                  .replace(/\*/g, "%2A")
                                  .replace(/'/g, "%27")
                                  .replace(/\(/g, "%28")
                                  .replace(/\)/g, "%29");
  },
  getTimeStamp: function() {
    return Math.floor(new Date().getTime()/1000);
  },
  getNonce: function(len) {
    if( typeof len === 'undefined') {
      len = 15;
    }

    var result = "";
    for (var i = 0; i < len; ++i) {
        var rnum = Math.floor(Math.random() * restclient.oauth._nonceRange.length);
        result += restclient.oauth._nonceRange.substring(rnum, rnum+1);
    }
    return result;
  },
  b64_hmac_sha1: function(k,d,_p,_z){
    // heavily optimized and compressed version of http://pajhome.org.uk/crypt/md5/sha1.js
    // _p = b64pad, _z = character size; not used here but I left them available just in case
    if(!_p){_p='=';}if(!_z){_z=8;}function _f(t,b,c,d){if(t<20){return(b&c)|((~b)&d);}if(t<40){return b^c^d;}if(t<60){return(b&c)|(b&d)|(c&d);}return b^c^d;}function _k(t){return(t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514;}function _s(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}function _r(n,c){return(n<<c)|(n>>>(32-c));}function _c(x,l){x[l>>5]|=0x80<<(24-l%32);x[((l+64>>9)<<4)+15]=l;var w=[80],a=1732584193,b=-271733879,c=-1732584194,d=271733878,e=-1009589776;for(var i=0;i<x.length;i+=16){var o=a,p=b,q=c,r=d,s=e;for(var j=0;j<80;j++){if(j<16){w[j]=x[i+j];}else{w[j]=_r(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);}var t=_s(_s(_r(a,5),_f(j,b,c,d)),_s(_s(e,w[j]),_k(j)));e=d;d=c;c=_r(b,30);b=a;a=t;}a=_s(a,o);b=_s(b,p);c=_s(c,q);d=_s(d,r);e=_s(e,s);}return[a,b,c,d,e];}function _b(s){var b=[],m=(1<<_z)-1;for(var i=0;i<s.length*_z;i+=_z){b[i>>5]|=(s.charCodeAt(i/8)&m)<<(32-_z-i%32);}return b;}function _h(k,d){var b=_b(k);if(b.length>16){b=_c(b,k.length*_z);}var p=[16],o=[16];for(var i=0;i<16;i++){p[i]=b[i]^0x36363636;o[i]=b[i]^0x5C5C5C5C;}var h=_c(p.concat(_b(d)),512+d.length*_z);return _c(o.concat(h),512+160);}function _n(b){var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",s='';for(var i=0;i<b.length*4;i+=3){var r=(((b[i>>2]>>8*(3-i%4))&0xFF)<<16)|(((b[i+1>>2]>>8*(3-(i+1)%4))&0xFF)<<8)|((b[i+2>>2]>>8*(3-(i+2)%4))&0xFF);for(var j=0;j<4;j++){if(i*8+j*6>b.length*32){s+=_p;}else{s+=t.charAt((r>>6*(3-j))&0x3F);}}}return s;}function _x(k,d){return _n(_h(k,d));}return _x(k,d);
  },
  parseParameterString: function(paramString){
    var elements = paramString.split('&'),
        result={},
        element;
    for(var element = elements.shift(); element; element = elements.shift())
    {
        var keyToken = element.split('='),
            value = '';
        if (keyToken[1]) {
          value=decodeURIComponent(keyToken[1]);
        }
        if(result[keyToken[0]]) {
          if (!(result[keyToken[0]] instanceof Array))
          {
            result[keyToken[0]] = Array(result[keyToken[0]],value);
          }
          else
          {
            result[keyToken[0]].push(value);
          }
        }
        else
        {
          result[keyToken[0]]=value;
        }
    }
    return result;
  },
  getHeaderString: function() {
    var j,pName,pLength,result = 'OAuth ';
    if (typeof this._realm === 'string')
      result += 'realm="'+this.oauthEscape(this._realm)+'", ';

    for (pName in this._parameters)
    {
      if (!pName.match(/^oauth/)) {
        continue;
      }

      if ((this._parameters[pName]) instanceof Array)
      {
        pLength = this._parameters[pName].length;
        for (j=0;j<pLength;j++)
        {
          result += pName +'="'+this.oauthEscape(this._parameters[pName][j])+'", ';
        }
      }
      else
      {
        result += pName + '="'+this.oauthEscape(this._parameters[pName])+'", ';
      }
    }

    return result.replace(/,\s+$/, '');
  }
}