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

    /******************** Basic Authentication ****************/
    $('#modal-basic-auth').on('shown.bs.modal', function () {
        // $('#modal-basic-auth').find('.is-invalid').removeClass('is-invalid');
        // $('#modal-basic-auth').find('.invalid-feedback').removeClass('invalid-feedback');
        $('#modal-basic-auth').find('.has-danger').removeClass('has-danger');
        $('#basic-auth-name').select().focus();
    });
    
    $('.form-basic-auth').on('submit', function (e) {
        console.log('[RESTClient][basic.js] submit');
        e.preventDefault();
        e.stopPropagation();
        $('#modal-basic-auth .has-error').removeClass('has-error');

        var username = $('#basic-auth-name').val();
        var password = $('#basic-auth-password').val();
        if (username == '') {
            $('#basic-auth-name').parents('.form-group').addClass('has-danger').focus();
            return false;
        }
        console.log('[RESTClient][basic.js] Basic Authentication', username, password);
        $(document).trigger('append-basic-auth', [username, password]);
    });

    $(document).on('click', '.authentication-mode .btn-basic', function () {
        var params = $('.authentication-mode[data-mode="basic"]').data('params');
        $('#basic-auth-name').val(params['username']);
        $('#basic-auth-password').val(params['password']);
        $('#modal-basic-auth').modal('show');
    });

    $(document).on('append-basic-auth', function(e, username, password){
        $('.authentication-mode:not([data-mode="basic"])').removeClass('active');

        if ($('.authentication-mode[data-mode="basic"]').hasClass('active')) {
            $('.authentication-mode[data-mode="basic"]').addClass('flash');
            setTimeout(() => {
                $('.authentication-mode[data-mode="basic"]').removeClass('flash');
            }, 800);
        }

        $('.authentication-mode[data-mode="basic"]')
            .addClass('active')
            .data('params', { 'username': username, 'password': password });
        $('#modal-basic-auth').modal('hide');
    });
});

function basicAuthentication(request)
{
    console.log('[RESTClient][basic.js] basicAuthentication', request);
    var params = request.authentication.data;
    var credentials = params.username + ':' + params.password;
    console.log('[RESTClient][basic.js] basicAuthentication', credentials);
    var value = 'Basic ' + Base64.encode(credentials);
    request.headers.push({'name': 'Authorization', 'value': value});
    return request;
}