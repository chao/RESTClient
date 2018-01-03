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
  
  $(document).on('oauth2-grant-type-changed', function(){
    var type = $('[name="oauth2-grant-type"]:checked').val();
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

  $(document).on('submit', '#form-oauth2', function (e) {
    e.preventDefault();
    $('#modal-oauth2 .has-error').removeClass('has-error');

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
    if (error) {
      return false;
    }

    if ($('#save-oauth2').is(':checked')) {
      storage.set({ ['oauth2']: params }).then(() => {
        console.log('[oauth2.js] storage saved!', params);
      });
    }
    console.log('[oauth2.js] oauth2-form submit', params);
    $('.authentication-mode').removeClass('active');
    $('.authentication-mode[data-mode="oauth20"]')
      .addClass('active')
      .data('params', params);
    $('#modal-oauth2').modal('hide');
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
  });
});