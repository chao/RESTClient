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
  sign: function(arg) {
    console.log(arg);
    if(arg.action)
      this.setAction(arg.action);
    if(arg.signatures)
      this.setSignatures(arg.signatures);
    if(arg.parameters)
      this.setParameters(arg.parameters);
    if(arg.path)
      this.setPath(arg.path);
      
    var normParams = this.normalizeToString();
    console.log(normParams);
    this._parameters['oauth_signature'] = this.generateSignature(normParams);
    console.log(this._parameters['oauth_signature']);
    
    return {
        parameters: this._parameters,
        signature: this.oauthEscape(this._parameters['oauth_signature']),
        signed_url: this._path + '?' + this.normalizeToString()
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
    //oauth_token_key
    //oauth_token_secret
    //access_token_key
    //access_token_secret
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
    var consumer_key    = this._secrets['consumer_key'],
        consumer_secret = this._secrets['consumer_secret'],
        encrypt = this._parameters['oauth_signature_method'] || 'PLAINTEXT';
        
    var secretKey = restclient.oauth.oauthEscape(consumer_key) + '&' + 
        restclient.oauth.oauthEscape(consumer_secret);
    if (encrypt == 'PLAINTEXT')
    {
      return secretKey;
    }
    if (encrypt == 'HMAC-SHA1')
    {
      var toSign = restclient.oauth.oauthEscape(this._action)
                        + '&' + restclient.oauth.oauthEscape(this._path)
                        + '&' + restclient.oauth.oauthEscape(str);
      console.log(toSign)
      return b64_hmac_sha1(secretKey, toSign);
    }
    return null;
  },
  normalizeToString: function(parameters) {
    parameters = parameters || this._parameters;
    console.log(parameters);
    var names = [], result = [];
    for(var n in parameters) {
      if(!parameters.hasOwnProperty(n))
        continue;
      
      names.push(n);
    }
    names = names.sort();
    
    for(var i=0, n; n = names[i]; i++) {
      //console.log(n);
      if(n.match(/\w+_secret/))
        continue;
      console.log(n);
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
  sha1: function(data, base64) {
    var ch = Components.classes["@mozilla.org/security/hash;1"]
                       .createInstance(Components.interfaces.nsICryptoHash);
    ch.init(ch.SHA1);
    ch.update(data, data.length);
    if(base64)
      return ch.finish(true);
    var hash = ch.finish(false);

    // return the two-digit hexadecimal code for a byte
    function toHexString(charCode)
    {
      return ("0" + charCode.toString(16)).slice(-2);
    }

    // convert the binary hash data to a hex string.
    var s = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");

    return s;
  }
}