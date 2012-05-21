/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

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
restclient.oauth2 = {
  init: function() {
    $('#oauth2-authorize [name="templates"]').change(restclient.oauth2.applyTemplate);
    $('#window-oauth2 .btnClose').click(restclient.oauth2.closeDialog);
    $('#window-oauth2 .btnAuthorize').click(restclient.oauth2.authorize);
    $('#window-oauth2 .btnInsertAsHeader').click(restclient.oauth2.insertAsHeader);
  },
  closeDialog: function() {
    $('#window-oauth2').hide();
    restclient.oauth2.listener.param = false;
  },
  insertAsHeader: function() {
    var access_token    = $('#oauth2-tokens [name="access_token"]');
    
    $('#oauth2-tokens .error').removeClass('error');
    if(access_token.val() === '') {
      access_token.focus();
      access_token.parents('.control-group').addClass('error');
      return false;
    }
    
    var param = {};
    param.oauth2 = {};
    param.oauth2.authorize = restclient.oauth2.getAuthorize();
    param.oauth2.tokens = restclient.oauth2.getTokens();
    
    restclient.main.addHttpRequestHeader('Authorization', 'OAuth2 ' + access_token.val(), param);
    $('#window-oauth2').hide();
  },
  insertAsQueryString: function() {
    var access_token    = $('#oauth2-tokens [name="access_token"]');
    $('#oauth2-tokens .error').removeClass('error');
    if(access_token.val() === '') {
      access_token.focus();
      access_token.parents('.control-group').addClass('error');
      return false;
    }
    //TODO parse paramter and replace/add access_token parameter
    if($('#request-url').val().indexOf('?') > 0)
      $('#request-url').val($('#request-url').val() + '&access_token=' + access_token.val());
  },
  getAuthorize: function() {
    var response_type           = $('#oauth2-authorize [name="response_type"]'),
        client_id               = $('#oauth2-authorize [name="client_id"]'),
        client_secret           = $('#oauth2-authorize [name="client_secret"]'),
        authorization_endpoint  = $('#oauth2-authorize [name="authorization_endpoint"]'),
        token_endpoint          = $('#oauth2-authorize [name="token_endpoint"]'),
        token_method            = $('#oauth2-authorize [name="token_method"]'),
        redirection_endpoint    = $('#oauth2-authorize [name="redirection_endpoint"]'),
        scope                   = $('#oauth2-authorize [name="scope"]'),
        state                   = $('#oauth2-authorize [name="state"]'),
        templateName            = $('#oauth2-authorize [name="templates"]').val();
        
    return {
          "response_type" : response_type.val(),
          "client_id" : client_id.val(),
          "client_secret" : client_secret.val(),
          "authorization_endpoint" : authorization_endpoint.val(),
          "token_endpoint" : token_endpoint.val(),
          "token_method" : token_method.val(),
          "redirection_endpoint" : redirection_endpoint.val(),
          "scope" : scope.val(),
          "state" : state.val()
        };
  },
  setAuthorize: function(param) {
    var response_type           = $('#oauth2-authorize [name="response_type"]'),
        client_id               = $('#oauth2-authorize [name="client_id"]'),
        client_secret           = $('#oauth2-authorize [name="client_secret"]'),
        authorization_endpoint  = $('#oauth2-authorize [name="authorization_endpoint"]'),
        token_endpoint          = $('#oauth2-authorize [name="token_endpoint"]'),
        token_method            = $('#oauth2-authorize [name="token_method"]'),
        redirection_endpoint    = $('#oauth2-authorize [name="redirection_endpoint"]'),
        scope                   = $('#oauth2-authorize [name="scope"]'),
        state                   = $('#oauth2-authorize [name="state"]'),
        templateName            = $('#oauth2-authorize [name="templates"]').val();
        
    response_type.find('[value="' + param.response_type + '"]').attr('selected', true);
    client_id.val(param.client_id);
    client_secret.val(param.client_secret);
    authorization_endpoint.val(param.authorization_endpoint);
    token_endpoint.val(param.token_endpoint);
    token_method.find('[value="' + param.token_method + '"]').attr('selected', true);
    redirection_endpoint.val(param.redirection_endpoint);
    scope.val(param.scope);
    state.val(param.state);
  },
  getTokens: function() {
    var access_token    = $('#oauth2-tokens [name="access_token"]'),
        expires_in      = $('#oauth2-tokens [name="expires_in"]'),
        refresh_token   = $('#oauth2-tokens [name="refresh_token"]'),
        btnRefresh      = $('#oauth2-tokens .btnRefresh');
    return {
      'access_token': access_token.val(),
      'expires_in': expires_in.data('expires_in'),
      'created_time': expires_in.data('created_time'),
      'refresh_token': refresh_token.val()
    };
  },
  setTokens: function(tokens) {
    var access_token    = $('#oauth2-tokens [name="access_token"]'),
        expires_in      = $('#oauth2-tokens [name="expires_in"]'),
        refresh_token   = $('#oauth2-tokens [name="refresh_token"]'),
        btnRefresh      = $('#oauth2-tokens .btnRefresh');
    if(typeof tokens.refresh_token === 'string' && tokens.refresh_token !== '') {
      btnRefresh.removeAttr('disabled').removeClass('disabled');
      refresh_token.val(tokens.refresh_token)
    }
    else {
      btnRefresh.attr('disabled', true).addClass('disabled');
      refresh_token.val('');
    }
    
    if(typeof tokens.expires_in === 'string') 
      tokens.expires_in = parseInt(tokens.expires_in);
    
    if(typeof tokens.expires_in === 'number') {
      var expire_time = tokens.created_time + tokens.expires_in * 1000;
      expires_in.val(new Date(expire_time).toISOString());
      expires_in.data('created_time', tokens.created_time);
      expires_in.data('expires_in', tokens.expires_in);
    }
    else
    {
      expires_in.val('');
      expires_in.removeData('created_time expires_in');
    }
    
    if(typeof tokens.access_token === 'string') {
      access_token.val(tokens.access_token);
    }
    else
    {
      access_token.val('');
    }
  },
  applyTemplate: function() {
    var templateName = $('#oauth2-authorize [name="templates"]').val(),
        temp = restclient.oauth2.templates.getTemplate(templateName);
    if (temp === false)
    {
      temp = {
        "response_type": "code",
        "token_method": "POST",
        "client_id": "",
        "client_secret": "",
        "authorization_endpoint": "",
        "token_endpoint": "",
        "redirection_endpoint": "",
        "scope": "",
        "state": ""
      };
    }
    restclient.oauth2.setAuthorize(temp);
  },
  authorize: function() {
    var response_type           = $('#oauth2-authorize [name="response_type"]'),
        client_id               = $('#oauth2-authorize [name="client_id"]'),
        client_secret           = $('#oauth2-authorize [name="client_secret"]'),
        authorization_endpoint  = $('#oauth2-authorize [name="authorization_endpoint"]'),
        token_endpoint          = $('#oauth2-authorize [name="token_endpoint"]'),
        token_method            = $('#oauth2-authorize [name="token_method"]'),
        redirection_endpoint    = $('#oauth2-authorize [name="redirection_endpoint"]'),
        scope                   = $('#oauth2-authorize [name="scope"]'),
        state                   = $('#oauth2-authorize [name="state"]'),
        templateName            = $('#oauth2-authorize [name="templates"]'),
        errors = [];
    
    if(client_id.val() === '')
      errors.push(client_id);
    if(client_secret.val() === '')
      errors.push(client_secret);
    if(authorization_endpoint.val() === '' || !restclient.helper.validateUrl(authorization_endpoint.val()))
      errors.push(authorization_endpoint);
    if(token_endpoint.val() === '' || !restclient.helper.validateUrl(token_endpoint.val()))
      errors.push(token_endpoint);
    if(redirection_endpoint.val() === '' || !restclient.helper.validateUrl(redirection_endpoint.val()))
      errors.push(redirection_endpoint);
    
    $('#oauth2-authorize .error').removeClass('error');
    
    for (var i=0, error; error = errors[i]; i++) {
      if (i === 0)
        error.focus();
      
      error.parents('.control-group').addClass('error');
    }
    
    if (errors.length > 0) {
      return false;
    }
    
    var param = {
      "response_type" : response_type.val(),
      "client_id" : client_id.val(),
      "client_secret" : client_secret.val(),
      "authorization_endpoint" : authorization_endpoint.val(),
      "token_endpoint" : token_endpoint.val(),
      "token_method" : token_method.val(),
      "redirection_endpoint" : redirection_endpoint.val(),
      "scope" : scope.val(),
      "state" : state.val()
    };
    
    var ignoreWarn = restclient.getPref('OAuth2.authorize.ignoreWarning', "no");
    if( ignoreWarn === 'no')
      var message = restclient.message.show({
        id: 'alert-oauth2-authorize',
        type: 'message',
        title: 'Start to do OAuth2 authorize',
        message: 'This action will open a new window for OAuth authorization, please finish the authorzation on the new window and then come back.',
        buttons: [
          [
            {title: 'Yes, please', class: 'btn-danger', callback: function () { restclient.oauth2.doAuthorize(param); $('#alert-oauth2-authorize').alert('close').remove(); }},
            {title: 'Yes, and please remember my descision', callback: function () { restclient.oauth2.doAuthorize(param); restclient.setPref('OAuth2.authorize.ignoreWarning', "yes");  $('#alert-oauth2-authorize').alert('close').remove();}}
          ],
          {title: 'Close', class: 'btn-danger', callback: function () { $('#alert-oauth2-authorize').alert('close').remove(); }}
        ],
        exclude: true,
        prepend: true,
        parent: $('#oauth2-authorize form')
      });
    else
      restclient.oauth2.doAuthorize(param);
  },
  doAuthorize: function(param) {
    if(!param) return false;
    var req = JSON.parse(JSON.stringify(param));
    
    delete req.authorization_endpoint;
    delete req.token_endpoint;
    delete req.token_method;
    delete req.client_secret;
    (req.scope === "") ? delete req.scope : null;
    (req.state === "") ? delete req.state : null;
    
    var url = param.authorization_endpoint + '?' + $.param(req);
    
    restclient.oauth2.listener.param = param;
    // Observer the url change
    var observerService = Components.classes["@mozilla.org/observer-service;1"]  
                                    .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(restclient.oauth2.listener, "http-on-examine-response", false);                                
    restclient.oauth2.window = window.open(url, 'restclient oauth2');
  },
  getAccessToken: function(redirection_url){
    var param = restclient.oauth2.listener.param;
    
    restclient.oauth2.listener.param = false;
    var observerService = Components.classes["@mozilla.org/observer-service;1"]  
                                    .getService(Components.interfaces.nsIObserverService);
    observerService.removeObserver(restclient.oauth2.listener, "http-on-examine-response");
    console.log(redirection_url);
    if(typeof restclient.oauth2.window !== 'undefined')
      try{
        restclient.oauth2.window.close();
      }catch(e){}
    var code = redirection_url.match(/[&\?]code=([^&]+)/)[1];
    console.log(code);
    if(typeof code !== 'string') {
      alert('cannot get code from url:' + redirection_url);
      return false;
    }
    
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function(event) {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          var accessToken = {}, response = xhr.responseText;
          accessToken.created_time = new Date().valueOf();
          try{
            parsedResponse = JSON.parse(response);
            if(typeof parsedResponse.access_token === 'string')
              accessToken.access_token = parsedResponse.access_token;
            if(typeof parsedResponse.refresh_token === 'string')
              accessToken.refresh_token = parsedResponse.refresh_token;
            if(typeof parsedResponse.expires_in !== 'undefined')
              accessToken.expires_in = parsedResponse.expires_in;
          }catch(e){
            accessToken.access_token = response.match(/access_token=([^&]*)/) ? response.match(/access_token=([^&]*)/)[1] : false;
            accessToken.refresh_token = response.match(/refresh_token=([^&]*)/) ? response.match(/refresh_token=([^&]*)/)[1] : false;
            accessToken.expires_in = response.match(/expires_in=([^&]*)/) ? response.match(/expires_in=([^&]*)/)[1] : false;
          }
          console.log(xhr.responseText);
          console.log(accessToken);
          restclient.oauth2.setTokens(accessToken);
          $('#window-oauth2 .nav-tabs li a').eq(1).click();
          return;
        }
      }
    });

    if (param.token_method == 'POST') {
      var formData = new FormData();
      formData.append('code', code);
      formData.append('client_id', param.client_id);
      formData.append('client_secret', param.client_secret);
      formData.append('redirect_uri', param.redirection_endpoint);
      formData.append('grant_type', 'authorization_code');
      xhr.open(param.token_method, param.token_endpoint, true);
      xhr.send(formData);
    } else if (param.token_method == 'GET') {
      var req = {
        'code': code,
        'client_id': param.client_id,
        'client_secret': param.client_secret,
        'redirect_uri': param.redirection_endpoint,
        'grant_type': 'authorization_code'
      };
      var url = param.token_endpoint + '?' + $.param(req);
      xhr.open(param.token_method, url, true);
      xhr.send();
    } else {
      throw param.token_method + ' is an unknown method';
    }
  }
}

restclient.oauth2.listener = {
  observe : function(aSubject, aTopic, aData) { 
    if(typeof restclient.oauth2.listener.param !== 'object' || typeof restclient.oauth2.listener.param.redirection_endpoint !== 'string')
      return false;
    var httpChannel = aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);  
    if (aTopic == "http-on-examine-response") {  
      if(typeof httpChannel.URI.spec === 'string'
        && httpChannel.URI.spec.indexOf(restclient.oauth2.listener.param.redirection_endpoint) === 0)
        restclient.oauth2.getAccessToken( httpChannel.URI.spec );
    }  
  },
  QueryInterface : function(aIID) {  
    if (aIID.equals(Components.interfaces.nsISupports) ||  
        aIID.equals(Components.interfaces.nsIObserver))  
      return this;  
    throw Components.results.NS_NOINTERFACE;  
  }
}
window.addEventListener("load", function () { restclient.oauth2.init();  }, false);