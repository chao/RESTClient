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
      mode = null;
      $('.response-container a.preview[data-toggle="tab"]').show();
      var body = ""; // TODO preview image
      try {
        iframeDoc.open();
        iframeDoc.write(body);
        iframeDoc.close();
      } catch (e) {
        console.error(e);
      }
    }
    if (mode === false) {
      var info = CodeMirror.findModeByMIME(mime);
      mode = info.mode || null;
    }
    console.log(mode);
    if (mode) {
      cmResponseBody.setOption('mode', mode);
      CodeMirror.autoLoadMode(cmResponseBody, mode.name || mode);
    }
    else {
      cmResponseBody.setOption('mode', null);
    }

    cmResponseBody.getDoc().setValue(body);
  });

});