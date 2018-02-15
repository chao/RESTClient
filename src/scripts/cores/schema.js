/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2017, Chao ZHOU (chao@zhou.fr). All rights reserved.
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
var Schema = {
  update: function(request) {
    
  },
  _version: function(request) {
    // console.log(`[schema.js][_version] parameter:`, request);
    if (typeof request['requestUrl'] == 'string'
      && typeof request['requestMethod'] == 'string'
      && typeof request['requestBody'] == 'string') 
    {
      return "v1001";
    }
    if (request.version && request.version == 1 && request.data)
    {
      return 'v3' + ('' + request.version).padStart(3, "0");
    }
    if(typeof request == 'object' && !request.version)
    {
      for(let key in request)
      {
        if (typeof request[key]['method'] != 'undefined' 
            && typeof request[key]['url'] != 'undefined' 
            && typeof request[key]['body'] != 'undefined' )
        {
          return "v2001";
        }
      }
    }
    return "unkown";
  },
  _v1001: function(data, tags) {
    var request = {
      "method": data.requestMethod,
      "url": data.requestUrl,
      "body": data.requestBody,
      "tags": Array.isArray(tags) ? tags : [],
      "created_at": new Date(),
      "updated_at": new Date(),
    };

    if (Array.isArray(data.headers)) 
    {
      var headers = [];
      for (var i = 0; i < data.headers.length; i = i + 2) {
        headers.push({ "name": data.headers[i], "value": data.headers[i + 1] });
      }
      request.headers = headers;
    }
    return request;
  },
  _v2001: function(request, tags) {
    var tags = Array.isArray(tags) ? tags : [];
    request.tags = Array.isArray(request.tags) ? [...new Set([...request.tags, ...tags])] : tags;
    if (typeof request.overrideMimeType != 'undefined') {
      delete request.overrideMimeType;
    }
    // console.log(`[schema.js][_v2001]: processing request.`, request);
    if (request.headers) {
      if (request.headers.length > 0) {
        var headers = [];
        for(let i = 0; i < request.headers.length; i++)
        {
          var header  = request.headers[i];
          var name = value = '';
          if (Array.isArray(header))
          {
            name = header[0];
            value = header[1];
          }
          else
          {
            name = header['name'];
            value = header['value'];
          }
          // basic authentication
          if(name.toLowerCase() == 'authorization' && value.toLowerCase().indexOf('basic ') == 0)
          {
            var credentials = header[1].substr(6);
            // console.log(`[schema.js][_v2001]: credentials.`, credentials);
            credentials = Base64.decode(credentials);
            // console.log(`[schema.js][_v2001]: credentials.`, credentials);
            var username = credentials.substr(0, credentials.indexOf(':'));
            var password = credentials.substr(credentials.indexOf(':') + 1);
            request.authentication = {
              'mode': 'basic',
              'data': {
                'username': username,
                'password': password
              }
            };
            continue;
            // console.log(`[schema.js][_v2001]: authentication.`, request);
          }

          // oauth authentication
          if (request.oauth && name.toLowerCase() == 'authorization' && value.toLowerCase().indexOf('oauth ') == 0)
          {
            continue;
          }

          // oauth2 authentication
          if (request.oauth2 && name.toLowerCase() == 'authorization' && value.toLowerCase().indexOf('oauth2 ') == 0) {
            continue;
          }

          headers.push({ "name": name, "value": value });
        }
        request.headers = headers;
      }
      else {
        delete request.headers;
      }
    }

    // if the request uses OAuth 1.0 authentication
    if(request.oauth)
    {
      var authentication = {'mode': 'oauth10'};
      var secrets = request.oauth.oauth_secrets;
      secrets = JSON.parse(secrets);
      var data = {};
      data['consumer_key'] = secrets.consumer_key;
      data['shared_secret'] = secrets.consumer_secret;
      data['access_token'] = secrets.access_token;
      data['access_secret'] = secrets.access_secret;
      var params = request.oauth.oauth_parameters;
      params = JSON.parse(params);
      data['oauth_version'] = params.oauth_version;
      data['oauth_signature_method'] = params.params;
      data['oauth_nonce'] = true;
      data['oauth_timestamp'] = true;
      data['parameter_transmission'] = "header";
      data['auto_refresh'] = request.oauth.auto_refresh == 'no' ? false : true;
      authentication.data = data;
      request.authentication = authentication;
      delete request.oauth;
      // TODO remove authorization header
    }

    // if the request uses OAuth 2.0 authentication
    if (request.oauth2) {
      var authentication = { 'mode': 'oauth20' };
      var authorize = request.oauth2.authorize;
      var data = {};
      data['client_id'] = authorize.client_id;
      data['client_secret'] = authorize.client_secret;
      data['grant_type'] = authorize.response_type == 'code' ? 'authorization_code' : 'client_credentials';
      data['request_method'] = authorize.token_method ? authorize.token_method.toLowerCase() : 'post';
      data['authorization_endpoint'] = authorize.authorization_endpoint;
      data['redirect_endpoint'] = authorize.redirection_endpoint;
      data['token_endpoint'] = authorize.token_endpoint;
      data['scope'] = authorize.scope;
      data['state'] = authorize.state == '' ? true : '';
      if (request.oauth2.tokens)
      {
        var tokens = request.oauth2.tokens;
        data.result = {};
        data.result['access_token'] = tokens.access_token;
        data.result['refresh_token'] = tokens.refresh_token;
        data.result['expires_in'] = 3600;
        data.result['timestamp'] = 1515554247;
        data.result['token_type'] = 'Bearer';
      }
      authentication.data = data;
      request.authentication = authentication;
      delete request.oauth2;
    }
    request.created_at = new Date();
    request.updated_at = new Date();
    return request;
  },
  _v3001: function(request, tags)
  {
    return this._v2001(request, tags);
  }
}


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Schema;
}
else {
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return Schema;
    });
  }
  else {
    window.Schema = Schema;
  }
}
