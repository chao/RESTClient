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

 window.currentResponse = false;
$(function () {
  /********************** Init Response Raw and Preview **************************/
  CodeMirror.modeURL = "scripts/plugins/codemirror-5.31.0/mode/%N/%N.js";
  window.cmResponseBody = CodeMirror.fromTextArea(document.getElementById("response-body"), {
    lineWrapping: true,
    lineNumbers: true
  });
  window.cmResponseBodyPreview = CodeMirror.fromTextArea(document.getElementById("response-body-preview"), {
    lineNumbers: true,
    lineWrapping: true,
    extraKeys: { "Ctrl-Q": function (cm) { cm.foldCode(cm.getCursor()); } },
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
  });
  $('.response-container a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    if ($(e.target).attr('href') == '#tab-response-body') {
      cmResponseBody.refresh();
    }
    if ($(e.target).attr('href') == '#tab-response-preview') {
      cmResponseBodyPreview.refresh();
    }
  });
  $(document).on('update-response-body', function (e, mime, body) {
    console.log("[index.js]['update-response-body']", mime, body);
    currentResponse = {'mime': mime, 'body': body};
    var bodySize = body.length;
    $('.li-download').hide();
    
    var iframe = document.getElementById("iframe-response")
    var iframeDoc = iframe.contentWindow.document;
    if (!mime || mime == '') {
      mime = 'text/plain';
    }

    mime = mime.toLowerCase();
    try {
      iframeDoc.open();
      iframeDoc.write('<html></html>');
      iframeDoc.close();
    } catch (e) {
      console.error(e);
    }

    var mode = false;
    if (mime.indexOf('text/html') >= 0) {
      mode = 'htmlmixed';
      if (bodySize > 0) {
        $('.li-download').show();
      }
      $('.response-container a.preview[data-toggle="tab"]').show();
      try {
        iframeDoc.open();
        iframeDoc.write(body);
        iframeDoc.close();
      } catch (e) {
        console.error(e);
      }
    }

    if (mode === false && (mime.indexOf('/json') >= 0 || mime.indexOf('+json') > 0)) {
      if (bodySize > 0) {
        $('.li-download').show();
      }
      mode = { name: "javascript", json: true };
      $('.response-container a.preview[data-toggle="tab"]').show();
      $('#tab-response-preview .CodeMirror').show();
      $('#iframe-response').hide();
      try {
        // var json = JSON.stringify(JSON.parse(body), null, '  ');
        var json = js_beautify(body, { "indent_size": 2, "unescape_strings": true });
        cmResponseBodyPreview.setOption('mode', mode);
        CodeMirror.autoLoadMode(cmResponseBodyPreview, mode.name || mode);
        cmResponseBodyPreview.getDoc().setValue(json);
      }
      catch (e) {
        console.error(e);
        cmResponseBodyPreview.getDoc().setValue(body);
      }
    }
    if (mode === false && (mime.indexOf('/xml') >= 0 || mime.indexOf('+xml') > 0)) {
      if (bodySize > 0) {
        $('.li-download').show();
      }
      mode = 'xml';
      $('.response-container a.preview[data-toggle="tab"]').show();
      $('#tab-response-preview .CodeMirror').show();
      $('#iframe-response').hide();

      var xml = html_beautify(body, { "indent_size": 2, "unescape_strings": true });
      cmResponseBodyPreview.setOption('mode', mode);
      CodeMirror.autoLoadMode(cmResponseBodyPreview, mode.name || mode);
      cmResponseBodyPreview.getDoc().setValue(xml);
    }
    if (mode === false && mime.indexOf('text/css') >= 0) {
      if (bodySize > 0) {
        $('.li-download').show();
      }
      mode = 'css';
      $('.response-container a.preview[data-toggle="tab"]').show();
      $('#tab-response-preview .CodeMirror').show();
      $('#iframe-response').hide();
      console.log('[RESTClient][index.js]["update-response-body"] is css', mode);
      var css = css_beautify(body, { "indent_size": 2 });
      console.log('[RESTClient][index.js]["update-response-body"] is css', css);
      cmResponseBodyPreview.setOption('mode', mode);
      CodeMirror.autoLoadMode(cmResponseBodyPreview, mode.name || mode);
      cmResponseBodyPreview.getDoc().setValue(css);
    }
    if (mode === false && mime.indexOf('image') >= 0) {
      console.log(`[response.js] mime: ${mime}`, body);
      var size = bodySize / 1024 / 1024;
      // if the image is large then 1MB
      if(size > 1)
      {
        cmResponseBody.setOption('mode', null);
        cmResponseBody.getDoc().setValue('The image is too large to show.');
        toastr.warning(browser.i18n.getMessage("jsResponseImageTooLargeContent"), browser.i18n.getMessage("jsResponseImageTooLargeTitle"));
      }
      else
      {
        $('.response-container a.preview[data-toggle="tab"]').show();
        var image;
        try {
          image = base64Encode(body);
          console.log(`[response.js] after base64 encode`, image);
        }
        catch (e) {
          console.error(`[response.js] cannot convert to base 64`, e);
        }

        if (image) {
          var source = `data:${mime};base64,` + image;
          var preview = `<img src="${source}">`;
          preview += `<p><code>${source}</code></p>`;
          try {
            iframeDoc.open();
            iframeDoc.write(preview);
            iframeDoc.close();
          } catch (e) {
            console.error(e);
          }
        }
        cmResponseBody.setOption('mode', null);
        cmResponseBody.getDoc().setValue(body);
      }
      
      return true;
    }
    // other text/* mime type
    if (mode === false && mime.indexOf('text/') >= 0) {
      mode = null;
    }

    if (mode === false) {
      var info = CodeMirror.findModeByMIME(mime);
      mode = info.mode || null;
    }
    console.log(`[response.js] response result`, mode, body);
    if (mode) {
      cmResponseBody.setOption('mode', mode);
      CodeMirror.autoLoadMode(cmResponseBody, mode.name || mode);
    }
    else {
      cmResponseBody.setOption('mode', null);
    }

    cmResponseBody.getDoc().setValue(body);
  });

  $(document).on('click', '.btn-download-response', function(){
    if (currentResponse == false)
    {
      return false;
    }
    downloadResponse(currentResponse.body, currentResponse.mime || '');
  });
});

function downloadResponse(body, mime)
{
  let file = new Blob([body], { type: mime });
  ext.downloads.download({
    url: URL.createObjectURL(file),
    saveAs: true
  });
}
function base64Encode(str) {
  var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var out = "", i = 0, len = str.length, c1, c2, c3;
  while (i < len) {
    c1 = str.charCodeAt(i++) & 0xff;
    if (i == len) {
      out += CHARS.charAt(c1 >> 2);
      out += CHARS.charAt((c1 & 0x3) << 4);
      out += "==";
      break;
    }
    c2 = str.charCodeAt(i++);
    if (i == len) {
      out += CHARS.charAt(c1 >> 2);
      out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
      out += CHARS.charAt((c2 & 0xF) << 2);
      out += "=";
      break;
    }
    c3 = str.charCodeAt(i++);
    out += CHARS.charAt(c1 >> 2);
    out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
    out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
    out += CHARS.charAt(c3 & 0x3F);
  }
  return out;
}