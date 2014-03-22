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
  scrollProcessing: false,
  cachedRequests: new Array(),
  callback: null,
  init: function(){
    var retVals = (window.hasOwnProperty('arguments') && window.arguments.length > 0) ? window.arguments[0] : {};
    var theme = (typeof retVals.theme !== 'undefined') ? retVals.theme : 'simplex';
    
    restclient.bookmark.callback = (window.hasOwnProperty('arguments') && typeof window.arguments[1] === 'function') ? window.arguments[1] : false;
    restclient.bookmark.initSkin(theme);
    
    restclient.init();
    restclient.sqlite.open();
    
    restclient.bookmark.initLabels();
    restclient.bookmark.initModals();
    restclient.bookmark.updateRequests(0);
    restclient.bookmark.initEvents();
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
  initEvents: function(){
    $('a.favorite').live('click', restclient.bookmark.toggleFavorite);
    $('#labels span.edit').on('click', restclient.bookmark.clickLabelEdit);
    $('.removeBookmark').live('click', restclient.bookmark.clickRemoveBookmark);
    $('.requestName').live('click', restclient.bookmark.applyRequest);
    $( window ).bind('scroll', restclient.bookmark.scrollWindow);
  },
  initLabels: function(){
    var labels = restclient.sqlite.getLabels();
    var selectedLabels = restclient.getPref('bookmark.selectedLabels', '[]');
    selectedLabels = JSON.parse(selectedLabels);

    _.each(labels, function(value, label){
      var div = $('<div class="label-div" />');
      
      var icon = $('<i class="fa fa-trash-o remove fa-lg hide"></i>').bind('click', restclient.bookmark.clickTrashLabel);
      var span = $('<span />').addClass('label').attr('data-label', label).attr('data-num', value)
                  .text(" " + label + " (" + value + ")").bind('click', restclient.bookmark.clickLabel);
      
      if(_.indexOf(selectedLabels, label) >= 0)
        span.addClass('label-important');          
      div.append(icon).append(span);
      $('.labels-panel').append(div);
    });
  },
  scrollWindow: function(event){
    if( restclient.bookmark.scrollProcessing )
      return false;
    restclient.bookmark.scrollProcessing = true;
    if ($(window).scrollTop() >= $(document).height() - $(window).height() - 700){
      console.log('scrolling');
      var num = $('#requests li[data-uuid]').length;
      console.log(num);
      var requestNum = parseInt($('.requestNum').text());
      if(num < requestNum)
      {
        $('.loading').show();
        restclient.bookmark.updateRequests(num);
        $('.loading').hide();
      }
    }
    restclient.bookmark.scrollProcessing = false;
  },
  clickLabel: function(){
    $(this).toggleClass('label-important');
    var spans = $('.labels-panel .label-important');
    var labels = [];
    for(var i=0, span; span = spans[i]; i++) {
      labels.push($(span).attr('data-label'));
    }
    restclient.setPref('bookmark.selectedLabels', JSON.stringify(labels));
    
    restclient.bookmark.updateRequests(0);
    return false;
  },
  clickLabelEdit: function(){
    if($(this).attr('data-state') === 'normal')
    {
      $(this).text('cancel').attr('data-state', 'edit');
      $('#labels .remove').show();
    }
    else
    {
      $(this).text('edit').attr('data-state', 'normal');
      $('#labels .remove').hide();
    }
    return false;
  },
  clickTrashLabel: function() {
    var label = $(this).next().attr('data-label');
    $('#modal-label-remove').data('source', $(this));
    $('#modal-label-remove').data('label', label).modal('show');
  },
  clickRemoveBookmark: function() {
    var uuid = $(this).parents('li').attr('data-uuid');
    var ret = restclient.sqlite.removeRequest(uuid);
    if(ret === true) {
      $(this).parents('li').hide();
      var spans = $(this).parents('li').find('.used-label');
      var reload = false;
      for(var i = 0, span; span = spans[i]; i++)
      {
        var label = $(span).text();
        var num = $('[data-label="' + label + '"]').attr('data-num');
        num = parseInt(num);
        num--;
        $('[data-label="' + label + '"]').attr('data-num', num).text(label + '(' + num + ')');
        if(num === 0) {
          if(reload === false && $('[data-label="' + label + '"]').hasClass('label-important'))
            reload = true;
            
          $('[data-label="' + label + '"]')
            .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){ $(this).hide().remove(); })
            .addClass('animated fadeOut');
        }
      }
      if(reload)
        setTimeout(function() { restclient.bookmark.updateRequests(0); }, 500);
      
      var requestNum = parseInt($('.requestNum').text());
      requestNum--;
      $('.requestNum').text(requestNum);
    }
    return false;
  },
  removeLabel: function(cascade) {
    var ret,label = $('#modal-label-remove').data('label');
    ret = restclient.sqlite.removeLabel(label, cascade);
    if(ret === true) {
      $('#modal-label-remove .btnClose').last().click();
      var source = $('#modal-label-remove').data('source');
      var div = source.parent();

      setTimeout(function(){
        div.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){ 
          $(this).hide().remove(); 
          restclient.bookmark.updateRequests(0);
        });
        div.addClass('animated bounceOutUp');
      }, 500);
    }
    else
    {
      var message = restclient.message.show({
        id: 'alert-remove-label-failed',
        type: 'error',
        title: 'Cannot remove the label',
        message: 'Cannot remove the label, something is wrong.',
        buttons: [
          {title: 'Close', class: 'btn-danger', callback: function () { $('#alert-remove-label-failed').alert('close').remove(); }}
        ],
        exclude: true,
        prepend: true,
        parent: $('#modal-label-remove .modal-body')
      });
    }
    return false;
  },
  updateRequests: function(offset) {
    if(typeof offset === 'undefined') {
      offset = 0;
    }
    if(offset === 0) {
      $('.bookmark-requests').html('');
      restclient.bookmark.cachedRequests = new Array();
    }

    var labelSelected = $('.labels-panel .label-important');
    var labels = [];

    for(var i=0, lab; lab = labelSelected[i]; i++){
      labels.push($(lab).attr('data-label'));
    }
    
    var keyword = '';
    var requestNum = restclient.sqlite.countRequestsByKeywordAndLabels(keyword, labels);
    $('.requestNum').text(requestNum);
    var requests = restclient.sqlite.findRequestsByKeywordAndLabels(keyword, labels, offset);
    if(requests === false)
      return false;

    restclient.bookmark.cachedRequests = restclient.bookmark.cachedRequests.concat(requests);
    
    var templateHtml = $('#bookmarkRequest').html();
    var template = _.template(templateHtml, {items: requests});
    
    $('.bookmark-requests').append(template);
  },
  toggleFavorite: function(e) {
    var uuid = $(this).parents('li').attr('data-uuid');
    var favorite = $(this).attr('data-favorite');
    favorite = (favorite === '0') ? 1 : 0;
    var ret = restclient.sqlite.updateRequestFavorite(uuid, favorite);
    if(ret === true) {
      $(this).attr('data-favorite', favorite);
      $(this).find('i').toggleClass('fa-star fa-star-o');
    }
    //TODO if fails...
    return false;
  },
  applyRequest: function(){
    var uuid = $(this).parents('li').attr('data-uuid');
    var request = _.where(restclient.bookmark.cachedRequests, {uuid: uuid});
    if(request.length > 0) {
      restclient.bookmark.callback(request[0].request);
      window.close();
    }
  }
};

window.addEventListener("load", function () { restclient.bookmark.init();  }, false);
window.addEventListener("unload", function () { restclient.bookmark.unload(); }, false);