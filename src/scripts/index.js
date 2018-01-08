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

window.ext = require("./utils/ext");
window.storage = require("./utils/storage");
window.curlconverter = require('curlconverter');
window.currentTabInfo = false;
ext.tabs.getCurrent().then(function (tabInfo) {
  console.log(`[index.js] getCurrent`, tabInfo);
  window.currentTabInfo = tabInfo;
  if (tabInfo.incognito)
  {
    toastr.warning('You are using private browsing mode, you will not be able to use "favorites" function.', 'Private Browsing', {
      "positionClass": "toast-bottom-full-width",
      "closeButton": true,
      "timeOut": 0,
      "extendedTimeOut": 0
    });
    $('[data-invisible-incognito]').hide();
  }
}, function (error) {
  console.log(`[index.js] Error: ${error}`);
});

$(function () {
  window.favoriteHeaders = [];
  window.favoriteUrls = [];
  $(document).on('click', '[data-toggle="development"]', function () {
    toastr.error('This function is still under development.', 'Not ready yet!');
  });
  /**************************** Init Toastr ********************************/
  toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": true,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  }

  /******************** Send Button ****************/
  $('.btn-send-request').prop('disabled', true);
  $(document).on('keyup input change paste', '#request-method, #request-url', function () {
    
    var method = $('#request-method').val();
    var url = $('#request-url').val();
    var isUrl = urlHelper.is_web_iri(url);
    console.log('[index.js] request url changed, decide request SEND button status.', method, url, isUrl);
    // console.log(isUrl);
    // console.log(method != '' && typeof isUrl != 'undefined');
    if (method != '' && typeof isUrl != 'undefined') {
      $('.btn-send-request').prop('disabled', false);
    }
    else {
      $('.btn-send-request').prop('disabled', true);
    }
  }).trigger('change');

  /*************************** Execute request ******************************/
  $('.request-form').on('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if ($('.btn-send-request').prop('disabled')) {
      return false;
    }
    var request;
    try {
      request = Request.getProcessed();
    }
    catch (e) {
      toastr.error(e);
      return false;
    }

    $('#response-headers ol').empty();
    cmResponseBody.getDoc().setValue('');
    cmResponseBodyPreview.getDoc().setValue('');
    $('#tab-response-preview .CodeMirror').hide();
    $('#iframe-response').show();
    $('.response-container a.preview[data-toggle="tab"]').hide();

    ext.runtime.sendMessage({
      action: "execute-http-request",
      target: "background",
      data: request
    });

    $('.current-request-basic').html(request.method + ' ' + request.url);
    $(document).trigger("show-fullscreen");
    $(document).trigger('request-updated', [request]);
  });


});