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

 window.currentResponseBlob = false;
$(function () {

  let mimes = ['application/pdf', 'application/zip', 'image/', 'application/octet-stream', 'video/', 
  'audio/', 'application/x-abiword', 'application/x-bzip', 'application/x-bzip2', 
  'application/msword', 'application/epub+zip', 'application/java-archive', 'application/ogg', 
  'application/x-rar-compressed', 'application/rtf', 'application/x-tar', 'application/x-font-ttf', 
  'application/x-font-woff', 'application/x-7z-compressed'];

  let imageMimes = ['image/gif', 'image/jpeg', 'image/png', 'image/svg+xml'];
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

  $(document).on('redirected', function (e, statusCode, url){
    var template = $('#template-response-redirects').html();
    $(Mustache.to_html(template, { 'statusCode': statusCode, 'url': url })).insertBefore('#response-headers');
  });

  $(document).on('update-response-body', function (e, mime, responseType, response) {
    console.log(`[response.js][update-response-body]`, mime, responseType);
    let iframe = document.getElementById("iframe-response")
    let iframeDoc = iframe.contentWindow.document;
    let previewTab = $('.response-container a.preview[data-toggle="tab"]');
    let btnDownload = $('.btn-download-response');

    btnDownload.hide();
    if (responseType == 'blob')
    {
      currentResponseBlob = response;
      console.log('[response.js][update-response-body]blob result', mime.indexOf('image'), response.size );
      
      if (imageMimes.indexOf(mime) >= 0)
      {
        var blobUrl = window.URL.createObjectURL(response);
        iframe.setAttribute('src', blobUrl);
        window.URL.revokeObjectURL(blobUrl);
        $('#tab-response-preview .CodeMirror').hide();
        $('#iframe-response').show();
        previewTab.show();
      }

      if (response.size < 1024 * 1024 * 10)
      {
        console.log(`[response.js][update-response-body] try to read it`);
        let reader = new FileReader();
        reader.readAsDataURL(response);
        reader.onloadend = function () {
          console.log(reader.result);
          cmResponseBody.getDoc().setValue(reader.result);
        }
      }
      else
      {
        cmResponseBody.getDoc().setValue(browser.i18n.getMessage("jsResponseBlobTooLargeContent"));
      }

      if (response.size > 0) {
        btnDownload.show();
      }

      $(document).trigger('update-response-active-tab');
      return true;
    }

    // if this mime type is a binary response warn user!
    let mode = CodeMirror.findModeByMIME(mime);
    mode = (typeof mode == 'undefined') ? false : mode;
    if (mode === false)
    {
      for (let i = 0; i < mimes.length; i++) {
        if (mime.indexOf(mimes[i]) == 0) {
          cmResponseBody.getDoc().setValue(browser.i18n.getMessage("jsResponseBlobTypeDetected"));
          storage.get('binary-warning-ignore').then((data) => {
            console.log('[response.js] binary-warning-ignore!', data);
            if (data['binary-warning-ignore'] === true) {
              return false;
            }

            $('#modal-binary-warning').data('mime', mime).modal('show');
          });
          return true;
        }
      }
    }

    response = (response === false) ? '' : response;
    let processed = false;
    if (response.length != '')
    {
      currentResponseBlob = new Blob([response], { type: mime });

      // is an html document
      if (mode.mode == 'htmlembedded' || mode.mode == 'htmlmixed') {
        processed = true;
        btnDownload.show();
        previewTab.show();

        $('#tab-response-preview .CodeMirror').hide();
        $('#iframe-response').show();
        console.log('[response.js][update-response-body] HTML', mode, response);
        try {
          iframeDoc.open();
          iframeDoc.write(response);
          iframeDoc.close();
        } catch (e) {
          console.error(e);
        }
      }

      // is an json document
      if (mode.mode == 'javascript') {
        processed = true;
        btnDownload.show();
        previewTab.show();

        let option = { name: "javascript", json: true };
        $('#tab-response-preview .CodeMirror').show();
        $('#iframe-response').hide();
        try {
          var json = js_beautify(response, { "indent_size": 2, "unescape_strings": true });
          cmResponseBodyPreview.setOption('mode', option);
          CodeMirror.autoLoadMode(cmResponseBodyPreview, option.name);
          cmResponseBodyPreview.getDoc().setValue(json);
        }
        catch (e) {
          console.error(e);
          cmResponseBodyPreview.getDoc().setValue(response);
        }
      }

      // is an xml document
      if (mode.mode == 'xml') {
        processed = true;
        btnDownload.show();
        previewTab.show();

        let option = 'xml';
        $('#tab-response-preview .CodeMirror').show();
        $('#iframe-response').hide();
        try {
          var xml = html_beautify(response, { "indent_size": 2, "unescape_strings": true });
          cmResponseBodyPreview.setOption('mode', option);
          CodeMirror.autoLoadMode(cmResponseBodyPreview, option);
          cmResponseBodyPreview.getDoc().setValue(xml);
        }
        catch (e) {
          console.error(e);
          cmResponseBodyPreview.getDoc().setValue(response);
        }
      }

      if (mode.mode == 'css') {
        processed = true;
        btnDownload.show();
        previewTab.show();

        let option = 'css';
        $('#tab-response-preview .CodeMirror').show();
        $('#iframe-response').hide();
        try {
          var css = css_beautify(response, { "indent_size": 2 });
          cmResponseBodyPreview.setOption('mode', option);
          CodeMirror.autoLoadMode(cmResponseBodyPreview, option);
          cmResponseBodyPreview.getDoc().setValue(css);
        }
        catch (e) {
          console.error(e);
          cmResponseBodyPreview.getDoc().setValue(response);
        }
      }
    }
    

    if (processed === false) {
      if (mode === false) {
        cmResponseBody.setOption('mode', null);
      }
      else {
        cmResponseBody.setOption('mode', mode.mode);
        CodeMirror.autoLoadMode(cmResponseBody, mode.mode);
      }
    }

    cmResponseBody.getDoc().setValue(response);
    $(document).trigger('update-response-active-tab'); 
  });

  $(document).on('click', '.btn-download-response', function(){
    if (currentResponseBlob == false)
    {
      return false;
    }
    ext.downloads.download({
      url: URL.createObjectURL(currentResponseBlob),
      saveAs: true
    });
  });

  // make sure to active a visible response tab
  $(document).on('update-response-active-tab', function() {
    if (!$('.div-response .nav-link.active').is(':visible'))
    {
      let tab = $('.div-response .nav-link.active').parents('.nav-item');
      let prev = tab.prev();
      if (prev.find('.nav-link').is(':visible'))
      {
        prev.find('.nav-link').tab('show');
      }
      else
      {
        $('.response-container a.headers').tab('show');
      }
    }
  });
});