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
    restclient.oauth2.updateTemplateList();
    restclient.oauth2.updateTokenList();
    
    $('#oauth2-authorize [name="templates"]').change(restclient.oauth2.applyTemplate);
    $('#oauth2-tokens [name="saved_tokens"]').change(restclient.oauth2.applyToken);
    
    $('#window-oauth2 .btnClose').click(restclient.oauth2.closeDialog);
    $('#window-oauth2 .btnAuthorize').click(restclient.oauth2.authorize);
    $('#window-oauth2 .btnInsertAsHeader').click(restclient.oauth2.insertAsHeader);
    $('#window-oauth2 .btnInsertAsQueryString').click(restclient.oauth2.insertAsQueryString);
    
    $('#window-oauth2 .btnSaveTemplate').click(restclient.oauth2.saveTemplate);
    $('#window-oauth2 .btnRemoveTemplate').click(restclient.oauth2.removeTemplate);
    
    $('#window-oauth2 .btnSaveToken').click(restclient.oauth2.saveToken);
    $('#window-oauth2 .btnRemoveToken').click(restclient.oauth2.removeToken);
    $('#window-oauth2 .btnRefreshToken').click(restclient.oauth2.doRefreshToken);
  },
  updateTemplateList: function() {
    $('#oauth2-authorize [name="templates"]').empty();
    $('#oauth2-authorize [name="templates"]').append($('<option selected></option>'));
    var names = restclient.oauth2.templates.getTemplateNames();
    for(var i=0, n; n = names[i]; i++) {
      $('#oauth2-authorize [name="templates"]').append($('<option></option>').text(n).attr('value', n));
    }
  },
  updateTokenList: function() {
    $('#oauth2-tokens [name="saved_tokens"]').empty();
    $('#oauth2-tokens [name="saved_tokens"]').append($('<option selected></option>'));
    var names = restclient.oauth2.token.getNames();
    for(var i=0, name; name = names[i]; i++) {
      $('#oauth2-tokens [name="saved_tokens"]').append($('<option></option>').text(name).attr('value', name));
    }
  },
  showDialog: function() {
    var tokens = restclient.oauth2.getTokens(),
        btnRefresh      = $('#oauth2-tokens .btnRefreshToken');
    if (typeof tokens.refresh_token === 'string' && tokens.refresh_token !== '')
      btnRefresh.removeAttr('disabled').removeClass('disabled');
    else
      btnRefresh.attr('disabled', true).addClass('disabled');
    $('#modal-oauth2').modal('show');
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
    var url = $('#request-url').val();
    $('#request-url').val(restclient.helper.setParam(url, 'access_token', access_token.val()));
    $('#window-oauth2').hide();
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
        btnRefresh      = $('#oauth2-tokens .btnRefreshToken');
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
        btnRefresh      = $('#oauth2-tokens .btnRefreshToken');
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
  saveToken: function() {
    var names = restclient.oauth2.token.getNames(), 
        oauth_param = restclient.oauth2.getAuthorize(),
        oauth_token = restclient.oauth2.getTokens();
        
    $('#modal-oauth2-save').find('.title').text('Save current token');
    $('#modal-oauth2-save').find('label').text('Token name');
    $('#modal-oauth2-save [name="saved-name"]').attr('placeholder', 'Token name, e.g. Facebook access token').attr('data-source', JSON.stringify(names)).bind('change', function() {
      if($('#modal-oauth2-save .btnOkay').data('overwrite') === true)
      {
        $('#modal-oauth2-save .help-block').hide();
        $('#modal-oauth2-save .btnOkay').val('Save');
        $('#modal-oauth2-save .btnOkay').data('overwrite', false);
      }
    });
    $('#modal-oauth2-save .help-block').text('Name existed, you can either change a name or overwrite it.').hide();
    $('#modal-oauth2-save .error').removeClass('error');
    $('#modal-oauth2-save .btnOkay').text('Save').data('overwrite', false).unbind().bind('click', function() {
      var name = $('#modal-oauth2-save [name="saved-name"]').val();
      $('#modal-oauth2-save .error').removeClass('error');
      if(name === '') {
        $('#modal-oauth2-save [name="saved-name"]').parents('.control-group').addClass('error');
        return false;
      }
      if(names.indexOf(name) > -1 && $(this).data('overwrite') === false) {
        $('#modal-oauth2-save .help-block').show();
        $('#modal-oauth2-save .btnOkay').val('Overwrite');
        $(this).data('overwrite', true);
        return false;
      }
      restclient.oauth2.token.save(name, {'setting': oauth_param, 'tokens': oauth_token});
      restclient.oauth2.updateTokenList();
      $('#modal-oauth2-save').modal('hide');
    });
    $('#window-oauth2').hide();
    
    $('#modal-oauth2-save').modal('show').on('hidden', function(){ $('#window-oauth2').show(); });
  },
  removeToken: function() {
    var template = $('#oauth2-tokens [name="saved_tokens"]');
    if(template.val() === '') {
      template.parents('.control-group').addClass('error');
      template.next().show();
      return false;
    }
    restclient.oauth2.token.remove(template.val());
    restclient.oauth2.updateTokenList();
  },
  applyToken: function() {
    var token = $('#oauth2-tokens [name="saved_tokens"]'),
        tokenName = token.val(),
        tokens = restclient.oauth2.token.get(tokenName);
    
    token.next().hide();
    token.parents('.control-group').removeClass('error');
    if (tokens === false)
    {
      var setting = {
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
      var oauth_tokens = {
        'access_token': '',
        'expires_in': false,
        'refresh_token': ''
      };
      tokens = {};
      tokens.setting = setting;
      tokens.tokens = oauth_tokens;
    }
    restclient.oauth2.setAuthorize(tokens.setting);
    restclient.oauth2.setTokens(tokens.tokens);
  },
  saveTemplate: function() {
    var names = restclient.oauth2.templates.getTemplateNames(), 
        oauth_param = restclient.oauth2.getAuthorize();
        
    $('#modal-oauth2-save').find('.title').text('Save as template');
    $('#modal-oauth2-save').find('label').text('Template name');
    $('#modal-oauth2-save [name="saved-name"]').attr('placeholder', 'Template name, e.g. Facebook').attr('data-source', JSON.stringify(names)).bind('change', function() {
      if($('#modal-oauth2-save .btnOkay').data('overwrite') === true)
      {
        $('#modal-oauth2-save .help-block').hide();
        $('#modal-oauth2-save .btnOkay').val('Save');
        $('#modal-oauth2-save .btnOkay').data('overwrite', false);
      }
    });
    $('#modal-oauth2-save .help-block').text('Name existed, you can either change a name or overwrite it.').hide();
    $('#modal-oauth2-save .error').removeClass('error');
    $('#modal-oauth2-save .btnOkay').text('Save').data('overwrite', false).unbind().bind('click', function() {
      var name = $('#modal-oauth2-save [name="saved-name"]').val();
      $('#modal-oauth2-save .error').removeClass('error');
      if(name === '') {
        $('#modal-oauth2-save [name="saved-name"]').parents('.control-group').addClass('error');
        return false;
      }
      if(names.indexOf(name) > -1 && $(this).data('overwrite') === false) {
        $('#modal-oauth2-save .help-block').show();
        $('#modal-oauth2-save .btnOkay').val('Overwrite');
        $(this).data('overwrite', true);
        return false;
      }
      restclient.oauth2.templates.save(name, oauth_param);
      restclient.oauth2.updateTemplateList();
      $('#modal-oauth2-save').modal('hide');
    });
    $('#window-oauth2').hide();
    
    $('#modal-oauth2-save').modal('show').on('hidden', function(){ $('#window-oauth2').show(); });
  },
  removeTemplate: function() {
    var template = $('#oauth2-authorize [name="templates"]');
    if(template.val() === '') {
      template.parents('.control-group').addClass('error');
      template.next().show();
      return false;
    }
    restclient.oauth2.templates.remove(template.val());
    restclient.oauth2.updateTemplateList();
  },
  applyTemplate: function() {
    var template = $('#oauth2-authorize [name="templates"]'),
        templateName = template.val(),
        temp = restclient.oauth2.templates.getTemplate(templateName);
    
    template.next().hide();
    template.parents('.control-group').removeClass('error');
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
    req.redirect_uri = req.redirection_endpoint;
    delete req.redirection_endpoint;
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
    restclient.log(redirection_url);
    if(typeof restclient.oauth2.window !== 'undefined')
      try{
        restclient.oauth2.window.close();
      }catch(e){}
    var code = redirection_url.match(/[&\?]code=([^&]+)/)[1];
    restclient.log(code);
    if(typeof code !== 'string') {
      alert('cannot get code from url:' + redirection_url);
      return false;
    }
    
    var btnAuthorize = $('#window-oauth2 .btnAuthorize');
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function(event) {
      if (xhr.readyState == 4) {
        btnAuthorize.button('reset');
        if (xhr.status == 200) {
          var accessToken = {}, response = xhr.responseText;
          accessToken.created_time = new Date().valueOf();
          try{
            var parsedResponse = JSON.parse(response);
            restclient.log(parsedResponse);
            restclient.log(typeof parsedResponse.expires_in);
            if(typeof parsedResponse.access_token === 'string')
              accessToken.access_token = parsedResponse.access_token;
            if(typeof parsedResponse.refresh_token === 'string')
              accessToken.refresh_token = parsedResponse.refresh_token;
            if(typeof parsedResponse.expires_in !== 'undefined')
              accessToken.expires_in = parsedResponse.expires_in;
          }catch(e){
            console.error(e);
            accessToken.access_token = response.match(/access_token=([^&]*)/) ? response.match(/access_token=([^&]*)/)[1] : false;
            accessToken.refresh_token = response.match(/refresh_token=([^&]*)/) ? response.match(/refresh_token=([^&]*)/)[1] : false;
            accessToken.expires_in = response.match(/expires_in=([^&]*)/) ? response.match(/expires_in=([^&]*)/)[1] : false;
          }
          restclient.log(xhr.responseText);
          restclient.log(accessToken);
          restclient.oauth2.setTokens(accessToken);
          $('#window-oauth2 .nav-tabs li a').eq(1).click();
          return;
        }
      }
    });
    
    btnAuthorize.button('loading');
    if (param.token_method == 'POST') {
      /*var formData = new FormData();
      formData.append('code', code);
      formData.append('client_id', param.client_id);
      formData.append('client_secret', param.client_secret);
      formData.append('redirect_uri', param.redirection_endpoint);
      formData.append('grant_type', 'authorization_code');*/
      var req = {
        'code': code,
        'client_id': param.client_id,
        'client_secret': param.client_secret,
        'redirect_uri': param.redirection_endpoint,
        'grant_type': 'authorization_code'
      };
      
      xhr.open(param.token_method, param.token_endpoint, true);
      xhr.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded;charset=UTF-8');
      xhr.send($.param(req));
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
  },
  doRefreshToken: function() {
    var tokens = restclient.oauth2.getTokens(),
        authorize = restclient.oauth2.getAuthorize(),
        btnRefresh      = $('#oauth2-tokens .btnRefreshToken');
    
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function(event) {
      if (xhr.readyState == 4) {
        btnRefresh.button('reset');
        if (xhr.status == 200) {
          var response = xhr.responseText;
          tokens.created_time = new Date().valueOf();
          try{
            var parsedResponse = JSON.parse(response);
            restclient.log(parsedResponse);
            restclient.log(typeof parsedResponse.expires_in);
            if(typeof parsedResponse.access_token === 'string')
              tokens.access_token = parsedResponse.access_token;
            if(typeof parsedResponse.refresh_token === 'string')
              tokens.refresh_token = parsedResponse.refresh_token;
            if(typeof parsedResponse.expires_in !== 'undefined')
              tokens.expires_in = parsedResponse.expires_in;
          }catch(e){
            console.error(e);
            tokens.access_token = response.match(/access_token=([^&]*)/) ? response.match(/access_token=([^&]*)/)[1] : false;
            tokens.refresh_token = response.match(/refresh_token=([^&]*)/) ? response.match(/refresh_token=([^&]*)/)[1] : tokens.refresh_token;
            tokens.expires_in = response.match(/expires_in=([^&]*)/) ? response.match(/expires_in=([^&]*)/)[1] : false;
          }
          restclient.log(xhr.responseText);
          console.error(tokens);
          restclient.oauth2.setTokens(tokens);
          $('#window-oauth2 .nav-tabs li a').eq(1).click();
          return;
        }
      }
    });

    var req = {
      'client_id': authorize.client_id,
      'client_secret': authorize.client_secret,
      'refresh_token': tokens.refresh_token,
      'grant_type': 'refresh_token'
    };
    btnRefresh.button('loading');
    if (authorize.token_method == 'POST') {
      xhr.open(authorize.token_method, authorize.token_endpoint, true);
      xhr.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded;charset=UTF-8');
      xhr.send($.param(req));
    } else if (authorize.token_method == 'GET') {

      var url = authorize.token_endpoint + '?' + $.param(req);
      xhr.open(authorize.token_method, url, true);
      xhr.send();
    } else {
      throw authorize.token_method + ' is an unknown method';
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

restclient.oauth2.token = {
  get: function(name) {
    if(typeof name !== 'string' || name === '') return false;
    var tokens = restclient.getPref('oauth2.tokens', '');
    if(tokens === '')
      return false;
    tokens = JSON.parse(tokens);
    return (name in tokens) ? tokens[name] : false;
  },
  save: function(name, setting) {
    var tokens = restclient.getPref('oauth2.tokens', '');
    if(tokens === '')
      tokens = {};
    else
      tokens = JSON.parse(tokens);
      
    tokens[name] = setting;
    restclient.setPref('oauth2.tokens', JSON.stringify(tokens));
    return true;
  },
  remove: function(name) {
    if(typeof name !== 'string' || name === '') return false;
    var tokens = restclient.getPref('oauth2.tokens', '');
    if(tokens === '') return true;
    tokens = JSON.parse(tokens);
    if(name in tokens) {
      delete tokens[name];
      restclient.setPref('oauth2.tokens', JSON.stringify(tokens));
    }
  },
  getNames: function() {
    var tokens = restclient.getPref('oauth2.tokens', '');
    if(tokens === '')
      tokens = {};
    else
      tokens = JSON.parse(tokens);
    var result = [];
    for(var name in tokens)
      result.push(name);
    return result;
  }
}
window.addEventListener("load", function () { restclient.oauth2.init();  }, false);