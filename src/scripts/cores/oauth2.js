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

$(function () {
  Ladda.bind('.btn-oauth2-request');
  Ladda.bind('.btn-oauth2-refresh');
  Ladda.bind('#modal-oauth2-refresh button[type="submit"]');
  $(document).on('oauth2-grant-type-changed', function(){
    var type = $('[name="oauth2-grant-type"]:checked').data('type');
    console.log('[oauth2.js] grant type changed', type);
    $('#form-oauth2 .form-group:not([data-' + type + '])').hide();
    $('#form-oauth2 .form-group[data-' + type + ']').show();
  });
  // When toggle oauth2 grant type
  $(document).on('input change click', '[name="oauth2-grant-type"]', function () {
    $(document).trigger('oauth2-grant-type-changed');
  });

  // When toggle oauth2 state auto mode
  $(document).on('click', '#oauth2-state-auto', function () {
    var checked = $(this).is(':checked');
    if (checked) {
      $('#oauth2-state').val('').attr('readonly', 'true');
    }
    else {
      $('#oauth2-state').val(Misc.random(16)).removeAttr('readonly');
    }
  });

  $(document).on('click', '.authentication-mode[data-mode="oauth20"] .btn-edit', function (e) {
    var params = $('.authentication-mode[data-mode="oauth20"]').data('params');
    $('#modal-oauth2').data('params', params).modal('show');
  });

  $(document).on('click', '.authentication-mode[data-mode="oauth20"] .btn-preview', function (e) {
    $('#modal-oauth2-preview').modal('show');
  });

  $(document).on('show.bs.modal', '#modal-oauth2-preview', function (e) {
    Ladda.stopAll();
    var params = $('.authentication-mode[data-mode="oauth20"]').data('params');
    if (!params.refresh_endpoint || (!params.refresh_token && !params.result.refresh_token))
    {
      $('#modal-oauth2-preview .btn-oauth2-refresh').prop('disabled', true);
    }
    else
    {
      $('#modal-oauth2-preview .btn-oauth2-refresh').prop('disabled', false);
    }
    if(!params.result)
    {
      params.result = {};
    }
    params.result.transmission_type = $('.authentication-mode[data-mode="oauth20"] .dropdown-item-checked').data('type');
    $('#modal-oauth2-preview tbody').empty();
    var template = '<tr><td>{{no}}</td><td class="name">{{name}}</td><td><code>{{value}}</code></td>';
    var no = 0;
    _.each(params.result, function (value, key) {
      if(key == 'timestamp')
      {
        if (params.result && params.result.timestamp && params.result.expires_in) {
          key = 'Expiration';
          value = new Date((params.result.timestamp + params.result.expires_in) * 1000);
        }
        else
        {
          value = false;
        }
      }
      console.log(`${no}, ${key}, ${value}`);
      if(value != false)
      {
        no++;
        key = _.startCase(key);
        $('#modal-oauth2-preview tbody').append(Mustache.to_html(template, { 'no': no, 'name': key, 'value': value }));
      }
    });
  });

  $(document).on('click', '.btn-oauth2-transmission', function(){
    if ($(this).hasClass('dropdown-item-checked'))
    {
      return false;
    }
    var params = $(this).parents('.authentication-mode').data('params');
    params.transmission = $(this).data('type');
    $(this).parents('.authentication-mode').data('params', params);
    $('.btn-oauth2-transmission').removeClass('dropdown-item-checked');
    $(this).addClass('dropdown-item-checked');
  });
  
  $(document).on('click', '.btn-oauth2-refresh', function () {
    var params = $('.authentication-mode[data-mode="oauth20"]').data('params');
    var btn = $(this);
    
    
    if (!params.refresh_endpoint || params.refresh_endpoint == '' || !_.isString(params.result.refresh_token))
    {
      $('#modal-oauth2-refresh').modal('show');
    }
    else
    {
      var l;
      if (btn.hasClass('ladda-button')) {
        l = Ladda.create(document.querySelector('.btn-oauth2-refresh'));
        l.start();
      }
      var req = {
        'refresh_token': params.result.refresh_token,
        'scope': params.scope,
        'client_id': params.client_id,
        'client_secret': params.client_secret,
        'grant_type': 'refresh_token'
      };

      $.ajax({
        url: params.refresh_endpoint,
        method: 'POST',
        contentType: 'application/x-www-form-urlencoded',
        data: req
      })
      .done(function (response) {
        var result = parseAccessToken(response);
        result.refresh_token = _.isString(result.refresh_token) ? result.refresh_token : req.refresh_token;
        params.result = result;
        console.log(`[oauth2.js] update params from menu`, params);
        $('.authentication-mode[data-mode="oauth20"]').data('params', params);
        toastr.success(browser.i18n.getMessage("jsOAuth2Refreshed"));
        if ($('#modal-oauth2-preview').is(':visible'))
        {
          $('#modal-oauth2-preview').trigger('show.bs.modal');
        }
      })
      .fail(function (xhr) {
        toastr.error(xhr.responseText);
      })
      .always(function(){
        Ladda.stopAll();
      })
    }
  });


  $(document).on('click', '.btn-oauth2-refresh-setting', function () {
    $('#modal-oauth2-refresh').modal('show');
  });

  $(document).on('submit', '#form-oauth2', function (e) {
    e.preventDefault();
    $('#modal-oauth2 .has-danger').removeClass('has-danger');

    var params = {
      'grant_type': $('[name="oauth2-grant-type"]:checked').val(),
      'client_id': $('#oauth2-client-id').val(),
      'client_secret': $('#oauth2-client-secret').val(),
      'scope': $('#oauth2-scope').val(),
      'state': $('#oauth2-state-auto').is(':checked') ? true : $('#oauth2-state').val(),
      'request_method': $('[name="oauth2-request-method"]:checked').val(),
      'authorization_endpoint': $('#oauth2-authorization-endpoint').val(),
      'token_endpoint': $('#oauth2-token-endpoint').val(),
      'redirect_endpoint': $('#oauth2-redirect-endpoint').val(),
    };

    var error = false;
    if (params.client_id == '') {
      $('#oauth2-client-id').parents('.form-group').addClass('has-danger');
      error = true;
    }
    if (params.client_secret == '') {
      $('#oauth2-client-secret').parents('.form-group').addClass('has-danger');
      error = true;
    }
    if ($('#oauth2-authorization-endpoint').is(':visible') && params.authorization_endpoint == '') {
      $('#oauth2-authorization-endpoint').parents('.form-group').addClass('has-danger');
      error = true;
    }
    if (params.token_endpoint == '') {
      $('#oauth2-token-endpoint').parents('.form-group').addClass('has-danger');
      error = true;
    }
    if (params.redirect_endpoint == '') {
      $('#oauth2-redirect-endpoint').parents('.form-group').addClass('has-danger');
      error = true;
    }
    if (error) {
      return false;
    }

    if(params.grant_type == 'client_credentials')
    {
      console.log('[oauth2.js] client credentials', params);
      $(document).trigger('obtain-access-token', [params, updateOauth2Modal]);
    }
    if (params.grant_type == 'authorization_code') {
      if ($('#save-oauth2').is(':checked')) {
        storage.set({ ['oauth2']: params }).then(() => {
          console.log('[oauth2.js] storage saved!', params);
        });
      }
      
      var url = params.authorization_endpoint;
      if(url.indexOf('?') === -1)
      {
        url += '?';
      }
      else
      {
        url += '&';
      }
      var querystrings = {
        "response_type": "code",
        "client_id": params.client_id
      };
      if (params.scope)
      {
        querystrings["scope"] = params.scope;
      }
      else
      {
        querystrings["scope"] = '';
      }
      if (params.state === true || params.state == '') 
      {
        params['result'] = params['result'] || {};
        params['result']['state'] = Misc.random(16);
        querystrings["state"] = params['result']['state'];
      }
      else
      {
        querystrings["state"] = params.scope;
      }
      if (params.redirect_endpoint) {
        querystrings["redirect_uri"] = params.redirect_endpoint;
      }
      url += $.param(querystrings);

      $('#modal-oauth2').data('params', params);

      if (browser.tabs.onUpdated.hasListener(handleTabUpdated))
      {
        console.log(`[oauth2.js] remove old listener`);
        browser.tabs.onUpdated.removeListener(handleTabUpdated);
      }
      browser.tabs.onUpdated.addListener(handleTabUpdated);
      
      // open a tab for authorization
      var oauth2Tab = browser.tabs.create({
        "url": url
      });
      console.log(`[oauth2.js] open a new tab`, oauth2Tab);
      oauth2Tab.then(function(tab){
        console.log(`[oauth2.js] Created new tab: ${tab.id}, redirect url: ${params.redirect_endpoint}`);
        window.oauth2TabId = tab.id;
        window.oauth2RedirectUrl = params.redirect_endpoint;
        toastr.success(browser.i18n.getMessage("jsOAuth2NewTabOpened"));
      }, function(){
        toastr.error(browser.i18n.getMessage("jsOAuth2NewTabCannotOpen"));
      });
    }
    return false;
  });

  // update oauth 2.0 form
  var initOauth2Form = function (oauth2) {
    $('#oauth2-client-id').val(oauth2.client_id);
    $('#oauth2-client-secret').val(oauth2.client_secret);
    $('#oauth2-scope').val(oauth2.scope);
    $('#oauth2-authorization-endpoint').val(oauth2.authorization_endpoint);
    $('#oauth2-token-endpoint').val(oauth2.token_endpoint);
    $('#oauth2-redirect-endpoint').val(oauth2.redirect_endpoint);
    $(`[name="oauth2-grant-type"][value="${oauth2.grant_type}"]`).prop('checked', true);
    $(`[name="oauth2-request-method"][value="${oauth2.request_method}"]`).prop('checked', true);
    if (oauth2.state === true) {
      $('#oauth2-state-auto').prop('checked', true);
      $('#oauth2-state').val('').prop('readonly', true);
    }
    else {
      $('#oauth-state-auto').prop('checked', false);
      $('#oauth2-state').val(oauth2.state).prop('readonly', false);
    }
  };

  // When OAuth2 modal is opened
  $(document).on('show.bs.modal', '#modal-oauth2', function(){
    $('#modal-oauth2 .has-danger').removeClass('has-danger');
    $('#form-oauth2')[0].reset();

    // if it is called for updating oauth parameters
    if ($('#modal-oauth2').data('params')) {
      var params = $('#modal-oauth2').data('params');
      console.log('[oauth2.js] update oauth parameters', params);
      $('#modal-oauth2').removeData('params');
      initOauth2Form(params);
      $(document).trigger('oauth2-grant-type-changed');
    }
    else {
      // checked if there is saved parameters in storage
      storage.get('oauth2').then((data) => {
        console.log('[oauth2.js] storage loaded!', data);
        if (!data || !data.oauth2) {
          return false;
        }

        initOauth2Form(data.oauth2);
        $('#save-oauth2').prop('checked', true);
        $(document).trigger('oauth2-grant-type-changed');
      });
    }
    Ladda.stopAll();
  });

  // Refresh token
  $(document).on('show.bs.modal', '#modal-oauth2-refresh', function () {
    $('#modal-oauth2-refresh .has-danger').removeClass('has-danger');
    $('#form-oauth2-refresh')[0].reset();
    var params = $('.authentication-mode[data-mode="oauth20"]').data('params');
    var refresh_token = '';
    if (params.result && params.result.refresh_token && params.result.refresh_token != '')
    {
      refresh_token = params.result.refresh_token;
    }
    if (params.refresh_token && params.refresh_token != '')
    {
      refresh_token = params.refresh_token;
    }
    var scope = '';
    if (params.result && params.result.scope && params.result.scope != '') {
      scope = params.result.scope;
    }
    if (params.scope && params.scope != '') {
      scope = params.scope;
    }
    $('#oauth2-refresh-token').val(refresh_token);
    $('#oauth2-refresh-endpoint').val(params.refresh_endpoint || '');
    $('#oauth2-refresh-scope').val(scope);
    Ladda.stopAll();
  });

  $(document).on('submit', '#form-oauth2-refresh', function (e) {
    console.log(`[oauth2.js] form-oauth2-refresh submit`);
    e.preventDefault();
    var params = $('.authentication-mode[data-mode="oauth20"]').data('params');
    $('#modal-oauth2-refresh .has-danger').removeClass('has-danger');
    var refresh_endpoint = $('#oauth2-refresh-endpoint').val();

    var req = {
      'refresh_token': $('#oauth2-refresh-token').val(),
      'scope': $('#oauth2-scope').val(),
      'client_id': params.client_id,
      'client_secret': params.client_secret,
      'grant_type': 'refresh_token'
    };

    var error = false;
    if (req.refresh_token == '') {
      $('#oauth2-refresh-token').parents('.form-group').addClass('has-danger');
      error = true;
    }
    if (refresh_endpoint == '') {
      $('#oauth2-refresh-endpoint').parents('.form-group').addClass('has-danger');
      error = true;
    }
    if (error) {
      Ladda.stopAll();
      return false;
    }
    
    $.ajax({
      url: refresh_endpoint,
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      data: req
    })
    .done(function (response) {
      var result = parseAccessToken(response);
      params.scope = req.scope;
      params.refresh_endpoint = refresh_endpoint;
      result.refresh_token = _.isString(result.refresh_token) ? result.refresh_token : req.refresh_token;
      params.result = result;
      console.log(`[oauth2.js] update params`, params);
      $('.authentication-mode[data-mode="oauth20"]').data('params', params);
      toastr.success(browser.i18n.getMessage("jsOAuth2Refreshed"));
      $('#modal-oauth2-refresh').modal('hide');
    })
    .fail(function (xhr) {
      toastr.error(xhr.responseText);
    })
    .always(function () {
      Ladda.stopAll();
    });
  });

  $(document).on('obtain-access-token', function(e, params, callback) {
    console.log(`[oauth2.js][obtain-access-token] parameters`, params, callback);
    var l = Ladda.create(document.querySelector('.btn-oauth2-request'));
    
    var url = params.token_endpoint
    if (url.indexOf('{{') >= 0 && url.indexOf('}}') >= 0) {
      url = Mustache.to_html(url, params);
    }

    if (!isWebUrl(url)) {
      toastr.error(browser.i18n.getMessage("jsOAuthInvlidUrl"));
      Ladda.stopAll();
      return true;
    }

    var ajaxOption = {
      url: url,
      method: params.request_method
    };
    if (params.request_method == 'get') {
      var data = {};
      if (url.indexOf('grant_type=') === -1) {
        data['grant_type'] = 'client_credentials';
      }
      if (url.indexOf('grant_type=') === -1 && params.scope && params.scope != '') {
        data['scope'] = params.scope;
      }
      ajaxOption['data'] = data;
    }
    if (params.request_method == 'post') {
      var data = {
        'grant_type': 'client_credentials'
      }
      if (params.client_id && params.client_id != '') {
        data['client_id'] = params.client_id;
      }
      if (params.client_secret && params.client_secret != '') {
        data['client_secret'] = params.client_secret;
      }
      if (params.scope && params.scope != '') {
        data['scope'] = params.scope;
      }
      ajaxOption['data'] = data;
      ajaxOption['contentType'] = 'Content-Type: application/x-www-form-urlencoded';
    }
    console.log(`[oauth2.js][obtain-access-token] ajaxOption`, ajaxOption);
    
    l.start();
    $.ajax(ajaxOption)
    .done(function (response) {
      params.result = parseAccessToken(response);

      if(typeof callback == 'function')
      {
        callback(params);
      }
      toastr.success(browser.i18n.getMessage("jsOAuth2TokenObtained"));
    })
    .fail(function (xhr) {
      toastr.error(xhr.responseText);
    })
    .always(function () {
      l.stop();
      l.remove();
    });
  });

  $(document).on('get-access-token', function(e, tabId, url) {
    var params = $('#modal-oauth2').data('params');
    console.log(`[oauth2.js] start to get access token`, tabId, url, params);
    if(typeof url == 'string' && url.indexOf(params.authorization_endpoint) >= 0)
    {
      return false;
    }

    var req = {
      'client_id': params.client_id,
      'client_secret': params.client_secret,
      'grant_type': 'authorization_code'
    };
    var matches = url.match(/[&\?]code=([^&]+)/);
    if(!Array.isArray(matches) || matches.length <= 1)
    {
      toastr.error(browser.i18n.getMessage("jsOAuth2CannotGetCode", url), { "timeOut": "5000", "extendedTimeOut": "25000" });
      Ladda.stopAll();
      try {
        browser.tabs.remove(
          window.oauth2TabId
        );
      }catch(e) {}
      return false;
    }
    
    req['code'] = matches[1];
    matches = url.match(/[&\?]state=([^&]+)/);
    var state = (Array.isArray(matches) && matches.length > 1) ? matches[1] : false;
    console.log(`[oauth2.js][get-access-token] Get state ${state}`);
    if (typeof state !== 'string') {
      if (typeof params.result.state == 'string') {
        state = params.result.state;
      }
      else {
        if (typeof params.state == 'string') {
          state = params.state;
        }
        else {
          state = false;
        }
      }
    }

    if (state !== false) {
      req['state'] = state;
    }

    if (params.redirect_endpoint) {
      req['redirect_uri'] = params.redirect_endpoint;
    }
    console.log(`[oauth2.js][get-access-token] ready to get access token`, req);
    var opts = {
      'url': params.token_endpoint,
      'params': req
    };

    if (params.request_method == 'post') {
      opts.method = 'POST';
      opts.headers = { "Content-Type": 'application/x-www-form-urlencoded;charset=UTF-8'};
    } else {
      opts.method = 'GET';
    }

    browser.tabs.sendMessage(
      tabId,
      { opts: opts }
    ).then(function (response){
      console.log(`[oauth2.js] get access token from tab`, response);
      var result = parseAccessToken(response);
      console.log(`[oauth2.js] access token`, result);
      params.result = result;
      updateOauth2Modal(params);
      toastr.success(browser.i18n.getMessage("jsOAuth2TokenObtained"));
      console.log(`[oauth2.js] close modal`);
      browser.tabs.remove(
        tabId
      );
    }).catch(function(error) {
      console.log(error);
      toastr.error(error, browser.i18n.getMessage("jsOAuth2CannotGetAccessToken"), { "timeOut": "10000"});
      Ladda.stopAll();
      console.error(`Error: ${error}`);
      browser.tabs.remove(
        tabId
      );
    });
  });
});

function parseAccessToken(response)
{
  var result = { timestamp: Date.now() / 1000 | 0 };
  try {
    var parsedResponse = _.isString(response) ? JSON.parse(response) : response;
    console.log(`[content.js] get result from server`, parsedResponse);
    if (typeof parsedResponse.access_token === 'string')
      result.access_token = parsedResponse.access_token;
    if (typeof parsedResponse.refresh_token === 'string')
      result.refresh_token = parsedResponse.refresh_token;
    if (typeof parsedResponse.expires_in !== 'undefined')
      result.expires_in = parsedResponse.expires_in;
    if (typeof parsedResponse.token_type !== 'undefined')
      result.token_type = parsedResponse.token_type;
  } catch (e) {
    console.error(`[oauth2.js] cannot parse json`, e);
    result.access_token = response.match(/access_token=([^&]*)/) ? response.match(/access_token=([^&]*)/)[1] : false;
    result.refresh_token = response.match(/refresh_token=([^&]*)/) ? response.match(/refresh_token=([^&]*)/)[1] : false;
    result.expires_in = response.match(/expires_in=([^&]*)/) ? response.match(/expires_in=([^&]*)/)[1] : false;
    result.token_type = response.match(/token_type=([^&]*)/) ? response.match(/token_type=([^&]*)/)[1] : false;
  }
  return result;
}
function updateOauth2Modal(params)
{
  if ($('#save-oauth2').is(':checked')) {
    storage.set({ ['oauth2']: params }).then(() => {
      console.log('[oauth2.js] storage saved!', params);
    });
  }
  $('.authentication-mode').removeClass('active');
  $('.authentication-mode[data-mode="oauth20"]')
    .addClass('active')
    .data('params', params);

  $('#modal-oauth2').modal('hide');
}

function handleTabUpdated(tabId, changeInfo, tabInfo) {
  if (typeof tabInfo == 'undefined')
  {
    return false;
  }
  console.log(`TabId: ${tabId}, Url: ${changeInfo.url}`);
  if (typeof changeInfo.url != 'undefined' && typeof oauth2TabId != 'undefined' && tabId == oauth2TabId
    && changeInfo.url.toLowerCase().indexOf(oauth2RedirectUrl.toLowerCase()) == 0) {
    console.log(`[oauth2.js] handleTabUpdated Url: ${changeInfo.url} opened!`);
    var makeItGreen = 'document.body.style.border = "5px solid green"';
    var executing = browser.tabs.executeScript(tabId, {
      file: "/scripts/pages/content.js"
    });
    executing.then(function onExecuted(result) {
      console.log(`[oauth2.js] content script is running at ${changeInfo.url}`);
      $(document).trigger('get-access-token', [tabId, changeInfo.url]);
    }, function onError(error) {
      console.log(`[oauth2.js] execute script error: ${error}`);
    });
  }
}

function oauth2Sign(request) {
  if (!request.authentication.data.transmission || request.authentication.data.transmission == 'header') {
    if (_.isString(request.authentication.data.result.token_type)) {
      value = _.upperFirst(request.authentication.data.result.token_type);
    }
    else {
      value = 'Bearer';
    }
    if (value == 'Mac') {
      throw "MAC Token for OAuth 2.0 is not supported yet.";
    }
    value += ' ' + request.authentication.data.result.access_token;
    request.headers.push({ 'name': 'Authorization', 'value': value });
  }
  else {
    request.url = Misc.insertParam(request.url, { 'access_token': request.authentication.data.result.access_token });
  }
  return request;
}