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

  $(document).on('request-updated', function(e, request){
    if ($('.curl-container').is(':visible')) {
      var curl = toCurl(request);
      console.log(`[index.js] request execution, curl: ${curl}`);
      $('#p-curl').text(curl);
    }
    else {
      $('#p-curl').html('');
    }
  });

  var clipboard = new Clipboard('#btn-curl-copy');

  clipboard.on('success', function (e) {
    toastr.success('CURL command copied!');
    e.clearSelection();
  });

  function paste() 
  {
    var pasteText = document.querySelector("#curl-paste");
    pasteText.focus();
    document.execCommand("paste");
    console.log('[curl.js] pasted', pasteText.textContent);
    $(document).trigger('curl-command-pasted', [pasteText.textContent]);
  }

  document.querySelector("#btn-curl-paste").addEventListener("click", paste);

  $(document).on('curl-command-pasted', function (e, curlCmd) {
    console.log(`[curl.js] curl command pasted`, curlCmd);
    var pasteText = document.querySelector("#curl-paste");
    pasteText.textContent = '';
    
    var request = {};
    try {
      request = parseCurlCommand(curlCmd);
    }
    catch(e)
    {
      $('#p-curl').val('');
      toastr.error(e.message, 'Cannot parse your pasted CURL command.');
      console.error(`[curl.js] parse curl command error`, e);
    }
    console.log(`[curl.js] curl command parsed`, request);
    $('.authentication-mode').removeClass('active');
    $('#request-method').val(_.upperCase(request.method || 'GET'));
    $('#request-url').val(request.url);
    $('#request-body').val('');
    $('.list-request-headers').empty();
    $('.div-request-headers').hide();

    // append headers
    for (var headerName in request.headers) {
      $(document).trigger('append-request-header', [headerName, request.headers[headerName]]);
    }
    if (request.cookies) {
      var cookieString = serializeCookies(request.cookies);
      $(document).trigger('append-request-header', ['Cookie', cookieString]);
    }
    if (request.data) {

      if (_.isString(request.data) && request.data.indexOf("'") > -1) {
        request.data = jsesc(request.data)
      }
      $('#request-body').val(request.data);
    }

    if(request.auth)
    {
      var username = '', password = '';
      if(request.auth.indexOf(':') >= 0)
      {
        var credentials = request.auth.split(':');
        username = credentials[0];
        password = credentials[1];
      }
      else
      {
        username = request.auth;
      }
      $(document).trigger('append-basic-auth', [username, password]);
    }
    $('#p-curl').val(curlCmd);
  });
});
