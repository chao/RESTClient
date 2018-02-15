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

  // When toggle oauth timestamp auto mode
  $(document).on('click', '#oauth-timestamp-auto', function () {
    $(this).parents('.form-group').removeClass('has-danger');
    var checked = $(this).is(':checked');
    if(checked)
    {
      $('#oauth-timestamp').val('').attr('readonly', 'true');
      $('#oauth-timestamp-help').text('').hide();
    }
    else
    {
      var ts = Misc.timestamp();
      $('#oauth-timestamp').val(ts).removeAttr('readonly');
      $('#oauth-timestamp-help').text(Misc.getDateFromTimestamp(ts)).show();
    }
    console.log('clicked', );
  });


  // When user input a new timestamp, it should show it's date value
  $(document).on('input', '#oauth-timestamp', function () {
    var ts = Number.parseInt($(this).val());
    console.log(typeof ts );
    if( _.isNaN(ts) )
    {
      $(this).parents('.form-group').addClass('has-danger');
      $('#oauth-timestamp-help').text(
          browser.i18n.getMessage("jsOAuthInValidTimestamp")
      ).show();
      return false;
    }
    $(this).parents('.form-group').removeClass('has-danger');
    $('#oauth-timestamp-help').text(Misc.getDateFromTimestamp(ts)).show();
  });
  
  // When toggle oauth nonce auto mode
  $(document).on('click', '#oauth-nonce-auto', function () {
    var checked = $(this).is(':checked');
    if (checked) {
      $('#oauth-nonce').val('').attr('readonly', 'true');
    }
    else {
      $('#oauth-nonce').val(Misc.random(16)).removeAttr('readonly');
    }
  });

  // When toggle realm disable mode
  $(document).on('click', '#oauth-realm-disabled', function () {
    var checked = $(this).is(':checked');
    if (checked) {
      $('#oauth-realm-auto').prop("checked", true).attr('disabled', 'disabled');
      $('#oauth-realm').val('').attr('readonly', 'true');
    }
    else {
      $('#oauth-realm-auto').removeAttr('disabled');
    }
  });

  // When toggle realm auto mode
  $(document).on('click', '#oauth-realm-auto', function () {
    var checked = $(this).is(':checked');
    if (checked) {
      $('#oauth-realm').attr('readonly', 'true').val('');
    }
    else {
      $('#oauth-realm').removeAttr('readonly');
    }
  });

  $(document).on('submit', '#form-oauth', function(e){
    e.preventDefault();
    $('#modal-oauth .has-danger').removeClass('has-danger');

    var params = {
      'consumer_key': $('#oauth-consumer-key').val(),
      'shared_secret': $('#oauth-shared-secret').val(),
      'access_token': $('#oauth-access-token').val(),
      'access_secret': $('#oauth-access-token-secret').val(),
      'parameter_transmission': $('[name="oauth-parameter-transmission"]:checked').val(),
      'oauth_version': '1.0',
      'oauth_signature_method': $('[name="oauth-signature-method"]:checked').val(),
      'oauth_nonce': $('#oauth-nonce-auto').is(':checked') ? true : $('#oauth-nonce').val(),
      'oauth_timestamp': $('#oauth-timestamp-auto').is(':checked') ? true : $('#oauth-timestamp').val()
    };
    if (!$('#oauth-realm-disabled').is(':checked'))
    {
      params['oauth_realm'] = $('#oauth-realm-auto').is(':checked') ? true : $('#oauth-realm').val();
    }

    var error = false;
    if(params.consumer_key == '')
    {
      $('#oauth-consumer-key').parents('.form-group').addClass('has-danger');
      error = true;
    }
    if (params.shared_secret == '') {
      $('#oauth-shared-secret').parents('.form-group').addClass('has-danger');
      error = true;
    }

    if(error)
    {
      return false;
    }

    if ($('#save-oauth').is(':checked')) {
      storage.set({ ['oauth']: params }).then(() => {
        console.log('[oauth.js] storage saved!');
      });
    }
    console.log('[oauth.js] oauth-form submit', params);
    $('.authentication-mode').removeClass('active');
    $('.authentication-mode[data-mode="oauth10"]')
        .addClass('active')
        .data('params', params);
    $('#modal-oauth').modal('hide');
  });

  $(document).on('show.bs.modal', '#modal-oauth', function (e) {
    $('#modal-oauth .has-danger').removeClass('has-danger');
    $('#form-oauth')[0].reset();
    $('#oauth-realm').prop('readonly', true);
    $('#oauth-nonce').prop('readonly', true);
    $('#oauth-timestamp').prop('readonly', true);
    $('#save-oauth').prop('checked', false);

    // update oauth 1.0 form
    var initOauthForm = function (oauth) 
    {
      $('#oauth-consumer-key').val(oauth.consumer_key);
      $('#oauth-shared-secret').val(oauth.shared_secret);
      $('#oauth-access-token').val(oauth.access_token);
      $('#oauth-access-token-secret').val(oauth.access_secret);
      $(`[name="oauth-parameter-transmission"][value="${oauth.parameter_transmission}"]`).prop('checked', true);
      $('#oauth-version').val(oauth.oauth_version);
      $(`[name="oauth-signature-method"][value="${oauth.oauth_signature_method}"]`).prop('checked', true);
      if (oauth.oauth_nonce === true) {
        $('#oauth-nonce-auto').prop('checked', true);
        $('#oauth-nonce').val('').prop('readonly', true);
      }
      else {
        $('#oauth-nonce-auto').prop('checked', false);
        $('#oauth-nonce').val(oauth.oauth_nonce).prop('readonly', false);
      }

      if (oauth.oauth_timestamp === true) {
        $('#oauth-timestamp-auto').prop('checked', true);
        $('#oauth-timestamp').val('').prop('readonly', true);
      }
      else {
        $('#oauth-timestamp-auto').prop('checked', false);
        $('#oauth-timestamp').val(oauth.oauth_timestamp).prop('readonly', false);
      }

      if (typeof oauth.oauth_realm == 'undefined') {
        $('#oauth-realm-disabled').prop('checked', true);
        $('#oauth-realm-auto').prop('checked', true);
        $('#oauth-realm').val('').prop('readonly', true);
      }
      else {
        $('#oauth-realm-disabled').prop('checked', false);
        if (oauth.oauth_realm === true) {
          $('#oauth-realm-auto').prop('checked', true);
          $('#oauth-realm').val('').prop('readonly', true);
        }
        else {
          $('#oauth-realm-auto').prop('checked', false);
          $('#oauth-realm').val(oauth.oauth_realm).prop('readonly', false);
        }
      }
    };

    // if it is called for updating oauth parameters
    if ($('#modal-oauth').data('params'))
    {
      var params = $('#modal-oauth').data('params');
      console.log('[oauth.js] update oauth parameters', params);
      $('#modal-oauth').removeData('params');
      initOauthForm(params);
    }
    else
    {
      // checked if there is saved parameters in storage
      storage.get('oauth').then((data) => {
        console.log('[oauth.js] storage loaded!', data);
        if (!data || !data.oauth) {
          return false;
        }

        initOauthForm(data.oauth);
        $('#save-oauth').prop('checked', true);
      });
    }
  });

  $(document).on('click', '.authentication-mode[data-mode="oauth10"] .btn-edit', function(e){
    var params = $(this).parents('.authentication-mode').data('params');
    console.log('[oauth.js] edit oauth parameters', params);
    $('#modal-oauth').data('params', params).modal('show');
  });

  $(document).on('click', '.authentication-mode[data-mode="oauth10"] .btn-preview', function (e) {
    var params = $(this).parents('.authentication-mode').data('params');
    console.log('[oauth.js] preview oauth parameters', params);
    $('#modal-oauth-preview').data('params', params).modal('show');
  });

  $(document).on('show.bs.modal', '#modal-oauth-preview', function (e) {
    var validUrl = isWebUrl($('#request-url').val());
    if (typeof validUrl == 'undefined') {
      toastr.error(browser.i18n.getMessage("jsOAuthInvlidUrl"));
      return true;
    }
    $(document).trigger('update-oauth-preview');
  });

  $(document).on('click', '#modal-oauth-preview .btn-refresh', function (e) {
    var validUrl = isWebUrl($('#request-url').val());
    if (typeof validUrl == 'undefined') {
      toastr.error(browser.i18n.getMessage("jsOAuthInvlidUrl"));
      return true;
    }
    $(document).trigger('update-oauth-preview');
    var params = $('.authentication-mode[data-mode="oauth10"]').data('params');
    $('#modal-oauth-preview .btn-refresh').addClass('animated tada');
    setTimeout(() => {
      $('#modal-oauth-preview .btn-refresh').removeClass('animated tada');
    }, 600);

    if (_.isString(params.oauth_nonce) && params.oauth_nonce != ''
          && _.isString(params.oauth_timestamp) && params.oauth_timestamp != '') {
      toastr.success(browser.i18n.getMessage("jsOAuthRefreshed"));
    }
  });
  
  $(document).on('click', '.authentication-mode[data-mode="oauth10"] .btn-refresh', function (e) {
    var validUrl = isWebUrl($('#request-url').val());
    if (typeof validUrl == 'undefined') {
      toastr.error(browser.i18n.getMessage("jsOAuthInvlidUrl"));
      return true;
    }
    $(document).trigger('update-oauth-preview');
    toastr.success(browser.i18n.getMessage("jsOAuthRefreshed"));
  });

  $(document).on('update-oauth-preview', function(){
    if ($('.authentication-mode.active').data('mode') != 'oauth10')
    {
      console.error('[oauth.js] update-oauth-preview error', $('.authentication-mode.active').data('mode'));
      return false;
    }

    var request = Request.get();
    result = oauthSign(request);
    console.log('[oauth.js] OAuth result', result);
    
    $('#modal-oauth-preview tbody').empty();
    if(result.parameters)
    {
      var template = $('<tr><td></td><td class="name"></td><td><code></code></td>');
      var i = 1;
      _.each(result.parameters, function(value, key){
        if(key.indexOf('oauth_') !== 0)
        {
          return;
        }
        tr = template.clone();
        tr.find('td:first-child').text(i);
        tr.find('td.name').text(key);
        var code = '';
        if(_.isString(value))
        {
          code = value.replace(/(.{45})/g, "$1<br>");
        }
        if (_.isNumber(value)) {
          code = value;
        }
        tr.find('code').html(code);
        $('#modal-oauth-preview tbody').append(tr);
        i++;
      });
    }
    
    $('#modal-oauth-preview .oauth-preview-header code.name').text(result.header);
    $('#modal-oauth-preview .oauth-preview-url code').text(result.signed_url);
  });

});

function oauthSign(request)
{
  var method = request.method;
  var url = request.url;
  var params = request.authentication.data;

  window.oauth = new OAuthSimple(params.consumer_key, params.shared_secret);
  oauth.reset();
  url = (url.indexOf('#') >= 0) ? url.split('#')[0] : url;
  // if there is a hashtag in the url remove the hash tag part
  if (url.indexOf('?') >= 0) {
    var path = url.split('?')[0];
    oauth.setURL(path);
    oauth.setParameters(url.split('?')[1]);
  }
  else {
    oauth.setURL(url);
  }

  oauth.setAction(method);
  
  var oauthParameters = { 'oauth_signature_method': params.oauth_signature_method};
  if (_.isString(params.oauth_nonce) && params.oauth_nonce != '') {
    oauthParameters['oauth_nonce'] = params.oauth_nonce;
  }

  if (_.isString(params.oauth_timestamp) && params.oauth_timestamp != '') {
    oauthParameters['oauth_timestamp'] = params.oauth_timestamp;
  }

  if (typeof params.oauth_realm !== 'undefined')
  {
    oauth.setRealm(params.oauth_realm);
  }
  console.log('[oauth.js] set oauth parameters', params, oauth, oauthParameters);
  if (params.access_token && params.access_token != '') {
    var token = { 'access_token': params.access_token, "oauth_token_secret": params.access_secret };
    oauth.setTokensAndSecrets(token);
    console.log('[oauth.js] set token', token);
  }
  oauth.setParameters(oauthParameters);

  console.log('[oauth.js] oauth', oauth);
  var result = oauth.sign();
  return result;
}