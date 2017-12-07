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
        e.preventDefault();
        e.stopPropagation();
        var username = $('#basic-auth-name').val();
        var password = $('#basic-auth-password').val();
        if (username == '') {
            // $('#basic-auth-name').addClass('is-invalid').next()
            //     .addClass('invalid-feedback');
            $('#basic-auth-name').parents('.form-group').addClass('has-danger').focus();
            return false;
        }
        console.log('[RESTClient][index.js] Basic Authentication', username, password);
        var credentials = username + ':' + password;
        console.log('[RESTClient][index.js] Basic Authentication', credentials);
        var value = 'Basic ' + window.btoa(unescape(encodeURIComponent(credentials)));
        var source = ($('.list-request-headers .basic-auth').length > 0) ?
            $('.list-request-headers .basic-auth') : false;
        var data = { 'username': username, 'password': password };
        $(document).trigger('append-request-header', ['Authorization', value, false, source, 'basic-auth', data]);
        $('#modal-basic-auth').modal('hide');
    });

    $(document).on('click', '.list-request-headers .badge.basic-auth', function () {
        var data = $(this).data('data');
        $('#basic-auth-name').val(data['username']);
        $('#basic-auth-password').val(data['password']);
        $('#modal-basic-auth').modal('show');
    });

});