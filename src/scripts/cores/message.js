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

ext.runtime.onMessage.addListener(
  function (request, sender) {

    console.log(`[message.js] target ${request.target}, tab: ${request.senderTabId}, action: ${request.action}`, request, sender);
    if (request.target !== 'index' || (request.senderTabId != currentTabInfo.id && request.type != 'boardcast')) {
      return false;
    }

    if (request.action == "update-progress-bar") {
      console.log(request.data);
      $('[role="progressbar"]')
        .addClass('progress-bar-animated')
        .attr('aria-valuenow', request.data)
        .css('width', request.data + '%');
      return false;
    }

    if (request.action == "set-progress-bar-animated") {
      console.log('animated progress-bar');
      $('[role="progressbar"]').addClass('progress-bar-animated')
        .attr('aria-valuenow', '100')
        .css('width', '100%');
      $('.current-request-status').html(request.data);
      return false;
    }

    if (request.action == "update-progress-label") {
      $('.current-request-status').html(request.data);
      return false;
    }

    if (request.action == "hide-overlay") {
      $(document).trigger("hide-fullscreen");
      return false;
    }

    if (request.action == "start-counting") {
      $(document).trigger('start-counting');
      return false;
    }

    if (request.action == "abort-http-request") {
      toastr.warning("HTTP request (" + $('#request-method').val() + " " + $('#request-url').val() + ") aborted.");
      return false;
    }

    if (request.action == "http-request-timeout") {
      $(document).trigger("hide-fullscreen");
      toastr.error("HTTP request (" + $('#request-method').val() + " " + $('#request-url').val() + ") timed out.");
      return false;
    }

    if (request.action == "http-request-error") {
      $(document).trigger("hide-fullscreen");
      toastr.error(request.data.detail || "Request error", request.data.title || "Error");
      return false;
    }

    if (request.action == "http-request-load") {
      var mime = false;
      $(document).trigger("hide-fullscreen");
      // console.log(request.data);
      $('#response-headers ol').empty();
      if (request.data && request.data.headers) {
        _.each(request.data.headers, function (header) {
          var span = $('<span class="d-flex"></span>');
          span.append($('<span class="header-name"></span>').text(header['key']));
          span.append($('<span class="header-split">: </span>'));
          span.append($('<span class="header-value"></span>').text(header['value']));
          var li = $('<li></li>').append(span);
          $('#response-headers ol').append(li);

          if (header['key'].toLowerCase() == 'content-type') {
            mime = header['value'];
          }

        });
      }
      var body = request.data.body || '';
      // console.log([mime, body]);
      $(document).trigger('update-response-body', [mime, body]);

      return false;
    }

    if (request.action == 'http-oauth2-tab-closed' && typeof oauth2TabId != 'undefined')
    {
      console.log(`[message.js][http-oauth2-tab-closed] closed tab: ${request.tabId}, oauth2TabId: ${oauth2TabId}`);
      if (request.tabId == oauth2TabId) {
        Ladda.stopAll();
        window.oauth2TabId = false;
      }
    }
  }
);