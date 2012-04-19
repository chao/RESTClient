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
  hotkey: {
    send:     's',
    url:      'u',
    method:   'm',
    reqBody:  'b',
    rep1:     '1',
    rep2:     '2',
    rep3:     '3',
    rep4:     '4',
    toggleRequest: 'alt+q',
    toggleResponse: 'alt+s'
  },
  init: function() {
    restclient.init();
    this.initSkin();
    $(window).resize(restclient.main.resizeRequestForm).resize();

    restclient.main.navTop = $('.subnav').length && $('.subnav').offset().top - $('.navbar').first().height();
    $(window).on('scroll', restclient.main.processScroll).scroll();

    $('.modal .btnClose').live('click', function(){
      $(this).parents('.modal').modal('hide');
      return false;
    });

    this.initHotKeys();
    this.initModal();
    this.initOAuthWindow();
    this.initRequestMethod();
    this.initRequestUrl();
    this.updateFavoriteHeadersMenu();
    this.updateFavoriteRequestMenu();


    $('#request-button').bind('click', restclient.main.sendRequest);
    $('#request-url').bind('keyup', restclient.main.requestUrlInputed).focus().select();
    $('#request-url').bind('change', restclient.main.updateFavoriteUrlIcon);

    if ($('#overrideMimeType').attr('checked') == 'checked')
      $('.overrideMimeType').show();

    $('[name="saved-request-name"]').bind('keyup', function(){
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

    $('input, textarea').focus(function(){
      $(this).select();
    });

    $('.favorite-icon').click(restclient.main.favoriteUrl);
    $('.toggle-request').click(restclient.main.toggleRequest);
    $('.toggle-response').click(restclient.main.toggleResponse);
  },
  changeSkin: function(cssFileName) {
    $("link").remove();
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/" + cssFileName
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/bootstrap-responsive.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/restclient.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/XMLPrettyPrint.css"
    }).appendTo("head");
    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
       href: "css/prettify.css"
    }).appendTo("head");
    setTimeout(function(){ restclient.main.resizeRequestForm(); }, 1000);
  },
  initSkin: function(){
    var defaultCSS = restclient.getPref('defaultSkin', 'bootstrap.simplex.css');
    restclient.main.changeSkin(defaultCSS);
    $('a[css]').click(function(){
      restclient.main.changeSkin($(this).attr('css'));
      restclient.getPref('defaultSkin', $(this).attr('css'));
      return false;
    });
    //wait for css load
    setTimeout(function(){ $('.showForStartup').show(); }, 200);
  },
  initHotKeys: function() {
    $('#request-button').attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.send);
    $(document).bind('keydown', restclient.main.hotkey.send, function(){
      $('#request-button').click();
      return false;
    });

    $('#request-url').attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.url);
    $(document).bind('keydown', restclient.main.hotkey.url, function(){
      $('#request-url').focus().select();
      return false;
    });

    $('.request-method-dropdown a.dropdown-toggle').attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.method);
    $(document).bind('keydown', restclient.main.hotkey.method, function(){
      $('.request-method-dropdown a.dropdown-toggle').click();
      return false;
    });

    $('#request-body').attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.reqBody);
    $(document).bind('keydown', restclient.main.hotkey.reqBody, function(){
      $('#request-body').focus().select();
      return false;
    });

    $('.nav-tabs li a').eq(0).attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.rep1);
    $(document).bind('keydown', restclient.main.hotkey.rep1, function(){
      $('.nav-tabs li a').eq(0).click();
      return false;
    });

    $('.nav-tabs li a').eq(1).attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.rep2);
    $(document).bind('keydown', restclient.main.hotkey.rep2, function(){
      $('.nav-tabs li a').eq(1).click();
      return false;
    });

    $('.nav-tabs li a').eq(2).attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.rep3);
    $(document).bind('keydown', restclient.main.hotkey.rep3, function(){
        $('.nav-tabs li a').eq(2).click();
    });

    $('.nav-tabs li a').eq(3).attr('rel','tooltip').attr('title', 'hotkey: ' + restclient.main.hotkey.rep4);
    $(document).bind('keydown', restclient.main.hotkey.rep4, function(){
        $('.nav-tabs li a').eq(3).click();
    });

    $(document).bind('keydown', restclient.main.hotkey.toggleRequest, function(){
      restclient.main.toggleRequest();
      return false;
    });
    $(document).bind('keydown', restclient.main.hotkey.toggleResponse, function(){
      restclient.main.toggleResponse();
      return false;
    });
  },
  resizeRequestForm: function() {
    var formWidth = $('#request form').innerWidth(),
        labelWidth = 0,
        buttonWidth = $('#request-button').outerWidth(true),
        spanWidth = $('.request-method-dropdown').outerWidth(true) + $('.request-url-icons').outerWidth(true),
        urlIconsWidth = $('.request-url-icons').outerWidth(true);
    $('#request form label').each(function(){
      labelWidth += $(this).outerWidth(true);
    });
    if(formWidth < 684)
      $('#request-url').width(formWidth - (labelWidth + buttonWidth + spanWidth) -80);

    $('#request-url-list').width($('#request-url').outerWidth(true) + urlIconsWidth-7);

    if(formWidth >= 684)
      $('#request-url').css('width', '');
  },
  toggleRequest: function(e) {
    var toggle = $('.toggle-request');
    $('#request-container').slideToggle('slow', function() {
        toggle.text(toggle.text() == '-' ? '+' : '-');
    });
    if(e) e.preventDefault();
    return false;
  },
  toggleResponse: function(e) {
    var toggle = $('.toggle-response');
    $('#response-container').slideToggle('slow', function() {
        toggle.text(toggle.text() == '-' ? '+' : '-');
    });
    if(e) e.preventDefault();
    return false;
  },
  toggleExpander: function(e){
    var toggle = $(this),
        content = toggle.next().find('.expander-content').first();
    //console.log(toggle.text());
    //console.log(content);

    content.slideToggle('slow', function() {
      toggle.text(toggle.text() == '+' ? '-' : '+');
      /*  content.after($())
        if(!content.data('origin-data')){
          content.data('origin-data', content.html());
          content.text('...').show();
        }
        else
        {
          content.html(content.data('origin-data'));
          content.data('origin-data', null);
        }*/
    });
    if(e) e.preventDefault();
    return false;
  },
  initRequestUrl: function() {
    var urls = restclient.main.getCachedUrls();
    $('#request-url-list li').remove();
    for(var i=0, url; url = urls[i]; i++) {
      $('#request-url-list').append($('<li></li>').data('url', url).append($('<a></a>').text(url)));
    }
    $('#request-url-list li').click(function(){
      $('#request-url').val($(this).data('url'));
      restclient.main.updateFavoriteUrlIcon();
    });
  },
  getCachedUrls: function() {
    if(restclient.main.cachedUrls)
      return restclient.main.cachedUrls;
    var urls = restclient.getPref('cachedUrls', '');
    if(urls == '')
      return [];
    else{
      restclient.main.cachedUrls = JSON.parse(urls);
      return restclient.main.cachedUrls;
    }
  },
  saveUrlToCache: function(url){
    var urls = restclient.main.getCachedUrls();
    if(urls.indexOf(url) !== -1)
      return false;
    urls.push(url);
    restclient.setPref('cachedUrls', JSON.stringify(urls));
    restclient.main.cachedUrls = null;
    restclient.main.initRequestUrl();
    return false;
  },
  removeUrlFromCache: function(url){
    var urls = restclient.main.getCachedUrls();
    var pos = urls.indexOf(url);
    if(pos === -1)
      return true;
    urls = urls.slice(0,pos).concat( urls.slice(pos+1) );
    restclient.setPref('cachedUrls', JSON.stringify(urls));
    restclient.main.cachedUrls = null;
    restclient.main.initRequestUrl();
  },
  updateFavoriteUrlIcon: function(url) {
    var url = (typeof url == 'string') ? url : $('#request-url').val();
    //console.log(url);
    var urls = restclient.main.getCachedUrls();

    //console.log(urls.indexOf(url));
    if(urls.indexOf(url) > -1)
      $('.favorite-icon').removeClass('icon-star-empty').addClass('icon-star');
    else
      $('.favorite-icon').addClass('icon-star-empty').removeClass('icon-star');
  },
  favoriteUrl: function(){
    var url = $('#request-url').val();
    if(url == '')
      return false;
    if($('.favorite-icon').hasClass('icon-star-empty'))
    {
      restclient.main.saveUrlToCache(url);
      $(this).removeClass('icon-star-empty').addClass('icon-star');
    }
    else
    {
      restclient.main.removeUrlFromCache(url);
      $(this).addClass('icon-star-empty').removeClass('icon-star');
    }
  },
  requestUrlInputed: function(evt) {
    if(evt.keyCode == 13) {
      $('#request-button').click();
      return false;
    }
    else{
      var url = $(this).val();// + String.fromCharCode(evt.keyCode);
      //console.log(url);
      restclient.main.updateFavoriteUrlIcon(url);
    }

  },
  processScroll: function () {
    var scrollTop = $(window).scrollTop();

    if (scrollTop >= restclient.main.navTop && !$('.subnav').hasClass('subnav-fixed'))
      $('.subnav').addClass('subnav-fixed')
    else
      if (scrollTop <= restclient.main.navTop && $('.subnav').hasClass('subnav-fixed'))
        $('.subnav').removeClass('subnav-fixed');
  },
  initRequestMethod: function() {
    $('#request-method').attr('data-source', JSON.stringify(restclient.http.methods));

    for(var i=0, m; m = restclient.http.methods[i]; i++)
    {
      $('#request-method-list').append($('<li></li>').append(
          $('<a></a>').text(m)
        ).bind('click', function(){
          $('#request-method').val($(this).text());
        })
      );
    }
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
    var strValue = username.val() + ":" + password.val(),
        strBase64 = btoa(strValue).replace(/.{76}(?=.)/g,'$&\n');

    restclient.main.addHttpRequestHeader('Authorization', "Basic " + strBase64);
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
    if(!$(this).attr('oauth-secrets')) {
      if($(this).attr('header-name') == 'Authorization')
      {
        var hashed = $(this).attr('header-value'),
            basic = atob(hashed.substring(6)),
            user = basic.split(':');
        $('#modal-basic-authorization [name="username"]').val(user[0]);
        $('#modal-basic-authorization [name="password"]').val(user[1]);
        $('#modal-basic-authorization').modal('show');
      }
      else
      {
        $('#modal-custom-header').data('source', $(this));
        $('#modal-custom-header').modal('show');
      }
    }
    else
    {
      var id = $(this).attr('id'),
          headerString = $(this).attr('header-value'),
          title = $('<div></div>')
                      .text('OAuth')
                      .append(
                        $('<a style="float:right;font-size: 14px;" href="#" class="close btnClose"></a>').text('x')
                      );
      var buttonAutoRefresh = $('<button class="btn btn-warning btn-small btnAutoRefresh" data-toggle="button"></button>').text('Auto refresh');
      if($(this).attr('auto-refresh') == 'yes')
        buttonAutoRefresh.addClass('active');
      else
        buttonAutoRefresh.removeClass('active');


      var buttonRefresh = $('<button class="btn btn-warning btn-small btnRefresh" style="margin-left: 6px"></button>').text('Refresh');

      var container = $('<div></div>')
                      .append($('<textarea style="width: 445px; height: 100px;"></textarea>').text(headerString).attr('data-id', id))
                      .append(
                        $('<p style="margin-top: 10px;text-align:right"></p>').append(buttonAutoRefresh)
                        .append(buttonRefresh)
                      );
      //$('.popover').remove();
      //console.log(container.html());

      $(this).removeAttr('title').attr('data-content', container.html()).popover({
                                            title: title.html(),
                                            content: container.html(),
                                            trigger : 'manual',
                                            placement: 'bottom'
                                          }).popover('show');
      $('.popover-title .btnClose').click( function(){
        $(this).parents('.popover').removeClass('in').remove();
      });
      $('.popover-content .btnAutoRefresh').click(function(){
        if($(this).hasClass('active'))
          $('#' + id).attr('auto-refresh', 'no');
        else
          $('#' + id).attr('auto-refresh', 'yes');
      });
      $('.popover-content .btnRefresh').click(function(){
        //console.log(popoverContent);
        restclient.main.updateOAuthSign(id);
      });
    }
  },
  addHttpRequestHeader: function(name, value) {
    if(this.uniqueHeaders.indexOf(name.toLowerCase()) >= 0)
      restclient.main.removeHttpRequestHeaderByName(name);

   var text = name + ": " + value;

   if (text.length > restclient.main.headerLabelMaxLength)
     text = text.substr(0, restclient.main.headerLabelMaxLength - 3) + "...";
   var id = "header-" + (((1+Math.random())*0x10000)|0).toString(16).substring(1);

   var span = $('<span />').addClass('label').text(text).attr('id', id)
              .attr("title", name + ": " + value)
              .attr('header-name', name)
              .attr('header-value', value)
              .append($('<a />').addClass('close').text('×').bind('click', restclient.main.removeHttpRequestHeader));
    span.bind('click', restclient.main.editHttpRequestHeader);
    $('#request-headers').append(span);

    if( $('#request-headers span.label').length > 0 ) {
      $('#request-headers').show();
    }
    return span;
  },
  addCustomHeader: function() {
    var remember = $('#modal-custom-header [name="remember"]'),
        inputName = $('#modal-custom-header [name="name"]'),
        inputValue = $('#modal-custom-header [name="value"]');
    if(inputName.val() == '') {
      inputName.next().text('Please input the http request header name').show();
      inputName.focus();
      return false;
    }
    if(inputValue.val() == '') {
      inputValue.next().text('Please input the http request header value').show();
      inputValue.focus();
      return false;
    }
    inputName.next().hide();
    inputValue.next().hide();

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
      if($(this).attr('oauth-secrets'))
      {
        request.oauth = {};
        request.oauth.oauth_secrets = $(this).attr('oauth-secrets');
        request.oauth.oauth_parameters = $(this).attr('oauth-parameters');
        request.oauth.auto_refresh = $(this).attr('auto-refresh');
      }
    });
    request.headers = headers;
    return request;
  },
  wrapText: function(str, len) {
    var result = "";
    if(str.length > len)
    {
      for (var j = 0, np = ''; j < str.length; j += len, np = '\n') {
        np += str.substr(j, len);
        result += np;
      }
      return result;
    }
    else
      return str;
  },
  setResponseHeader: function(headers, line) {
    //console.log(headers);
    if(!headers) {
      $('#response-headers pre').text('');
      return false;
    }
    if(typeof line === 'boolean' && line == false) {
      var text = (typeof headers == 'object' && headers.length > 0) ? headers.join("\n") : '';
      $('#response-headers pre').text(text);
    }
    else
    {
      var ol = $('<ol class="linenums"></ol>');
      for(var name in headers) {
        if(!headers.hasOwnProperty(name))
          continue;
        var val     = headers[name],
            valHtml = null;

        if(typeof val == 'string'){
          val = restclient.main.wrapText(val, 80);
          valHtml = $('<span class="header-value"></span>').text(val)
        }
        else
        {
          valHtml = $('<ul class="multivalues"></ul>');
          for(var k=0, value; value = val[k]; k++) {
            valHtml.append($('<li></li>').text(value));
          }
          valHtml = $('<span class="header-value"></span>').append(valHtml);
        }
        var headerName = $('<span class="header-name"></span>').text(name);
        var li = $('<li></li>');
        li.append(
          $('<span class="line"></span>').append(headerName)
          .append($('<span class="header-split"></span>').text(': '))
          .append(valHtml)
        );

        ol.append(li);
      }
      $('#response-headers pre').empty().append(ol);
      var maxWidth = 120;
      $('#response-headers .header-name').each(function(){
        maxWidth = ($(this).outerWidth(true) > maxWidth) ? $(this).outerWidth(true) : maxWidth;
      });
      $('#response-headers .header-name').width(maxWidth + 10);
      //$('#response-headers .header-value').css('margin-left', maxWidth + 20 + 'px');
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
  showRequest: function(e) {
    window.scrollTo(0,0);
    e.preventDefault();
    return false;
  },
  showResponse: function() {

    $("#response").show();

    //document.getElementById('response').scrollIntoView(true);
    //alert(top);
    document.getElementById('response').scrollIntoView(true);
    //$('html, body').animate({scrollTop: top}, 1000);
    return false;
  },
  clearResult: function() {
    $("#response-body-preview div.pre").html('');
    $('#response-body-raw pre').text('');
    $('#response-body-highlight pre').text('');
    restclient.main.setResponseHeader();
    $("#response-body-preview div.pre").css('overflow', 'auto');
    //$('[href="#response-headers"]').click();
  },
  checkMimeType: function(){
    var contentType = this.xhr.getResponseHeader("Content-Type");
    if (contentType.indexOf('image') >= 0) {
      if($('#overrideMimeType').attr('checked') !== 'checked' && restclient.getPref('imageWarning', true))
        restclient.message.show({
          id: 'alertOverrideMimeType',
          type: 'warning',
          title: 'Cannot preview image',
          message: 'Your response is an image, but we need to override the mime type to preview this image. Would you like to override the mime type to "text/xml; charset=x-user-defined" and re-send this request?',
          buttons: [
            {title: 'Yes, please continue', class: 'btn-danger', callback: restclient.main.overrideMimeType},
            [
              {title: 'No, thanks', class: 'btn-warning', callback: function(){ $('#alertOverrideMimeType').alert('close'); }},
              {title: 'No, and please don\'t remind me again', callback: function(){ $('#alertOverrideMimeType').alert('close'); restclient.setPref('imageWarning', false); }}
            ]
          ],
          parent: $('.overrideMimeTypeMessage'),
          exclude: true
        });
    }
    else
      if($('#overrideMimeType').attr('checked') == 'checked' && restclient.getPref('textMimeWarning', true))
        restclient.message.show({
          id: 'alertUnOverrideMimeType',
          type: 'warning',
          title: 'You\'ve overrided MIME type',
          message: 'Please notice that you enabled MIME override in this request, it could cause some charset/encoding issues. Would you like to disable this override and try again?',
          buttons: [
            {title: 'Yes, please continue', class: 'btn-danger', callback: restclient.main.unOverrideMimeType},
            [
              {title: 'No, thanks', class: 'btn-warning', callback: function(){ $('#alertUnOverrideMimeType').alert('close'); }},
              {title: 'No, and please don\'t remind me again', callback: function(){ $('#alertUnOverrideMimeType').alert('close'); restclient.setPref('textMimeWarning', false); }}
            ]
          ],
          parent: $('.overrideMimeTypeMessage'),
          exclude: true
        });
  },
  display: function() {
    var responseData = this.xhr.responseText;
    $('#response-body-raw pre').text(responseData);
  },
  displayHtml: function() {
    var responseData = this.xhr.responseText;

    if(responseData.length > 0) {
      var iframe = $("<iframe></firame>")
        .attr("type", "content")
        .attr("src", "data:text/html," + encodeURIComponent(responseData));
      $("#response-body-preview div.pre").append(iframe);

      $('#response-body-highlight pre').text(responseData);
    }

    $('#response-body-raw pre').text(responseData);
  },
  displayXml: function() {
    var responseData = this.xhr.responseText,
        responseXml  = this.xhr.responseXML;

    if(responseXml != null) {
      var xslDocument = document.implementation.createDocument("", "dummy", null);
      xslDocument.onload = function (evt) {
          var xsltProcessor = new XSLTProcessor();
          xsltProcessor.importStylesheet(xslDocument);
          var resultFragment = xsltProcessor.transformToFragment(responseXml, document);
          $("#response-body-preview div.pre").append(resultFragment);
          $('#response-body-preview .expander').click(restclient.main.toggleExpander);
      };
      xslDocument.load("chrome://restclient/content/xsl/XMLPrettyPrint.xsl");

      /*var xslDoc = document.implementation.createDocument("", "dummy", null);
      xslDoc.onload = function (evt) {
          var xsltProcessor = new XSLTProcessor();
          xsltProcessor.importStylesheet(xslDoc);
          var resultFragment = xsltProcessor.transformToFragment(responseXml, document);
          $("#response-body-highlight pre").text($('<p></p>').append(resultFragment).html());
          //$('#response-body-preview .expander').click(restclient.main.toggleExpander);
          window.prettyPrint && prettyPrint();
      };
      xslDoc.load("chrome://restclient/content/xsl/XMLIndent.xsl");*/
    }

    //$("#response-body-preview div.pre").append(iframe);
    $('#response-body-raw pre').text(responseData);
    $('#response-body-highlight pre').text(responseData);
  },
  displayJson: function() {
    var responseData = this.xhr.responseText;

    $('#response-body-raw pre').text(responseData);
    var reformatted = responseData;
    try{
      reformatted = JSON.stringify(JSON.parse(responseData), null, "  ");
    }catch(e) {}
    $('#response-body-highlight pre').text(reformatted);
    $("#response-body-preview div.pre").css('overflow', 'none').append($('<textarea></textarea>').text(reformatted));
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
      restclient.main.updateFavoriteRequestMenu();
      alert('import requests succeed');
    }
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
      var targetFile = fp.file, path = fp.file.path;
      if (path.match("\.json$") != ".json") {
          targetFile = Components.classes["@mozilla.org/file/local;1"]
              .createInstance(Components.interfaces.nsILocalFile);
          targetFile.initWithPath(path + ".json")
      }
      var ostream = restclient.FileUtils.openSafeFileOutputStream(targetFile),
          converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                      createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
      converter.charset = "UTF-8";
      var istream = converter.convertToInputStream(savedRequest);

      restclient.NetUtil.asyncCopy(istream, ostream, function(status) {
        if (!Components.isSuccessCode(status)) {
          alert('Cannot export favorite request.');
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
          var headerSpan = restclient.main.addHttpRequestHeader(header[0], header[1]);
          if(header[0].toLowerCase() == 'authorization' && request.oauth) {
            headerSpan.attr('oauth-secrets', request.oauth.oauth_secrets);
            headerSpan.attr('oauth-parameters', request.oauth.oauth_parameters);
            headerSpan.attr('auto-refresh', request.oauth.auto_refresh);
          }
        }
      }


      return true;
    }
    return false;
  },
  initOAuthWindow: function() {
    var oauth_signature_method      = $('#oauth_signature_method'),
        oauth_version               = $('#oauth_version'),
        oauth_nonce                 = $('#oauth_nonce'),
        oauth_timestamp             = $('#oauth_timestamp');

    $('#get-access-token .btnOkay').bind('click', restclient.main.oauthAuthorize);

    var auto_oauth_timestamp   = $('#auto_oauth_timestamp'),
        oauth_timestamp        = $('#oauth_timestamp'),
        auto_oauth_nonce       = $('#auto_oauth_nonce'),
        oauth_nonce            = $('#oauth_nonce'),
        oauth_signature_method = $('#oauth_signature_method'),
        oauth_version          = $('#oauth_version');

    $('#oauth-setting .btnOkay').click(function(){
      var param = {};
      param.auto_oauth_timestamp    = (auto_oauth_timestamp.attr('checked') == 'checked');
      param.oauth_timestamp         = oauth_timestamp.val();
      param.auto_oauth_nonce        = (auto_oauth_nonce.attr('checked') == 'checked');
      param.oauth_nonce             = oauth_nonce.val();
      param.oauth_signature_method  = oauth_signature_method.val();
      param.oauth_version           = oauth_version.val();
      restclient.setPref('OAuth.setting', JSON.stringify(param));
    });

    function autoTimeStamp(){
      if($('#auto_oauth_timestamp').attr('checked') == 'checked') {
        $('#oauth_timestamp').val('').addClass('disabled').attr('disabled',true);
        $('#oauth_timestamp').parent().next().hide();
      }
      else {
        var ts = restclient.oauth.getTimeStamp();
        $('#oauth_timestamp').val(ts).removeClass('disabled').removeAttr('disabled');
        $('#oauth_timestamp').parent().next().text(new Date(ts*1000)).show();
      }
    }

    function autoNonce(){
      if($('#auto_oauth_nonce').attr('checked') == 'checked') {
        $('#oauth_nonce').val('').addClass('disabled').attr('disabled',true);
      }
      else
        $('#oauth_nonce').val(restclient.oauth.getNonce()).removeClass('disabled').removeAttr('disabled');
    }

    $('#auto_oauth_timestamp').click(autoTimeStamp);

    $('#auto_oauth_nonce').click(autoNonce);

    $('#window-oauth .btnClose').click(function() {
      $('#window-oauth').hide();
    });

    $('#auto_oauth_timestamp').attr('checked', true);
    $('#oauth_timestamp').val('');
    $('#oauth_timestamp').parent().next().hide();
    $('#auto_oauth_nonce').attr('checked', true);
    $('#oauth_nonce').val('');


    //Load setting from preferences
    var setting = restclient.getPref('OAuth.setting', '');
    if(setting != '') {
      setting = JSON.parse(setting);

      if(setting.auto_oauth_timestamp) {
        $('#auto_oauth_timestamp').attr('checked', true);
        oauth_timestamp.val('').addClass('disabled').attr('disabled',true);
      }
      else
      {
        $('#auto_oauth_timestamp').removeAttr('checked');
        //console.log(setting.oauth_timestamp);
        oauth_timestamp.removeClass('disabled').removeAttr('disabled',true).val(setting.oauth_timestamp);
        //console.log(oauth_timestamp.val());
        $('#oauth_timestamp').parent().next().show().text(new Date(setting.oauth_timestamp*1000));
      }

      if(setting.auto_oauth_nonce) {
        $('#auto_oauth_nonce').attr('checked', true);
        oauth_nonce.val('').addClass('disabled').attr('disabled',true);
      }
      else
      {
        $('#auto_oauth_nonce').removeAttr('checked');
        //console.log(setting.oauth_nonce);
        oauth_nonce.removeClass('disabled').removeAttr('disabled',true).val(setting.oauth_nonce);
        //console.log(oauth_nonce.val());
      }

      $('#oauth_signature_method option[value="' + setting.oauth_signature_method + '"]').attr('selected', true);
      $('#oauth_version option[value="' + setting.oauth_version + '"]').attr('selected', true);
    }
    else
    {
      $('#auto_oauth_timestamp').attr('checked', true);
      $('#auto_oauth_nonce').attr('checked', true);
      autoTimeStamp();
      autoNonce();
    }

    //Load authorize from preferences
    var authorize_consumer_key      = $('#get-access-token [name="consumer_key"]'),
        authorize_consumer_secret   = $('#get-access-token [name="consumer_secret"]'),
        authorize_request_token_url = $('#get-access-token [name="request_token_url"]'),
        authorize_authorize_url     = $('#get-access-token [name="authorize_url"]'),
        authorize_access_token_url  = $('#get-access-token [name="access_token_url"]'),
        authorize_callback_url      = $('#get-access-token [name="callback_url"]'),
        authorize_remember          = $('#get-access-token [name="remember"]');

    var authorize = restclient.getPref('OAuth.authorize', '');
    if(authorize != '') {
      authorize = JSON.parse(authorize);
      authorize_consumer_key.val(authorize.consumer_key);
      authorize_consumer_secret.val(authorize.consumer_secret);
      authorize_request_token_url.val(authorize.request_token_url);
      authorize_authorize_url.val(authorize.authorize_url);
      authorize_access_token_url.val(authorize.access_token_url);
      authorize_callback_url.val(authorize.callback_url);
      (authorize.remember === true) ? authorize_remember.attr('checked', true) : authorize_remember.removeAttr('checked');
    }
    else
    {

    }

    //Load authorize from preferences
    var sign_consumer_key         = $('#signature-request [name="consumer_key"]'),
        sign_consumer_secret      = $('#signature-request [name="consumer_secret"]'),
        sign_access_token         = $('#signature-request [name="access_token"]'),
        sign_access_token_secret  = $('#signature-request [name="access_token_secret"]'),
        sign_remember             = $('#signature-request [name="remember"]'),
        sign = restclient.getPref('OAuth.sign', '');
    if(sign != '') {
      sign = JSON.parse(sign);
      if(sign.consumer_key)
        sign_consumer_key.val(     sign.consumer_key);
      if(sign.consumer_secret)
        sign_consumer_secret.val(  sign.consumer_secret);
      if(sign.access_token)
        sign_access_token.val(     sign.access_token);
      if(sign.access_token_secret)
        sign_access_token_secret.val(    sign.access_token_secret);
      (sign.remember === true) ? sign_remember.attr('checked', true) : sign_remember.removeAttr('checked');
    }

    $('#signature-request .btnInsertAsHeader').bind('click', restclient.main.oauthSign);
  },
  showOAuthWindow: function() {
    $('#window-oauth').show();
  },
  oauthAuthorize: function() {
    var authorize_consumer_key      = $('#get-access-token [name="consumer_key"]'),
        authorize_consumer_secret   = $('#get-access-token [name="consumer_secret"]'),
        authorize_request_token_url = $('#get-access-token [name="request_token_url"]'),
        authorize_authorize_url     = $('#get-access-token [name="authorize_url"]'),
        authorize_access_token_url  = $('#get-access-token [name="access_token_url"]'),
        authorize_callback_url      = $('#get-access-token [name="callback_url"]'),
        authorize_remember          = $('#get-access-token [name="remember"]'),
        oauth_signature_method      = $('#oauth_signature_method'),
        oauth_version               = $('#oauth_version'),
        oauth_nonce                 = $('#oauth_nonce'),
        oauth_timestamp             = $('#oauth_timestamp'),
        authorize_okay              = $('#get-access-token .btnOkay'),
        errors = [];

    if(authorize_consumer_key.val() == '') {
      authorize_consumer_key.parents('.control-group').addClass('error');
      errors.push(authorize_consumer_key);
    }

    if(authorize_consumer_secret.val() == '') {
      authorize_consumer_secret.parents('.control-group').addClass('error');
      errors.push(authorize_consumer_secret);
    }

    if(authorize_request_token_url.val() == '') {
      authorize_request_token_url.parents('.control-group').addClass('error');
      errors.push(authorize_request_token_url);
    }

    if(authorize_authorize_url.val() == '') {
      authorize_authorize_url.parents('.control-group').addClass('error');
      errors.push(authorize_authorize_url);
    }

    if(authorize_access_token_url.val() == '') {
      authorize_access_token_url.parents('.control-group').addClass('error');
      errors.push(authorize_access_token_url);
    }

    if(errors.length > 0) {
      var el = errors.shift();
      el.focus();
      //console.error(el);
      return false;
    }

    authorize_okay.button('loading');
    if(authorize_remember.attr('checked') == 'checked') {
      var setting = {
        consumer_key      : authorize_consumer_key.val(),
        consumer_secret   : authorize_consumer_secret.val(),
        request_token_url : authorize_request_token_url.val(),
        authorize_url     : authorize_authorize_url.val(),
        access_token_url  : authorize_access_token_url.val(),
        callback_url      : authorize_callback_url.val(),
        remember          : true
      };
      //console.log(setting);
      restclient.setPref('OAuth.authorize', JSON.stringify(setting));
    }
    else
      restclient.setPref('OAuth.authorize', '');

    var secrets = {
      consumer_key: authorize_consumer_key.val(),
      consumer_secret: authorize_consumer_secret.val()
    };

    var parameters = {
      oauth_version: oauth_version.val(),
      oauth_signature_method: oauth_signature_method.val()
    };
    (oauth_nonce.val() == '') ? null : parameters.oauth_nonce = oauth_nonce.val();
    (oauth_timestamp.val() == '') ? null : parameters.oauth_timestamp = oauth_timestamp.val();

    //console.log(secrets);
    //console.log(parameters);

    var signature = restclient.oauth.sign({
      action: 'GET',
      path: authorize_request_token_url.val(),
      signatures: secrets,
      parameters: parameters
    });

    $('#window-oauth').hide();
    var message = restclient.message.show({
      id: 'alert-oauth-authorize',
      type: 'message',
      title: 'Start to do OAuth authorize',
      message: 'Try to getting a request Token from: ',
      buttons: [
        {title: 'Close', class: 'btn-danger', callback: function(){ $('#alert-oauth-authorize').alert('close'); }}
      ],
      closed: function() { $('#window-oauth').show(); }
    });

    restclient.message.appendCode(message,signature.signed_url);

    var oauth_token, oauth_token_secret;
    $.ajax({
      url: signature.signed_url,
      action: 'GET',
      async: false,
      success: function(data, textStatus, jqXHR) {
        //console.log(data);
        var params = restclient.oauth.parseParameterString(data);
        if(typeof params['oauth_token'] != 'undefined')
          oauth_token = params['oauth_token'];
        if(typeof params['oauth_token_secret'] != 'undefined')
          oauth_token_secret = params['oauth_token_secret'];
        restclient.message.appendMessage(message,'Get result:');
        restclient.message.appendCode(message,data);
      },
      error: function() {

      }
    });
    if(!oauth_token || !oauth_token_secret)
    {
      restclient.message.appendMessage(message,'Unable to parse oauth_token or oauth_token_secret from request token url response.');
      authorize_okay.button('reset');
      return false;
    }

    secrets.oauth_token = oauth_token;
    secrets.oauth_token_secret = oauth_token_secret;
    parameters['oauth_callback'] = authorize_callback_url.val();
    restclient.oauth.reset();
    signature = restclient.oauth.sign({
      action: 'GET',
      path: authorize_authorize_url.val(),
      signatures: secrets,
      parameters: parameters
    });

    restclient.message.appendButton(message,{title: 'Open authorize page for authorize your key', href: signature.signed_url});
    //console.log(signature);
    authorize_okay.button('reset');
  },
  oauthSign: function(){
    var sign_consumer_key         = $('#signature-request [name="consumer_key"]'),
        sign_consumer_secret      = $('#signature-request [name="consumer_secret"]'),
        sign_access_token         = $('#signature-request [name="access_token"]'),
        sign_access_token_secret  = $('#signature-request [name="access_token_secret"]'),
        sign_remember             = $('#signature-request [name="remember"]'),
        oauth_signature_method    = $('#oauth_signature_method'),
        oauth_version             = $('#oauth_version'),
        oauth_nonce               = $('#oauth_nonce'),
        oauth_timestamp           = $('#oauth_timestamp'),
        sign_okay                 = $('#signature-request .btnOkay'),
        errors = [];

    if(sign_consumer_key.val() == '') {
      sign_consumer_key.parents('.control-group').addClass('error');
      errors.push(sign_consumer_key);
    }

    if(sign_consumer_secret.val() == '') {
      sign_consumer_secret.parents('.control-group').addClass('error');
      errors.push(sign_consumer_secret);
    }

    if(errors.length > 0) {
      var el = errors.shift();
      el.focus();
      //console.error(el);
      return false;
    }

    sign_okay.button('loading');
    if(sign_remember.attr('checked') == 'checked') {
      var setting = {
        consumer_key        : sign_consumer_key.val(),
        consumer_secret     : sign_consumer_secret.val(),
        access_token        : sign_access_token.val(),
        access_token_secret : sign_access_token_secret.val(),
        remember            : true
      };
      restclient.setPref('OAuth.sign', JSON.stringify(setting));
    }
    else
      restclient.setPref('OAuth.sign', '');

    var secrets = {
      consumer_key        : sign_consumer_key.val(),
      consumer_secret     : sign_consumer_secret.val(),
      access_token        : sign_access_token.val(),
      access_secret       : sign_access_token_secret.val()
    };

    var parameters = {
      oauth_version: oauth_version.val(),
      oauth_signature_method: oauth_signature_method.val()
    };
    (oauth_nonce.val() == '') ? null : parameters.oauth_nonce = oauth_nonce.val();
    (oauth_timestamp.val() == '') ? null : parameters.oauth_timestamp = oauth_timestamp.val();

    //console.log(secrets);
    //console.log(parameters);
    restclient.oauth.reset();
    var url = $('#request-url').val();
    var method = $('#request-method').val().toLowerCase();
    var param = parameters;
    if(["put", "post"].indexOf(method) > -1) {
      var requestBody = $('#request-body').val();
      if(requestBody != '' && requestBody.indexOf('=') > -1){
        var p = restclient.oauth.parseParameterString(requestBody);
        param = $.extend(parameters, p);
      }
    }

    var signature = restclient.oauth.sign({
      action: $('#request-method').val(),
      path: url,
      signatures: secrets,
      parameters: param,
    });
    var headerSpan = restclient.main.addHttpRequestHeader('Authorization', signature.headerString);
    //headerSpan.data('oauth-authorization', signature);
    headerSpan.attr('oauth-parameters', JSON.stringify(parameters));
    headerSpan.attr('oauth-secrets', JSON.stringify(secrets));

    $('#window-oauth').css('display', 'none');

    if(restclient.getPref('sign-warning', '') == '')
      var message = restclient.message.show({
        id: 'alert-oauth-sign',
        type: 'warning',
        class: 'span5 offset3',
        title: 'Notice',
        message: 'Do you want RESTClient to refresh OAuth signature before sending your request?',
        buttons: [
          [
            {title: 'Yes, please', class: 'btn-danger', callback: function(){ headerSpan.attr('auto-refresh', "yes"); $('#alert-oauth-sign').alert('close'); }},
            {title: 'Yes, and please remember my descision', callback: function(){ headerSpan.attr('auto-refresh', "yes"); restclient.setPref('OAuth.refresh', "yes");  restclient.setPref('sign-warning', 'false'); $('#alert-oauth-sign').alert('close');}}
          ],
          [
            {title: 'No, thanks', class: 'btn-warning', callback: function(){ headerSpan.attr('auto-refresh', "no"); $('#alert-oauth-sign').alert('close'); }},
            {title: 'No, and please don\'t remind me again', callback: function(){ headerSpan.attr('auto-refresh', "no"); restclient.setPref('OAuth.refresh', "no"); restclient.setPref('sign-warning', 'false'); $('#alert-oauth-sign').alert('close'); }}
          ]
        ]
      });
    else
    {
      var autoRefresh = restclient.getPref('OAuth.refresh', "yes");
      headerSpan.attr('auto-refresh', autoRefresh);
    }


  },
  updateOAuthSign: function(headerSpanId){

    var headerSpan  = $('#' + headerSpanId),
    secrets         = JSON.parse(headerSpan.attr('oauth-secrets')),
    parameters      = JSON.parse(headerSpan.attr('oauth-parameters'));

    var requestMethod = $('#request-method').val(),
        requestUrl    = $('#request-url').val(),
        requestBody   = $('#request-body').val();

    restclient.oauth.reset();
    var param = parameters;
    if(["put", "post"].indexOf(requestMethod) > -1) {
      var requestBody = $('#request-body').val();
      if(requestBody != '' && requestBody.indexOf('=') > -1){
        var p = restclient.oauth.parseParameterString(requestBody);
        param = $.extend(parameters, p);
      }
    }
    //console.log(secrets);
    //console.log(param);

    var signature = restclient.oauth.sign({
                              action: requestMethod,
                              path: requestUrl,
                              signatures: secrets,
                              parameters: param
                            });
    //console.log(headerSpan);
    //headerSpan.data('oauth-authorization', signature);
    //console.log(signature);
    var text = 'Authorization: ' + signature.headerString;

    if (text.length > restclient.main.headerLabelMaxLength)
      text = text.substr(0, restclient.main.headerLabelMaxLength - 3) + "...";
    //console.log(text);
    headerSpan.text(text)
                .attr('header-name', 'Authorization')
                .attr('header-value', signature.headerString)
                .append($('<a />').addClass('close').text('×').bind('click', restclient.main.removeHttpRequestHeader));
    //console.log(signature.headerString);
    //console.log('[data-id="' + headerSpanId + '"]');
    //console.log(signature.headerString);
    $('[data-id="' + headerSpanId + '"]').val(signature.headerString);
  },
  sendRequest: function(){
    $('.popover').removeClass('in').remove();
    if( $('[auto-refresh="yes"]').length > 0)
    {
      var id = $('[auto-refresh="yes"]').attr('id');
      restclient.main.updateOAuthSign(id);
      //console.log('resigned');
    }
    var request = restclient.main.getRequest();
    //console.log(request);
    restclient.http.sendRequest(request.method, request.url, request.headers, request.overrideMimeType, request.body);
  },
  donate: function() {
    $('#paypal_donate').submit();
  }
};

window.addEventListener("load", function(){ restclient.main.init();  }, false);
window.addEventListener("unload", function(){ }, false);
