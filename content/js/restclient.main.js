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

restclient.main = {
  headerLabelMaxLength: 35,
  headerMenuMaxLength: 25,
  uniqueHeaders: ['authorization'],
  navTop: null,
  init: function() {
    restclient.init();
    
    restclient.main.navTop = $('.subnav').length && $('.subnav').offset().top - $('.navbar').first().height();
    $(window).on('scroll', restclient.main.processScroll).scroll();
    
    $('.modal .btnClose').live('click', function(){
      $(this).parents('.modal').modal('hide');
      return false;
    });
    
    this.initModal();
    this.updateFavoriteHeadersMenu();
    this.updateFavoriteRequestMenu();
    
    $('#request-button').bind('click',function(){
      var request = restclient.main.getRequest();
      restclient.http.sendRequest(request.method, request.url, request.headers, request.overrideMimeType, request.body);
    });
    $('#request-url').bind('keypress', function(evt){
      if(evt.keyCode == 13) {
        $('#request-button').click();
        return false;
      }
    }).focus().select();
    if ($('#overrideMimeType').attr('checked') == 'checked')
      $('.overrideMimeType').show();
      
    $('[name="saved-request-name"]').bind('keypress', function(){
      if($(this).val() == $('#modal-save-request .btnOkay').attr('request-name') ) {
        $('#modal-save-request .btnOkay').attr('overwrite', '1').val('Overwrite'); 
      }
      else 
      {
        $('#modal-save-request .btnOkay').attr('overwrite', '0').val('Save'); 
      }
    });
    
    $('#window-manage-request .btnClose').bind('click', function(){
      $('#window-manage-request').hide();
    });
  },
  processScroll: function () {
    var scrollTop = $(window).scrollTop();
        
    if (scrollTop >= restclient.main.navTop && !$('.subnav').hasClass('subnav-fixed'))
      $('.subnav').addClass('subnav-fixed')
    else
      if (scrollTop <= restclient.main.navTop && $('.subnav').hasClass('subnav-fixed'))
        $('.subnav').removeClass('subnav-fixed');
  },
  initModal: function() {
    $('#modal-basic-authorization').on('show', function(){
      var user = '', pass = '', checked = false, 
          basicAuth = restclient.getPref('basicAuth', "");
      if(typeof basicAuth === "string" && basicAuth != "") {
        basicAuth = JSON.parse(basicAuth);
        user = basicAuth.user,
        pass = basicAuth.pass,
        checked = true;
      }

      $("#modal-basic-authorization [name='username']").val(user);
      $("#modal-basic-authorization [name='password']").val(pass);
      if ( checked ) {
        $("#modal-basic-authorization [name='remember']").attr('checked', true);
      }
      else {
        $("#modal-basic-authorization [name='remember']").removeAttr('checked');
      }
    });
    
    $('#modal-custom-header').on('show',  function(){
      var inputName = $('#modal-custom-header [name="name"]'),
          inputValue = $('#modal-custom-header [name="value"]'),
          headerNames = [];
      
      var source = $(this).data('source');
      //console.log(header);
      if(source) {
        inputName.val(source.attr("header-name"));
        inputValue.val(source.attr("header-value"));
      }
      
      for ( var name in restclient.headers ) {
        headerNames.push(name);
      }
      //console.log(headerNames);
      inputName.attr("data-source", JSON.stringify(headerNames));
      inputName.bind('keypress', function(){
        var name = $(this).val();
        //console.log(name);
        if(name != '' && typeof(restclient.headers[name]) == 'object')
          inputValue.attr("data-source", JSON.stringify(restclient.headers[name]));
      }).keypress();
    }).on('shown', function(){
      $('#modal-custom-header [name="name"]').focus();
      $('#modal-custom-header [name="value"]').bind('focus', function() {
        $(this).select();
      });
      $('#modal-custom-header [name="remember"]').removeAttr('checked');
    }).on('hidden', function(){
      $(this).data('source', null);
    });
    
    $('#modal-save-request').on('show', function(){
      var savedRequest = restclient.getPref('savedRequest', '');
      $('[name="saved-request-name"]').val('');
      if(savedRequest != '') {
        savedRequest = JSON.parse(savedRequest);
        var names = [];
        for(var name in savedRequest) {
          if(!savedRequest.hasOwnProperty(name))
            continue;
          names.push(name);
        }
        $('[name="saved-request-name"]').attr('data-source', JSON.stringify(names));
        $('#modal-save-request .btnOkay').val('Save').attr('overwrite', '0').removeAttr('request-name');
      }
    });
  },
  showModal: function(modalId) {
    $('#' + modalId).modal('show').on('shown', function(){
      $(this).find('input').first().focus();
    });
    return false;
  },
  addBasicAuthorization: function() {
    var username = $("#modal-basic-authorization [name='username']"),
        password = $("#modal-basic-authorization [name='password']");
    if(username.val() == '') {
      username.next().text('Please input the username for authorization').show();
      username.focus();
      return false;
    }
    if(password.val() == '') {
      password.next().text('Please input the password for authorization').show();
      password.focus();
      return false;
    }
    var strValue = "Basic " + username.val() + ":" + password.val(),
        strBase64 = btoa(strValue).replace(/.{76}(?=.)/g,'$&\n');
    
    restclient.main.addHttpRequestHeader('Authorization', strBase64);
    if( $("#modal-basic-authorization [name='remember']").attr('checked') === 'checked') {
      var basicAuth = JSON.stringify({'user': username.val(), 'pass': password.val()});
      //console.log(basicAuth);
      restclient.setPref("basicAuth", basicAuth);
    }
    else {
      restclient.setPref("basicAuth", "");
    }
    $("#modal-basic-authorization").modal('hide');
  },
  removeHttpRequestHeaderByName: function(name) {
    $('#request-headers span.label').each(function(){
      var header = $(this).text();
      if(header.indexOf(':') == -1)
        return false;
      var headerName = header.substr(0, header.indexOf(':'));
      if(headerName.toLowerCase() == name.toLowerCase())
        $(this).remove();
    });
  },
  removeHttpRequestHeader: function(evt) {
    evt.preventDefault();
    $(this).parent('span').remove();
    if( $('#request-headers span.label').length == 0 ) {
      $('#request-headers').hide();
    }
    return false;
  },
  removeHttpRequestHeaders: function(){
    $('#request-headers span.label').remove();
    if( $('#request-headers span.label').length == 0 ) {
      $('#request-headers').hide();
    }
  },
  editHttpRequestHeader: function() {
    
  },
  addHttpRequestHeader: function(name, value) {
    if(this.uniqueHeaders.indexOf(name.toLowerCase()) >= 0)
      restclient.main.removeHttpRequestHeaderByName(name);
   
   var text = name + ": " + value;
   
   if (text.length > restclient.main.headerLabelMaxLength)
     text = text.substr(0, restclient.main.headerLabelMaxLength - 3) + "...";
    var span = $('<span />').addClass('label').text(text)
              .attr("title", name + ": " + value)
              .attr('header-name', name)
              .attr('header-value', value)
              .bind('click', function(){
                $('#modal-custom-header').data('source', $(this));
                $('#modal-custom-header').modal('show');
              })
              .append($('<a />').addClass('close').text('×').bind('click', restclient.main.removeHttpRequestHeader));
    span.bind('click', restclient.main.editHttpRequestHeader);
    $('#request-headers').append(span);
    
    if( $('#request-headers span.label').length > 0 ) {
      $('#request-headers').show();
    }
  },
  addCustomHeader: function() {
    var remember = $('#modal-custom-header [name="remember"]'),
        inputName = $('#modal-custom-header [name="name"]'),
        inputValue = $('#modal-custom-header [name="value"]');
    if(remember.attr('checked') == 'checked') {
      var favoriteHeaders = restclient.getPref('favoriteHeaders', '');
      if(favoriteHeaders == '')
        favoriteHeaders = [];
      else
        favoriteHeaders = JSON.parse(favoriteHeaders);
      
      var favorited = false;
      for(var i=0, header; header = favoriteHeaders[i]; i++) {
        if(header[0].toLowerCase() == inputName.val().toLowerCase() 
          && header[1].toLowerCase() == inputValue.val().toLowerCase()) {
          favorited = true;
          break;
        }
      }
      if(!favorited) {
        favoriteHeaders.push([inputName.val(), inputValue.val()]);
        restclient.setPref('favoriteHeaders', JSON.stringify(favoriteHeaders));
        restclient.main.updateFavoriteHeadersMenu();
      }
    }
    var source = $('#modal-custom-header').data('source');
    if(!source)
      this.addHttpRequestHeader(inputName.val(), inputValue.val());
    else
    {
      var text = inputName.val() + ": " + inputValue.val();
      if(text.length > restclient.main.headerLabelMaxLength)
         text = text.substr(0, restclient.main.headerLabelMaxLength-3) + "...";
      source.attr('header-name', inputName.val()).attr('header-value', inputValue.val())
      .attr("title", inputName.val() + ": " + inputValue.val())
      .text(text);
    }
    $('#modal-custom-header').modal('hide');
  },
  updateFavoriteHeadersMenu: function() {
    $('ul.headers .favorite').remove();
    var favoriteHeaders = restclient.getPref('favoriteHeaders', '');
    if(favoriteHeaders == '')
      return false;
    else
      favoriteHeaders = JSON.parse(favoriteHeaders);
    for(var i=0, header; header = favoriteHeaders[i]; i++) {
      var text = header[0] + ": " + header[1];
      
      if (text.length > restclient.main.headerMenuMaxLength)
        text = text.substr(0, restclient.main.headerMenuMaxLength -3) + "...";
      var a =   $('<a class="favorite" href="#"></a>').text(text)
        .attr('header-name', header[0])
        .attr('header-value', header[1]);
      $('.custom-header').after($('<li></li>').append(a));
    }
    $('.headers a.favorite').bind('click', function(evt) {
      restclient.main.addHttpRequestHeader($(this).attr('header-name'), $(this).attr('header-value'));
      evt.preventDefault();
    })
    $('.custom-header').after($('<li class="divider favorite"></li>'));
  },
  clearFavoriteHeaders: function() {
    restclient.setPref('favoriteHeaders', '');
    this.updateFavoriteHeadersMenu();
  },
  getRequest: function() {
    var request = {};
        request.method = $('#request-method').val();
        request.url = $('#request-url').val();
        request.body = $('#request-body').val();
        request.overrideMimeType = ($('#overrideMimeType').attr('checked') == 'checked') ? $('#overrideMimeType').val() : false;
    var headers = [];
    $('#request-headers .label').each(function(){
      headers.push([$(this).attr('header-name'), $(this).attr('header-value')]);
    });
    request.headers = headers;
    return request;
  },
  setResponseHeader: function(headers, line) {
    console.log(headers);
    if(!headers) {
      $('#response-headers pre').text('');
      return false;
    }
    if(typeof line === 'boolean' && line == false) {
      var text = "";
      for(var i=0, header; header = headers[i]; i++) {
        text += header.join(" ") + "\n";
      }
      $('#response-headers pre').text(text);
    }
    else
    {
      var ol = $('<ol class="linenums"></ol>');
      for(var i=0, header; header = headers[i]; i++) {
        ol.append($('<li></li>').append(
          $('<span class="header-name"></span>').text(header[0])
        )
        .append(
          $('<span class="header-split"></span>').text(': ')
        )
        .append(
          $('<span class="header-value"></span>').text(header[1])
        )
        );
      }
      $('#response-headers pre').empty().append(ol);
    }
  },
  updateProgressBar: function(idx, status) {
    if(idx > 0 && idx <=100)
    {
      $('.mainOverlay').show();
      $('.mainOverlay .bar').css('width', idx + "%");
    }
    else
    {
      $('.mainOverlay').hide();
      $('.mainOverlay .bar').css('width', "0%");
    }
    if(status) {
      $('.mainOverlay .status').text(status);
    }
  },
  showResponse: function() {
    
    $("#response").show();
      
    //document.getElementById('response').scrollIntoView(true);
    var top = $("#response").offset().top;
    //
    //alert(top);
    document.getElementById('response').scrollIntoView(true);
    //$('html, body').animate({scrollTop: top}, 1000);
    return false;
  },
  clearResult: function() {
    $('.nav-tabs [href="#response-body-preview"]').hide();
    $('.nav-tabs [href="#response-body-highlight"]').hide();
    $('.nav-tabs li').removeClass('active');
    $('.nav-tabs li').first().addClass('active');
    
    $("#response-body-preview div.pre").html('');
    $('#response-body-raw pre').text('');
    $('#response-body-highlight pre').text('');
    restclient.main.setResponseHeader();
    $('[href="#response-headers"]').click();
  },
  checkMimeType: function(){
    var contentType = this.xhr.getResponseHeader("Content-Type");
    if (contentType.indexOf('image') >= 0) {
      if(this.mimeType === false && $('#alertOverrideMimeType').length > 0)
        $('#alertOverrideMimeType').show();
    }
    else
      if(this.mimeType !== false && $('#alertUnOverrideMimeType').length > 0)
        $('#alertUnOverrideMimeType').show();
  },
  display: function() {
    var responseData = this.xhr.responseText;
    $('#response-body-raw pre').text(responseData);
  },
  displayHtml: function() {
    var responseData = this.xhr.responseText,
        iframe = $("<iframe></firame>")
          .attr("type", "content")
          .attr("src", "data:text/html," + encodeURIComponent(responseData));
    
    $("#response-body-preview div.pre").append(iframe);
    
    $('#response-body-raw pre').text(responseData);
    $('#response-body-highlight pre').text(responseData);
    
    $('.nav-tabs [href="#response-body-preview"]').show();
    $('.nav-tabs [href="#response-body-highlight"]').show();
  },
  displayXml: function() {
    var responseData = this.xhr.responseText,
        iframe = $("<iframe></firame>")
          .attr("type", "content")
          .attr("src", "data:text/xml," + encodeURIComponent(responseData));
    
    $("#response-body-preview div.pre").append(iframe);
    $('#response-body-raw pre').text(responseData);
    $('#response-body-highlight pre').text(responseData);
    
    $('.nav-tabs [href="#response-body-preview"]').show();
    $('.nav-tabs [href="#response-body-highlight"]').show();
  },
  displayJson: function() {
    var responseData = this.xhr.responseText;
    
    $('#response-body-raw pre').text(responseData);
    var reformatted = responseData;
    try{
      reformatted = JSON.stringify(JSON.parse(responseData), null, "  ");
    }catch(e) {}
    $('#response-body-highlight pre').text(reformatted);
    
    $('.nav-tabs [href="#response-body-highlight"]').show();
  },
  displayImage: function() {
    var responseData = this.xhr.responseText,
        contentType = this.xhr.getResponseHeader("Content-Type");
    var toConvert = "";
    for(var i = 0; i < responseData.length; i++){
      toConvert += String.fromCharCode(responseData.charCodeAt(i) & 0xff);
    }
    var base64encoded = btoa(toConvert);
    var imgSrc = "data:" + contentType + ";base64," + base64encoded;
    /*var base64encoded = restclient.base64(responseData),
        imgSrc = "data:" + contentType + ";base64," + base64encoded,*/
    var image = $("<img>").attr("src", imgSrc);
    
    $("#response-body-preview div.pre").append(image);
    $('#response-body-raw pre').text(imgSrc);
    
    $('.nav-tabs [href="#response-body-preview"]').show();
  },
  displayImageRaw: function() {
    var responseData = this.xhr.responseText,
        contentType = this.xhr.getResponseHeader("Content-Type");

    $('#response-body-raw pre').text(responseData);
  },
  saveCurrentRequest: function() {
    var name = $('[name="saved-request-name"]');
    if(name.val() == '') {
      name.next().text('Please give this request a name for future usage.').show();
      name.focus();
      return false;
    }
    var savedRequest = restclient.getPref('savedRequest', '');
    if(savedRequest != '')
    {
      //console.log(savedRequest);
      savedRequest = JSON.parse(savedRequest);
      //console.log(typeof savedRequest[name.val()]);
      if(typeof $('#modal-save-request .btnOkay').attr('request-name') == 'undefined' &&
              typeof savedRequest[name.val()] != 'undefined') {
        name.next().text('Name existed, you can either change a name or overwrite it.').show();
        $('#modal-save-request .btnOkay').val('Overwrite').attr('overwrite', '1').attr('request-name', name.val());
        name.focus();
        return false;
      }
    }
    else
      savedRequest = {};
    
    var request = restclient.main.getRequest();
    savedRequest[name.val()] = request;
    restclient.setPref('savedRequest', JSON.stringify(savedRequest));
    $('#modal-save-request').modal('hide');
    this.updateFavoriteRequestMenu();
    $('.request-menu').click();
  },
  updateFavoriteRequestMenu: function() {
    $('ul.savedRequest .favorite').remove();
    var savedRequest = restclient.getPref('savedRequest', '');
    if(savedRequest == '')
      return false;
    else
      savedRequest = JSON.parse(savedRequest);
    
    for(var name in savedRequest) {
      if(!savedRequest.hasOwnProperty(name))
        continue;
      if (name.length > restclient.main.requestMenuMaxLength)
        name = name.substr(0, restclient.main.requestMenuMaxLength -3) + "...";
      
      var a =   $('<a class="favorite" href="#"></a>').text(name)
        .data('request', savedRequest[name])
        .data('request-name', name);
      $('.savedRequest').prepend($('<li></li>').append(a));
    }
    if( $('.savedRequest a.favorite').length > 0 )
      $('li.manage-request').show();
    else
      $('li.manage-request').hide();
      
    $('.savedRequest a.favorite').bind('click', function(evt) {
      restclient.main.applyFavoriteRequest($(this).data('request-name'));
      evt.preventDefault();
    })
    $('.savedRequest .favorite:last').after($('<li class="divider favorite"></li>'));
  },
  overrideMimeType: function() {
    $('label.overrideMimeType').show().find('input').attr('checked', true);
    $('#request-button').click();
    $('#alertOverrideMimeType').alert('close');
  },
  unOverrideMimeType: function() {
    $('label.overrideMimeType').show().find('input').removeAttr('checked');
    $('#request-button').click();
    $('#alertUnOverrideMimeType').alert('close');
  },
  importFavoriteRequests: function() {
    var nsIFilePicker = Components.interfaces.nsIFilePicker,
        fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Please select a exported JSON file to import", nsIFilePicker.modeOpen);
    fp.appendFilter("JSON","*.json");
    var res = fp.show();
    if (res == nsIFilePicker.returnOK) {

      restclient.NetUtil.asyncFetch(fp.file, function(inputStream, status) {
        if (!Components.isSuccessCode(status)) {
          alert('Cannot import the json file.');
          return;
        }
        
        var data = restclient.NetUtil.readInputStreamToString(inputStream, inputStream.available());
        
        var utf8Converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"].  
            getService(Components.interfaces.nsIUTF8ConverterService);
        var setting = utf8Converter.convertURISpecToUTF8(data, "UTF-8");
        try{
          if(setting == '') {
            alert('This is an empty file.');
            return;
          }
          restclient.setPref('savedRequest', setting);
        }catch(e){ alert('Cannot import the json file.'); }
      });
    }
    restclient.main.updateFavoriteRequestMenu();
    alert('import requests succeed');
    return false;
  },
  exportFavoriteRequests: function() {
    var savedRequest = restclient.getPref('savedRequest', ''),
        nsIFilePicker = Components.interfaces.nsIFilePicker,
        fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Please select a export directory", nsIFilePicker.modeSave);
    fp.appendFilter("JSON","*.json");
    var res = fp.show();
    if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace) {
      var ostream = restclient.FileUtils.openSafeFileOutputStream(fp.file),
          converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                      createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
      converter.charset = "UTF-8";
      var istream = converter.convertToInputStream(savedRequest);

      restclient.NetUtil.asyncCopy(istream, ostream, function(status) {
        if (!Components.isSuccessCode(status)) {
          alert('cannotExportJSONError');
          return;
        }
      });
    }
    return false;
  },
  manageFavoriteRequests: function(){
    $('#favorite-request-list .accordion-group').remove();
    var favoriteRequest = restclient.getPref('savedRequest', '');
    if(favoriteRequest != '') {
      favoriteRequest = JSON.parse(favoriteRequest);
      var i = 0;
      for(var name in favoriteRequest) {
        if(!favoriteRequest.hasOwnProperty(name))
          continue;
        
        var html = this.getFavoriteRequestHtml("favorite-request-" + (++i), name, favoriteRequest[name]);
        $('#favorite-request-list').append(html);
      }
    }
    
    $('#window-manage-request').show();
    
  },
  getFavoriteRequestHtml: function(id, name, request) {
    var group = $('<div class="accordion-group"></div>'),
      heading = $('<div class="accordion-heading"></div>')
                  .append(
                    $('<a class="accordion-toggle" data-toggle="collapse" data-parent="#favorite-request-list"></a>').attr('href', '#' + id)
                    .text(name)
                  ),
      body = $('<div class="accordion-body collapse"></div>').attr('id', id),
      inner = $('<div class="accordion-inner"></div>');
    
    inner.append($('<h5></h5>').text('Request'));
    inner.append($('<p></p>').text(request.method + ' ' + request.url));
    var ul = $('<ul></ul>');
    if(request.overrideMimeType)
      ul.append( $('<li class="overrideMimeType"></li>').text('overrideMimeType: ' + request.overrideMimeType) );
    for(var i=0, header; header = request.headers[i]; i++) {
      ul.append( $('<li></li>').text(header[0] + ': ' + header[1]) );
    }
    inner.append(ul);
    inner.append($('<h5></h5>').text('Body'));
    inner.append($('<div class="body pre-scrollable"></div>').text(request.body));
    
    var buttons = $('<div class="buttons"></div>');
    buttons.append($('<button class="btn btn-success"></button>').text('Apply this request').bind('click', function(){
      restclient.main.applyFavoriteRequest(name);
      $('#window-manage-request').hide();
    }));
    buttons.append($('<button class="btn btn-danger"></button>').text('Remove from favorite').bind('click', function(){
      var result = restclient.main.removeFavoriteRequest(name);
      if(result) {
        $(this).parents('div.accordion-group').hide().remove();
        restclient.main.updateFavoriteRequestMenu();
      }
    }));
    
    inner.append(buttons);
    body.append(inner);
    
    group.append(heading).append(body);
    
    return group;
  },
  removeFavoriteRequest: function(name) {
    var favorites = restclient.getPref('savedRequest', '');
    if(favorites == '')
      return false;
    favorites = JSON.parse(favorites);
    if(name in favorites) {
      delete favorites[name];
      restclient.setPref('savedRequest', JSON.stringify(favorites));
      return true;
    }
    return false;
  },
  applyFavoriteRequest: function(name) {
    var favorites = restclient.getPref('savedRequest', '');
    if(favorites == '')
      return false;
    favorites = JSON.parse(favorites);
    if(name in favorites) {
      var request = favorites[name];
      if(request.method) {
        $('#request-method option[value="' + request.method + '"]').attr('selected', true);
      }
      else
        $('#request-method option[value="GET"]').attr('selected', true);
        
      if(request.url) {
        $('#request-url').val(request.url);
      }
      else
        $('#request-url').val('');
        
      if(request.overrideMimeType) {
        $('#overrideMimeType').attr('checked', true);
        $('.overrideMimeType').show();
      }
      else
        $('#overrideMimeType').removeAttr('checked');
      
      if(request.body) {
        $('#request-body').val(request.body);
      }
      else
        $('#request-body').val('');
        
      if(request.headers) {
        restclient.main.removeHttpRequestHeaders();
        //console.log(request.headers);
        for(var i = 0, header; header = request.headers[i]; i++) {
          restclient.main.addHttpRequestHeader(header[0], header[1]);
        }
      }
      return true;
    }
    return false;
  }
};

window.addEventListener("load", function(){ restclient.main.init();  }, false);
window.addEventListener("unload", function(){ }, false);
