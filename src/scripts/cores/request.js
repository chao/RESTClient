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
var Request = {
    get() {
        var headers = [];

        $(".list-request-headers .badge").each(function (idx, item) {
            var name = $(item).data('name');
            var value = $(item).data('value');
            headers.push({ 'name': name, 'value': value });
        });
        var request = {
            'method': $('#request-method').val(),
            'url': $('#request-url').val(),
            'headers': headers,
            'body': $('#request-body').val()
        }

        // Get authentication parameters
        if($('.authentication-mode.active').length > 0)
        {
            var authentication = {
                'mode': $('.authentication-mode.active').data('mode'),
                'data': $('.authentication-mode.active').data('params')
            };
            request.authentication = authentication;
        }
        if ($('#request-body').data('form-data'))
        {
            request.form = $('#request-body').data('form-data');
        }
        if ($('.icon-response-type').data('type'))
        {
            request.responseType = $('.icon-response-type').data('type');
        }
        return request;
    },
    getProcessed(request) {
        if(typeof request == 'undefined')
        {
            request = this.get();
        }
        if(typeof request.authentication === 'undefined')
        {
            return request;
        }
        if (request.authentication.mode == 'oauth20') 
        {
            return oauth2Sign(request);
        }
        if(request.authentication.mode == 'oauth10')
        {
            var result = oauthSign(request);
            if (_.isString(request.authentication.data.parameter_transmission) && request.authentication.data.parameter_transmission == 'header')
            {
                request.headers.push({ 'name': 'Authorization', 'value': result.header});               
            }
            if (_.isString(request.authentication.data.parameter_transmission) && request.authentication.data.parameter_transmission == 'query') {
                request.url = result.signed_url;
            }
            return request;
        }
        if(request.authentication.mode == 'basic')
        {
            return basicAuthentication(request);
        }
    }
}