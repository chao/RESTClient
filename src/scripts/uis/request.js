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
  /********************** Init Request Method & URL **************************/
  $('#request-method, #request-url').on('focus', function () {
    $(this).select();
  });
  $('#request-method-dropdown a').on('click', function () {
    var method = $(this).text();
    $('#request-method').val(method);
  });
  // Load favorite urls from storage
  $('.btn-toggle-favorite-url').prop('disabled', true);
  storage.get('request-urls').then(
    (data) => {
      console.log(data);
      if (data['request-urls'] && data['request-urls'].length > 0) {
        window.favoriteUrls = data['request-urls'];
      }
      $('#request-url').trigger('change');
      $(document).trigger('init-favorite-url-dropdown-items', false);
      $('.btn-toggle-favorite-url').prop('disabled', false);
    }
  );

  $('.btn-toggle-favorite-url').on('click', function () {
    var url = $('#request-url').val();
    if (url == '') {
      return false;
    }
    var idx = _.indexOf(favoriteUrls, url);
    if (idx >= 0) {
      _.remove(favoriteUrls, function (item) {
        return item == url;
      });
    }
    else {
      favoriteUrls.push(url);
    }
    $(document).trigger('init-favorite-url-dropdown-items', true);
    $('.btn-toggle-favorite-url i').toggleClass('fa-star-o');
    $('.btn-toggle-favorite-url i').toggleClass('fa-star');
  });

  $(document).on('change input', '#request-url', function () {
    console.log('[request.js] request url changed');
    var url = $('#request-url').val();
    // console.log(url);
    if (url == '') {
      $('.btn-toggle-favorite-url').prop('disabled', true);
      $('.btn-toggle-favorite-url i').addClass('fa-star-o').removeClass('fa-star');
      return false;
    }
    $('.btn-toggle-favorite-url').prop('disabled', false);
    $('.btn-toggle-favorite-url i').removeClass('fa-star-o fa-star');
    var idx = _.indexOf(favoriteUrls, url);
    if (idx >= 0) {
      $('.btn-toggle-favorite-url i').addClass('fa-star');
    }
    else {
      $('.btn-toggle-favorite-url i').addClass('fa-star-o');
    }
  });

  $(document).on('init-favorite-url-dropdown-items', function (e, saveToStorage) {
    $('#request-urls-dropdown').empty();
    // console.log(favoriteUrls);
    if (typeof favoriteUrls == 'object' && favoriteUrls.length > 0) {
      _.forEach(favoriteUrls, function (url) {
        var el = $('<a class="dropdown-item" href="#"></a>').text(url);
        $('#request-urls-dropdown').append(el);
      });
    }
    else {
      var li = $('<a class="dropdown-item disabled" href="#">No favorite URLs</a>');
      $('#request-urls-dropdown').append(li);
    }
    if (saveToStorage) {
      storage.set({ ['request-urls']: favoriteUrls }).then(() => {
        // console.log(favoriteUrls);
      });
    }
  });

  $(document).on('click', '#request-urls-dropdown .dropdown-item', function () {
    var url = $(this).text();
    if ($(this).hasClass('disabled')) {
      return false;
    }
    $('#request-url').val(url).trigger('change');
  });

  $(document).on('click', '#nav-download-favorite-request', function (e) {
    // e.stopPropagation();
    // e.preventDefault();

    Database.loadRequests().then(function () {
      let requests = Database.requests;
      console.log('[RESTClient][index.j] start to export requests', requests);
      let dump = JSON.stringify({
        version: Database.DB_VERSION,
        data: requests
      });
      let file = new Blob([dump], { type: 'text/json' });
      console.log(ext);
      ext.downloads.download({
        url: URL.createObjectURL(file),
        saveAs: true,
        filename: 'RESTClient_dump_' + (new Date()).toISOString().split('T')[0] + '.json'
      });
    });
  });
  
  /********************** Init Request Headers **************************/
  $('.nav-custom-header, .nav-custom-header-clear').addClass('disabled');
  storage.get('request-headers').then(
    (data) => {
      console.log(data);
      if (data['request-headers'] && data['request-headers'].length > 0) {
        window.favoriteHeaders = data['request-headers'];
      }
      $(document).trigger('init-favorite-headers-dropdown-items', false);
      $('.nav-custom-header, .nav-custom-header-clear').removeClass('disabled');
    }
  );

  $(document).on('init-favorite-headers-dropdown-items', function (e, saveToStorage) {
    $('.di-favorite-header, .di-favorite-divider').remove();
    // console.log(favoriteUrls);
    if (typeof favoriteHeaders == 'object' && favoriteHeaders.length > 0) {
      $('<div class="dropdown-divider di-favorite-divider"></div>')
        .insertAfter('.nav-custom-header');
      _.forEach(favoriteHeaders, function (header) {
        var el = $('<a class="dropdown-item di-favorite-header" href="#"></a>')
          .text(header.name + ': ' + header.value)
          .data('name', header.name)
          .data('value', header.value)
          .attr('title', header.name + ': ' + header.value);
        el.insertAfter('.di-favorite-divider');
      });
    }
    if (saveToStorage) {
      storage.set({ ['request-headers']: favoriteHeaders }).then(() => {
      });
    }
  });

  $(document).on('click', '.nav-custom-header', function () {
    $('#modal-header').modal('show');
  });

  $('#modal-header').on('shown.bs.modal', function () {
    $('#request-header-name').focus().select();
  });
  $('#modal-header').on('hide.bs.modal', function () {
    $('#modal-header .has-danger').removeClass('has-danger');
    $('#modal-header').removeData('source');
    $('#save-request-header-favorite').removeAttr('checked').prop('checked', false);
  });

  $(document).on('submit', '.form-request-header', function (e) {
    e.preventDefault();
    $('#modal-request-header .has-danger').removeClass('has-danger');
    var requestName = $('#request-header-name').typeahead('val');
    var requestValue = $('#request-header-value').typeahead('val');
    if (requestValue == '' && requestName == '')
    {
      $('#request-header-name').parents('.form-group').find('.form-text').text(browser.i18n.getMessage("jsRequestHeaderCannotBeEmpty"));
      $('#request-header-value').parents('.form-group').find('.form-text').text(browser.i18n.getMessage("jsRequestHeaderCannotBeEmpty"));
      $('#request-header-name').parents('.form-group').addClass('has-danger');
      $('#request-header-value').parents('.form-group').addClass('has-danger');
      toastr.error(browser.i18n.getMessage("jsRequestHeaderCannotBeEmpty"));
      return false;
    }
    if (bannedHeaders.indexOf(requestName.toLowerCase()) >= 0 
          || requestName.toLowerCase().indexOf('proxy-') == 0
          || requestName.toLowerCase().indexOf('sec-') == 0)
    {
      $('#request-header-name').parents('.form-group').find('.form-text').text(browser.i18n.getMessage("jsRequestHeaderBlocked", requestName));
      $('#request-header-name').parents('.form-group').addClass('has-danger');
      return false;
    }
    var favorite = ($('#save-request-header-favorite:checked').length == 1);
    var source = $('#modal-header').data('source');
    $(document).trigger('append-request-header', [requestName, requestValue, favorite, source]);
    $('#modal-header').modal('hide');
    if (favorite) {
      var result = _.find(favoriteHeaders, { 'name': requestName, 'value': requestValue });
      if (typeof result == 'undefined') {
        favoriteHeaders.push({ 'name': requestName, 'value': requestValue });
        $(document).trigger('init-favorite-headers-dropdown-items', true);
      }
    }
    else {
      var result = _.remove(favoriteHeaders, function (item) {
        console.log(requestName);
        console.log(requestValue);
        console.log(item);
        return item.name == requestName && item.value == requestValue;
      });
      console.log(result);
      console.log(favoriteHeaders);
      if (result.length > 0) {
        $(document).trigger('init-favorite-headers-dropdown-items', true);
      }
    }
  });

  $(document).on('click', '.nav-custom-header-clear', function () {
    favoriteHeaders = [];
    $(document).trigger('init-favorite-headers-dropdown-items', true);
    $('.di-favorite-header, .di-favorite-divider').remove();
    toastr.success(browser.i18n.getMessage("jsRequestHeaderCleared"));
  });

  $(document).on('click', '.btn-remove-header', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var badge = $(this).parents('.badge');
    if ($('.btn-remove-header').length == 1) {
      $('.div-request-headers').addClass('animated zoomOutRight');
      setTimeout(function () {
        badge.remove();
        $('.div-request-headers').hide();
        $('.div-request-headers').removeClass('animated zoomOutRight');
      }, 750);
    }
    else {
      badge.removeClass('animated zoomIn');
      badge.addClass('animated zoomOutRight');
      setTimeout(function () {
        badge.remove();
      }, 750);
    }
  });

  $(document).on('click', '.btn-remove-all-headers', function () {
    $('.div-request-headers').addClass('animated zoomOutRight');
    setTimeout(function () {
      $('.list-request-headers').empty();
      $('.div-request-headers').hide();
      $('.div-request-headers').removeClass('animated zoomOutRight');
    }, 750);
  });

  $(document).on('append-request-header', function (e, name, value,
    favorite, source, className, data) {
    console.log('append request: ' + name + ',' + value);
    if (!className) {
      className = 'custom';
    }
    var closer = $('<a href="javascript:;" class="btn-remove-header">x</a>');
    var el = $('<span class="badge badge-default p-2"></span>')
      .addClass(className)
      .text(name + ': ' + value)
      .append(closer)
      .data('name', name)
      .data('value', value)
      .data('favorite', favorite);
    if (data) {
      el.data('data', data)
    }
    if (source) {
      source.replaceWith(el);
    }
    else {
      if ($('.btn-remove-header').length == 0) {
        $('.list-request-headers').append(el);
        $('.div-request-headers').show();
        $('.div-request-headers').addClass('animated zoomInLeft');
        setTimeout(function () {
          $('.div-request-headers').removeClass('animated zoomInLeft');
        }, 750);
      }
      else {
        $('.list-request-headers').append(el.addClass('animated zoomIn'));
      }
    }
  });

  $(document).on('click', '.di-favorite-header', function () {
    var name = $(this).data('name');
    var value = $(this).data('value');
    var favorite = true;
    $(document).trigger('append-request-header', [name, value, favorite]);
  });

  $(document).on('click', '.list-request-headers .badge.custom', function () {
    var name = $(this).data('name');
    var value = $(this).data('value');
    var favorite = $(this).data('favorite');
    $('#request-header-name').typeahead('val', name);
    $(document).trigger('update-request-header-value-typeahead', name);
    $('#request-header-value').typeahead('val', value);
    if (favorite) {
      $('#save-request-header-favorite').attr('checked', true).prop('checked', true);
    }
    else {
      $('#save-request-header-favorite').removeAttr('checked').prop('checked', false);
    }
    $('#modal-header').data('source', $(this)).modal('show');
  });
  
  var requestHeaderNames = _.keys(requestHeaders);
  console.log(requestHeaderNames);
  var thNames = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: requestHeaderNames
  });

  // init typeahead for request name
  var thValues = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: []
  });
  $('#request-header-value').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  },
    {
      name: 'values',
      source: thValues
    });

  $('#request-header-name').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  },
    {
      name: 'names',
      source: thNames
    }).on('typeahead:select typeahead:autocomplete', function (src, name) {
      $(document).trigger('update-request-header-value-typeahead', name);
    });

  $(document).on('update-request-header-value-typeahead', function (e, name) {
    try { $('#request-header-value').typeahead('destroy'); } catch (e) { }
    var values = [];
    if (name && typeof requestHeaders[name] != 'undefined') {
      values = requestHeaders[name];
    }
    var thValues = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: values
    });
    $('#request-header-value').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
      {
        name: 'values',
        source: thValues
      });
  });
  /********************** Init Request Body **************************/

  $(document).on('modal-form-data-row-changed', function () {
    if ($('#modal-form-data .btn-minus').length == 1) {
      $('#modal-form-data .btn-minus').prop('disabled', true);
    }
    else {
      $('#modal-form-data .btn-minus').prop('disabled', false);
    }
  }).trigger('modal-form-data-row-changed');

  $(document).on('focus', '#modal-form-data input', function () {
    $(this).select();
  });

  $(document).on('click', '#modal-form-data .btn-minus', function () {
    $(this).parents('.row').remove();
    $(document).trigger('modal-form-data-row-changed');
  });

  $(document).on('click', '#modal-form-data .btn-plus', function () {
    var row = $(this).parents('.row').clone();
    row.find('input[name="name"]').val($(this).parents('.row').find('input[name="name"]').val());
    row.find('input[name="value"]').val($(this).parents('.row').find('input[name="value"]').val());
    row.insertAfter($(this).parents('.row'));
    $(document).trigger('modal-form-data-row-changed');
  });

  $(document).on('click', '#modal-form-data .btn-update-form-data', function (e) {
    e.preventDefault();
    var params = [];
    _.each($('#modal-form-data .modal-body .row'), function (item) {
      var name = $(item).find('[name="name"]').val();
      var value = $(item).find('[name="value"]').val();
      console.log(item);
      params.push({ name: name, value: value });
    });

    $('#modal-form-data').modal('hide');
    if (params.length > 0) {
      $('#request-body').val($.param(params)).data('form-data', params);
      $('.btn-form-data').addClass('active');
    }
    else {
      $('#request-body').val('').removeData('form-data');
      $('.btn-form-data').removeClass('active');
    }
  });

  $('#modal-form-data').on('show.bs.modal', function (e) {
    var row = $('#modal-form-data .row:first-child')[0];
    $('#modal-form-data .modal-body').empty();
    var template = $(row).clone();
    template.find('[name="name"]').val('');
    template.find('[name="value"]').val('');
    var data = $('#request-body').data('form-data');
    if (data && data.length > 0) {
      _.each(data, function (item) {
        var newRow = template.clone();
        newRow.find('[name="name"]').val(item.name);
        newRow.find('[name="value"]').val(item.value);
        $('#modal-form-data .modal-body').append(newRow);
      });
    }
    else {
      $('#modal-form-data .modal-body').append(template);
    }
    $(document).trigger('modal-form-data-row-changed');
  });

  $(document).on('change', '#request-body', function (e) {
    $('#request-body').removeData('form-data');
    $('.btn-form-data').removeClass('active');
  });
  $(document).on('input', '#request-body', function (e) {
    $('#request-body').css('height', '1px');
    var height = (25 + $('#request-body').prop("scrollHeight"));
    height = (height < 140) ? 140 : height;
    $('#request-body').css('height', height + 'px');
  });
});