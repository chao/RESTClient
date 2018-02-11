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
  /********************** Init Slideout Menu  ************************************/
  window.slideout = new Slideout({
    'panel': document.getElementById('wrapper'),
    'menu': document.getElementById('favorite-requests-list'),
    'padding': 312,
    'tolerance': 70,
    'easing': 'cubic-bezier(.32,2,.55,.27)'
  });
  $(document).on('click', '[data-toggle="sidebar"], .btn-manage-favorite-request', function () {
    slideout.toggle();
  });
  slideout.on('close', function () {
    $('.hamburger').removeClass('is-open');
    $('.hamburger').addClass('is-closed');
  });
  slideout.on('open', function () {
    $('.hamburger').removeClass('is-closed');
    $('.hamburger').addClass('is-open');
  });
  
  /********************** Init Favorite Request **************************/
  let tagInput = $('#favorite-tags').tagsinput();
  $(document).on('blur', '#modal-favorite-save .bootstrap-tagsinput input', function(){
    let tag = $(this).val();
    $(this).val('');
    if(tag != '')
    {
      $('#favorite-tags').tagsinput('add', tag);
    }
  });

  $(document).on('favorite-tags-changed', function (e, tags) {
    var tags = tags ? _.keys(tags) : [];
    console.log('[RESTClient][index.js][favorite-tags-changed] init', tags);
    var bhfavoriteTags = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: tags
    });
    try { $('#favorite-tags').tagsinput('destroy'); } catch (e) { }
    $('#favorite-tags').tagsinput({
      typeaheadjs: {
        name: 'tags',
        source: bhfavoriteTags
      }
    });
    $('#favorite-requests-list .tags-list').empty();
    _.each(tags, function (tag) {
      $('#favorite-requests-list .tags-list').append($('<a href="#" class="badge badge-primary"></a>').text(tag));
    });
  });
  $(document).on('favorite-requests-loaded', function () {
    $(document).trigger('favorite-tags-changed', [Database.tags]);
    $(document).trigger('show-favorite-requests');
    console.log('[RESTClient][index.js][favorite-requests-loaded]');
  });

  $('#modal-form-data').on('show.bs.modal', function (e) {
    $('.has-danger').removeClass('has-danger');
  });

  $(document).on('click', '.btn-save-favorite', function (e, tags) {
    var name = $('#favorite-name').val();
    if (name.length == 0) {
      $('#favorite-name').parents('.form-group').addClass('has-danger');
      return false;
    }
    $('.has-danger').removeClass('has-danger');
    var tags = $('#favorite-tags').tagsinput('items');

    var request = Request.get();
    request = Object.assign({ 'name': name, 'tags': tags }, request);

    console.log('[RESTClient][index.js][btn-save-favorite] get request', request);
    $('#modal-favorite-save').modal('hide');
    if (typeof Database.requests[name] !== 'undefined') {
      bootbox.confirm(browser.i18n.getMessage("jsFavoriteConflicted", name),
        function (result) {
          if (result) {
            Database.saveRequest(name, request).then(function () {
              $(document).trigger('favorite-requests-loaded');
              toastr.success(browser.i18n.getMessage("jsFavoriteReplaced"), name);
            });
          }
          console.log('This was logged in the callback: ', result);
        });
    }
    else {
      Database.saveRequest(name, request).then(function () {
        $(document).trigger('favorite-requests-loaded');
        toastr.success(browser.i18n.getMessage("jsFavoriteSaved"), name);
      });
    }
  });

  $(document).on('show-favorite-requests', function () {
    var tags = [];
    _.each($('#favorite-requests-list .badge.active'), function (item) {
      tags.push($(item).text());
    });
    console.log(`[RESTClient][index.js] ${tags.length} selected`, tags);
    var requests = Database.getRequestsByTag(tags);
    console.log(`[RESTClient][index.js] favorite requests`, requests);
    var html = $('#template-favorite-request').html();
    $('#favorite-requests-list .requests-list').empty();
    _.each(requests, function (request, name) {
      var item = $(html).clone();
      if(request.responseType == 'blob')
      {
        item.find('.type').removeClass('fa-file-text-o').addClass('fa-file-archive-o');
      }
      
      item.find('.name').text(name);
      item.find('.method').text(request.method);
      item.find('.host').text(request.url);
      _.each(request.tags, function (tag) {
        item.find('.card-block').append($('<a href="#" class="badge badge-default"></a>').text(tag));
      });
      item.data('request', request).data('name', name).data('tags', request.tags);
      $('#favorite-requests-list .requests-list').append(item);
    });
    var num = $('#favorite-requests-list .requests-list .request').length;
    if (num > 0) {
      $('.no-favorite-tip').hide();
    }
    else {
      $('.no-favorite-tip').show();
    }
    console.log(`[RESTClient][index.js][show-favorite-requests] ${num} favorites loaded.`);
  });

  $(document).on('click', '.btn-load-favorite-request', function (e) {
    var card = $(this).parents('.card');
    var request = card.data('request');
    console.log('[RESTClient][index.js] try to load request', request, card.data('name'), request.tags);
    $(document).trigger('load-favorite-request', [request]);
    $('#modal-favorite-save #favorite-name').val(card.data('name'));
    var tags = card.data('tags');
    if (tags && _.isArray(request.tags)) {
      $('#favorite-tags').tagsinput('removeAll');
      _.each(request.tags, function (tag) {
        $('#favorite-tags').tagsinput('add', tag);
      });
    }
  });
  $(document).on('click', '.btn-remove-favorite-request', function (e) {
    var card = $(this).parents('.card');
    var name = card.find('.name').text();

    console.log('[RESTClient][index.js] try to remove favorite request', name);
    Database.removeRequest(name).then(function () {
      $(document).trigger('favorite-tags-changed', [Database.tags]);
      card.addClass('animated zoomOutRight');
      setTimeout(function () {
        card.remove();
      }, 600);
    });
  });

  $(document).on('load-favorite-request', function (e, request) {
    $('#request-method').val(request.method);
    $('#request-url').val(request.url);
    $('#request-body').val(request.body);
    $('.list-request-headers').empty();
    $('.div-request-headers').hide();
    _.each(request.headers, function (header) {
      $(document).trigger('append-request-header', [header.name, header.value]);
      // TODO favorite
      // TODO authentication
    });

    $('.authentication-mode').removeClass('active');
    if(request.authentication)
    {
      var mode = request.authentication.mode;
      var params = request.authentication.data;
      
      $(`.authentication-mode[data-mode="${mode}"]`).addClass('active').data('params', params);
    }
    if (request.responseType) {
      $(document).trigger('switch-response-type', [request.responseType]);
    }
    else
    {
      $(document).trigger('switch-response-type', ['text']);
    }
    slideout.toggle();
    $('#request-url').trigger('input');
  });

  $(document).on('click', '#favorite-requests-list .tags-list .badge', function (e) {
    e.preventDefault();
    $(this).toggleClass('active');
    $(document).trigger('selected-tags-changed');
  });

  $(document).on('click', '#favorite-requests-list .requests-list .badge', function (e) {
    e.preventDefault();
    var tag = $(this);
    _.each($('#favorite-requests-list .tags-list .badge'), function (item) {
      if ($(item).text() == tag.text()) {
        $(item).addClass('active');
      }
      else {
        $(item).removeClass('active');
      }
    });

    $(document).trigger('selected-tags-changed');
  });

  $(document).on('selected-tags-changed', function () {
    var tags = [];
    _.each($('#favorite-requests-list .tags-list .badge.active'), function (item) {
      tags.push($(item).text());
    });
    console.log(`[RESTClient][index.js][selected-tags-changed]`, tags);
    if (tags.length == 0) {
      $('#favorite-requests-list .requests-list .card').show();
      return true;
    }
    _.each($('#favorite-requests-list .requests-list .card'), function (item) {
      var currentTags = $(item).data('tags');
      var name = $(item).data('name');
      console.log(`[RESTClient][index.js][selected-tags-changed] request: ${name}`, currentTags);
      var is = _.intersection(tags, currentTags);
      if (is.length == tags.length) {
        $(item).show();
      }
      else {
        $(item).hide();
      }
    });
  });
});