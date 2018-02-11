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
  $(document).on('click', '.btn-switch-response-type', function (e) {
    var li = $(this);
    var type = li.data('type');
    $(document).trigger('switch-response-type', [type]);
  });

  $(document).on('switch-response-type', function (e, type, callback) {
    $('.btn-switch-response-type').removeClass('active');
    $('.btn-switch-response-type[data-type="' + type + '"]').addClass('active');
    if (type == 'text') {
      $('.icon-response-type').removeClass('fa-file-archive-o').addClass('fa-file-text-o').removeData();
      $('.response-type[data-type="blob"]').removeClass('active');
    }
    else {
      $('.icon-response-type').removeClass('fa-file-text-o').addClass('fa-file-archive-o').data('type', 'blob');
      $('.response-type[data-type="blob"]').addClass('active');
    }

    if (typeof callback == 'function') {
      callback();
    }
  });

  $('#modal-binary-warning').on('show.bs.modal', function (e) {
    var mime = $('#modal-binary-warning').data('mime');
    $('[data-i18n="modalBinWarningContent"]').html(browser.i18n.getMessage("modalBinWarningContent", mime));
  });

  $(document).on('click', '#modal-binary-warning-ignore', function(){
    let checked = $(this).is(':checked');
    storage.set({ ['binary-warning-ignore']: checked }).then(() => {
      console.log('[binary.js] set binary-warning ignore', checked);
    });
  });

  $(document).on('click', '#modal-binary-warning .btn-set-response-type-blob', function (e) {
    $(document).trigger('switch-response-type', ['blob', function(){
      $('.btn-send-request').click();
    }]);
    $('#modal-binary-warning').modal('hide');
  });

  $(document).on('click', '.response-type[data-type="blob"] .btn-close', function (e) {
    $(document).trigger('switch-response-type', ['text']);
  });
});