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

  function paste() {
    console.log('[curl.js] paste!!!!!!!!!!');
    var pasteText = document.querySelector("#p-curl");
    pasteText.focus();
    document.execCommand("paste");
    console.log(pasteText.textContent);
  }

  document.querySelector("#btn-curl-paste").addEventListener("click", paste);
});

function toCurl(request) {
    if(typeof request !== 'object')
    {
        throw "Request is not an object";
    }

    // default is a GET request
    var cmd = ['curl', '-X', request.method || 'GET'];

    if(request.url.indexOf('https') == 0)
    {
        cmd.push('-k');
    }

    // append request headers
    if(typeof request.headers == 'object')
    {
        request.headers.forEach(function(header){
            cmd.push('-H');
            if(header.value == '')
            {
                cmd.push(`${header.name};`);
            }
            else
            {
                cmd.push(`${header.name}: ${header.value};`);
            }
        });
    }

    // display the response headers
    cmd.push('-i');

    // append request url
    cmd.push(request.url);

    if(request.body && request.body.length > 0)
    {
      cmd.push('--data');
      // TODO support --data-binary
      cmd.push(request.body);
    }
    return Misc.shellescape(cmd);
}