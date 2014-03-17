/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

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

"use strict";

restclient.bookmark = {
  init: function(){
    var retVals = (window.hasOwnProperty('arguments') && window.arguments.length > 0) ? window.arguments[0] : {};
    var theme = (typeof retVals.theme !== 'undefined') ? retVals.theme : 'simplex';
    restclient.bookmark.initSkin(theme);
    
    restclient.init();
    restclient.sqlite.open();
    
    restclient.bookmark.initLabels();
    restclient.bookmark.initModals();
  },
  unload: function(){},
  initSkin: function(theme) {
    $("link").remove();
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/themes/" + theme + "/bootstrap.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/themes/" + theme + "/bootstrap-responsive.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/font-awesome.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/restclient.bookmark.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/animate.css"
    }).appendTo("head");
  },
  initModals: function(){
    $('#modal-label-remove').on('show', function () {
      var label = $('#modal-label-remove').data('label');
      $('#modal-label-remove .label').text(label);
    });
    
    $('.modal .btnClose').live('click', function () {
      $(this).parents('.modal').modal('hide');
      return false;
    });
  },
  initLabels: function(){
    var labels = restclient.sqlite.getLabels();
    
    _.each(labels, function(value, key){
      var div = $('<div class="label-div" />');
      
      var icon = $('<i class="fa fa-trash-o remove fa-lg hide"></i>').bind('click', restclient.bookmark.clickTrashLabel);
      var span = $('<span />').addClass('label').attr('data-label', key)
                  .text(" " + key + " (" + value + ")").bind('click', restclient.bookmark.clickLabel);
      div.append(icon).append(span);
      $('.labels-panel').append(div);
    });
  },
  clickLabel: function(){
    $(this).toggleClass('label-important');
    
  },
  clickLabelEdit: function(el){
    var labelEdit = $('#labels .edit');
    if(labelEdit.attr('data-state') === 'normal')
    {
      labelEdit.text('cancel').attr('data-state', 'edit');
      $('#labels .remove').show();
    }
    else
    {
      labelEdit.text('edit').attr('data-state', 'normal');
      $('#labels .remove').hide();
    }
    return false;
  },
  clickTrashLabel: function() {
    var label = $(this).next().attr('data-label');
    $('#modal-label-remove').data('label', label).modal('show');
    
  },
  updateRequests: function() {
    var labelSelected = $('.label-important');
    var labels = [];
    
    for(var i=0, lab; lab = labelSelected[i]; i++){
      labels.push(lab.text());
    }
    
    var keyword = '';
    var requests = restclient.sqlite.findRequestsByKeyword(keyword, labels);
    console.log(requests);
  }
};

window.addEventListener("load", function () { restclient.bookmark.init();  }, false);
window.addEventListener("unload", function () { restclient.bookmark.unload(); }, false);