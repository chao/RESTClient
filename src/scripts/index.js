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
import ext from "./utils/ext";
import storage from "./utils/storage";
$(function () {
    window.favoriteHeaders = [];
    window.favoriteUrls = [];

    /**************************** Init Toastr ********************************/
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

    /********************** Init Response Raw and Preview **************************/
    CodeMirror.modeURL = "scripts/plugins/codemirror-5.31.0/mode/%N/%N.js";
    window.cmResponseBody = CodeMirror.fromTextArea(document.getElementById("response-body"), {
        lineNumbers: true
    });
    $('.response-container a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        if ($(e.target).attr('href') == '#tab-response-body')
        {
            cmResponseBody.refresh();   
        }
    });
    $(document).on('update-response-body', function(e, mime, body) {
        // console.log("[index.js]['update-response-body']" + mime + "\n" + body);
        var iframe = document.getElementById("iframe-response")
        var iframeDoc = iframe.contentWindow.document;
        if(!mime || mime == '')
        {
            mime = 'text/plain';
        }

        mime = mime.toLowerCase();
        try {
            iframeDoc.open();
            iframeDoc.write('');
            iframeDoc.close();
        } catch (e) {
            console.error(e);
        }

        var mode = false;
        if(mime.indexOf('text/html') >= 0)
        {
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
        if (mode === false && mime.indexOf('json') >= 0) {
            mode = { name: "javascript", json: true };
        }
        if(mode === false && mime.indexOf('image') >= 0)
        {
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
        if(mode === false)
        {
            var info = CodeMirror.findModeByMIME(mime);
            mode = info.mode || null;
        }
        console.log(mode);
        if( mode )
        {
            cmResponseBody.setOption('mode', mode);
            CodeMirror.autoLoadMode(cmResponseBody, mode.name || mode);
        }
        else
        {
            cmResponseBody.setOption('mode', null);
        }
        
        cmResponseBody.getDoc().setValue(body);
    });

    /********************** Init Request Method & URL **************************/
    $('#request-method, #request-url').on('focus', function(){
        $(this).select();
    });
    $('#request-method-dropdown a').on('click', function(){
        var method = $(this).text();
        $('#request-method').val(method);
    });
    // Load favorite urls from storage
    $('.btn-toggle-favorite-url').prop('disabled', true);
    storage.get('request-urls').then(
        (data) => {
            console.log(data);
            if(data['request-urls'] && data['request-urls'].length > 0)
            {
                window.favoriteUrls = data['request-urls'];
            }
            $('#request-url').trigger('change');
            $(document).trigger('init-favorite-url-dropdown-items', false);
            $('.btn-toggle-favorite-url').prop('disabled', false);
        }
    );

    $('.btn-toggle-favorite-url').on('click', function(){
        var url = $('#request-url').val();
        if(url == '')
        {
            return false;
        }
        var idx = _.indexOf(favoriteUrls, url);
        if(idx >= 0)
        {
            _.remove(favoriteUrls, function(item) {
                return item == url;
            });
        }
        else
        {
            favoriteUrls.push(url);
        }
        $(document).trigger('init-favorite-url-dropdown-items', true);
        $('.btn-toggle-favorite-url i').toggleClass('fa-star-o');
        $('.btn-toggle-favorite-url i').toggleClass('fa-star');
    });

    $(document).on('change', '#request-url', function(){
        // console.log('request url changed');
        var url = $('#request-url').val();
        // console.log(url);
        if(url == '')
        {
            $('.btn-toggle-favorite-url').prop('disabled', true);
            $('.btn-toggle-favorite-url i').addClass('fa-star-o').removeClass('fa-star');
            return false;
        }
        $('.btn-toggle-favorite-url').prop('disabled', false);
        $('.btn-toggle-favorite-url i').removeClass('fa-star-o fa-star');
        var idx = _.indexOf(favoriteUrls, url);
        if(idx >= 0)
        {
            $('.btn-toggle-favorite-url i').addClass('fa-star');
        }
        else
        {
            $('.btn-toggle-favorite-url i').addClass('fa-star-o');
        }
    });

    $(document).on('init-favorite-url-dropdown-items', function(e, saveToStorage){
        $('#request-urls-dropdown').empty();
        // console.log(favoriteUrls);
        if(typeof favoriteUrls == 'object' && favoriteUrls.length > 0)
        {
            _.forEach(favoriteUrls, function(url) {
                var el = $('<a class="dropdown-item" href="#"></a>').text(url);
                $('#request-urls-dropdown').append(el);
            });
        }
        else
        {
            var li = $('<a class="dropdown-item disabled" href="#">No favorite URLs</a>');
            $('#request-urls-dropdown').append(li);
        }
        if(saveToStorage)
        {
            storage.set({ ['request-urls'] : favoriteUrls }).then(() => {
                // console.log(favoriteUrls);
            });
        }
    });

    $(document).on('click', '#request-urls-dropdown .dropdown-item', function(){
        var url = $(this).text();
        if($(this).hasClass('disabled'))
        {
            return false;
        }
        $('#request-url').val(url).trigger('change');
    });
    
    $(document).on('click', '#nav-download-favorite-request', function(e) {
        e.stopPropagation();
        e.preventDefault();

        Database.loadRequests().then(function () {
            let requests = Database.requests;
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
            if(data['request-headers'] && data['request-headers'].length > 0)
            {
                window.favoriteHeaders = data['request-headers'];
            }
            $(document).trigger('init-favorite-headers-dropdown-items', false);
            $('.nav-custom-header, .nav-custom-header-clear').removeClass('disabled');
        }
    );

    $(document).on('init-favorite-headers-dropdown-items', function(e, saveToStorage){
        $('.di-favorite-header, .di-favorite-divider').remove();
        // console.log(favoriteUrls);
        if(typeof favoriteHeaders == 'object' && favoriteHeaders.length > 0)
        {
            $('<div class="dropdown-divider di-favorite-divider"></div>')
                .insertAfter('.nav-custom-header');
            _.forEach(favoriteHeaders, function(header) {
                var el = $('<a class="dropdown-item di-favorite-header" href="#"></a>')
                            .text(header.name + ': ' + header.value)
                            .data('name', header.name)
                            .data('value', header.value)
                            .attr('title', header.name + ': ' + header.value);
                el.insertAfter('.di-favorite-divider');
            });
        }
        if(saveToStorage)
        {
            storage.set({ ['request-headers'] : favoriteHeaders }).then(() => {
            });
        }
    });

    $(document).on('click', '.nav-custom-header', function(){
        $('#modal-header').modal('show');
    });

    $('#modal-header').on('shown.bs.modal', function(){
        $('#request-header-name').focus().select();
    });
    $('#modal-header').on('hide.bs.modal', function(){
        $('#modal-header').removeData('source');
        $('#save-request-header-favorite').removeAttr('checked').prop('checked', false);
    });

    $(document).on('submit', '.form-request-header', function(e){
        e.preventDefault();
        var requestName = $('#request-header-name').typeahead('val');
        var requestValue = $('#request-header-value').typeahead('val');
        var favorite = ($('#save-request-header-favorite:checked').length == 1);
        var source = $('#modal-header').data('source');
        $(document).trigger('append-request-header', [requestName, requestValue, favorite, source]);
        $('#modal-header').modal('hide');
        if(favorite)
        {
            var result = _.find(favoriteHeaders, { 'name': requestName, 'value': requestValue });
            if(typeof result == 'undefined')
            {
                favoriteHeaders.push({ 'name': requestName, 'value': requestValue });
                $(document).trigger('init-favorite-headers-dropdown-items', true);
            }
        }
        else
        {
            var result = _.remove(favoriteHeaders, function(item){
                console.log(requestName);
                console.log(requestValue);
                console.log(item);
                return item.name == requestName && item.value == requestValue;
            });
            console.log(result);
            console.log(favoriteHeaders);
            if(result.length > 0)
            {
                $(document).trigger('init-favorite-headers-dropdown-items', true);
            }
        }
    });

    $(document).on('click', '.nav-custom-header-clear', function() {
        favoriteHeaders = [];
        $(document).trigger('init-favorite-headers-dropdown-items', true);
        $('.di-favorite-header, .di-favorite-divider').remove();
        toastr.success('All favorite request headers are removed.');
    });

    $(document).on('click', '.btn-remove-header', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var badge = $(this).parents('.badge');
        if($('.btn-remove-header').length == 1)
        {
            $('.div-request-headers').addClass('animated zoomOutRight');
            setTimeout(function(){
                badge.remove();
                $('.div-request-headers').hide();
                $('.div-request-headers').removeClass('animated zoomOutRight');
            }, 750);
        }
        else
        {
            badge.removeClass('animated zoomIn');
            badge.addClass('animated zoomOutRight');
            setTimeout(function(){
                badge.remove();
            }, 750);
        }
    });

    $(document).on('click', '.btn-remove-all-headers', function() {
        $('.div-request-headers').addClass('animated zoomOutRight');
        setTimeout(function(){
            $('.list-request-headers').empty();
            $('.div-request-headers').hide();
            $('.div-request-headers').removeClass('animated zoomOutRight');
        }, 750);
    });

    $(document).on('append-request-header', function(e, name, value,
                        favorite, source, className, data) {
        console.log('append request: ' + name + ',' + value);
        if(!className)
        {
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
        if(data)
        {
            el.data('data', data)
        }
        if(source)
        {
            source.replaceWith(el);
        }
        else
        {
            if($('.btn-remove-header').length == 0)
            {
                $('.list-request-headers').append(el);
                $('.div-request-headers').show();
                $('.div-request-headers').addClass('animated zoomInLeft');
                setTimeout(function(){
                    $('.div-request-headers').removeClass('animated zoomInLeft');
                }, 750);
            }
            else
            {
                $('.list-request-headers').append(el.addClass('animated zoomIn'));
            }
        }
    });

    $(document).on('click', '.di-favorite-header', function(){
        var name = $(this).data('name');
        var value = $(this).data('value');
        var favorite = true;
        $(document).trigger('append-request-header', [name, value, favorite]);
    });

    $(document).on('click', '.list-request-headers .badge.custom', function() {
        var name = $(this).data('name');
        var value = $(this).data('value');
        var favorite = $(this).data('favorite');
        $('#request-header-name').typeahead('val', name);
        $(document).trigger('update-request-header-value-typeahead', name);
        $('#request-header-value').typeahead('val', value);
        if(favorite)
        {
            $('#save-request-header-favorite').attr('checked', true).prop('checked', true);
        }
        else
        {
            $('#save-request-header-favorite').removeAttr('checked').prop('checked', false);
        }
        $('#modal-header').data('source', $(this)).modal('show');
    });

    var requestHeaderNames = _.keys(requestHeaders);
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
    }).on('typeahead:select typeahead:autocomplete', function(src, name){
        $(document).trigger('update-request-header-value-typeahead', name);
    });

    $(document).on('update-request-header-value-typeahead', function(e, name) {
        try{ $('#request-header-value').typeahead('destroy'); }catch(e){}
        var values = [];
        if(name && typeof requestHeaders[name] != 'undefined')
        {
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
    
    $(document).on('modal-form-data-row-changed', function(){
        if ($('#modal-form-data .btn-minus').length == 1)
        {
            $('#modal-form-data .btn-minus').prop('disabled', true);
        }
        else
        {
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
        _.each($('#modal-form-data .modal-body .row'), function(item){
            var name = $(item).find('[name="name"]').val();
            var value = $(item).find('[name="value"]').val();
            console.log(item);
            params.push({name: name, value: value});
        });
        
        $('#modal-form-data').modal('hide');
        if (params.length > 0)
        {
            $('#request-body').val($.param(params)).data('form-data', params);
            $('.btn-form-data').addClass('active');
        }
        else
        {
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
        if(data && data.length > 0)
        {
            _.each(data, function(item){
                var newRow = template.clone();
                newRow.find('[name="name"]').val(item.name);
                newRow.find('[name="value"]').val(item.value);
                $('#modal-form-data .modal-body').append(newRow);
            });
        }
        else
        {
            $('#modal-form-data .modal-body').append(template);
        }
        $(document).trigger('modal-form-data-row-changed');
    });
    
    $(document).on('change', '#request-body', function(e){
        $('#request-body').removeData('form-data');
        $('.btn-form-data').removeClass('active');
    });

    /*********************** Toggle Panel ***************************/
    $(document).on('click', '.btn-toggle-panel', function(){
        var text = $(this).find('span').text();
        if(text == '-')
        {
            $(this).parents('.row').next().hide();
            $(this).find('span').text('+');
        }
        else
        {
            $(this).parents('.row').next().show();
            $(this).find('span').text('-');
        }
    });
    $(document).on('click', '[data-action="toggle"]', function(){
        var target = $(this).data('target');
        if(target == '')
        {
            $('.request-container, .response-container').show();
        }
        else
        {
            $('.' + target).toggle();
        }
    });

    /******************** Basic Authentication ****************/
    $('#modal-basic-auth').on('shown.bs.modal', function(){
        // $('#modal-basic-auth').find('.is-invalid').removeClass('is-invalid');
        // $('#modal-basic-auth').find('.invalid-feedback').removeClass('invalid-feedback');
        $('#modal-basic-auth').find('.has-danger').removeClass('has-danger');
        $('#basic-auth-name').select().focus();
    });
    $('.form-basic-auth').on('submit', function(e){
        e.preventDefault();
        e.stopPropagation();
        var username = $('#basic-auth-name').val();
        var password = $('#basic-auth-password').val();
        if(username == '')
        {
            // $('#basic-auth-name').addClass('is-invalid').next()
            //     .addClass('invalid-feedback');
            $('#basic-auth-name').parents('.form-group').addClass('has-danger').focus();
            return false;
        }
        var value = 'Basic ' + window.btoa(username + ':' + password);
        var source = ($('.list-request-headers .basic-auth').length > 0) ?
            $('.list-request-headers .basic-auth') : false;
        var data = {'username': username, 'password': password};
        $(document).trigger('append-request-header', ['Authorization', value, false, source, 'basic-auth', data]);
        $('#modal-basic-auth').modal('hide');
    });
    $(document).on('click', '.list-request-headers .badge.basic-auth', function() {
        var data = $(this).data('data');
        $('#basic-auth-name').val(data['username']);
        $('#basic-auth-password').val(data['password']);
        $('#modal-basic-auth').modal('show');
    });
    /******************** Send Button ****************/
    $('.btn-send-request').prop('disabled', true);
    $(document).on('keyup input change paste', '#request-method, #request-url', function(){
        console.log('url changed');
        var method = $('#request-method').val();
        var url = $('#request-url').val();
        var isUrl = urlHelper.is_web_iri(url);
        // console.log(isUrl);
        // console.log(method != '' && typeof isUrl != 'undefined');
        if(method != '' && typeof isUrl != 'undefined')
        {
            $('.btn-send-request').prop('disabled', false);
        }
        else
        {
            $('.btn-send-request').prop('disabled', true);
        }
    }).trigger('change');
    /*************************** Execute request ******************************/
    $('.request-form').on('submit', function(e){
        e.preventDefault();
        e.stopPropagation();
        if($('.btn-send-request').prop('disabled'))
        {
            return false;
        }

        var method = $('#request-method').val();
        var url = $('#request-url').val();
        var headers = [];

        $('#response-headers ol').empty();
        cmResponseBody.getDoc().setValue('');
        $('.response-container a[data-toggle="tab"]:first').tab('show');
        $('.response-container a.preview[data-toggle="tab"]').hide();
    });

    /******************** Back to Top *************************/
    $(window).scroll(function(){
        if($(this).scrollTop() > 100){
            $('#scroll').fadeIn();
        }else{
            $('#scroll').fadeOut();
        }
    });
    $('#scroll').click(function(){
        $("html, body").animate({ scrollTop: 0 }, 600);
        return false;
    });

    /**********************FULL Screen Function ********************************/
    $(document).on('start-counting', function(evt, initCount){
        window.counting = initCount || 0;
        window.timeoutCounting = setInterval(function(){
            window.counting += 0.1;
            $(".div-seconds").text(numeral(window.counting).format("000.0"));
        }, 100);
    });

    $(document).on("show-fullscreen", function() {
      if (window.timeoutCounting) {
        clearInterval(window.timeoutCounting);
      }
      window.counting = 0;
      $(".current-request-basic").text($('#request-method').text() + ' ' + $('request-url').text());
      $(".current-request-status").text("is waiting for response");
      $("#fullscreen-progressbar").show();
    });

    $(document).on("hide-fullscreen", function() {
        if (window.timeoutCounting)
        {
            clearInterval(window.timeoutCounting);
        }
        $("#fullscreen-progressbar").hide();
    });

    $(document).on('click', "#btn-abort-request", function(){
        $(document).trigger('abort-current-ajax');
        $(document).trigger("hide-fullscreen");
        ext.runtime.sendMessage({
            action: "abort-http-request",
            target: "background"
        });
    });

    /******************* Start to execute request ******************************/
    $(document).on('click', '.btn-send-request', function() {
        $(document).trigger("show-fullscreen");
        var headers = [];

        $(".list-request-headers .badge").each(function(idx, item){
            var name  = $(item).data('name');
            var value = $(item).data('value');
            headers.push( {'name': name, 'value': value} );
        });
        
        var data = {
            'method': $('#request-method').val(),
            'url': $('#request-url').val(),
            'headers': headers,
            'body': $('#request-body').val()
        };
        $('.current-request-basic').html($('#request-method').val() + ' ' + $('#request-url').val());
        ext.runtime.sendMessage({
                action: "execute-http-request",
                target: "background",
                data: data
            }
        );
    });
});

ext.runtime.onMessage.addListener(
    function (request, sender) {
        
        if (request.target !== 'index')
        {
            return false;
        }
        
        console.log('[index.js]' + request.action);
        if (request.action == "update-progress-bar") {
            console.log(request.data);
            $('[role="progressbar"]')
                .addClass('progress-bar-animated')
                .attr('aria-valuenow', request.data)
                .css('width', request.data + '%');
            return false;
        }
        if (request.action == "set-progress-bar-animated") {
            console.log('animated progress-bar');
            $('[role="progressbar"]').addClass('progress-bar-animated')
                .attr('aria-valuenow', '100')
                .css('width', '100%');
            $('.current-request-status').html(request.data);
            return false;
        }
        if (request.action == "update-progress-label") {
            $('.current-request-status').html(request.data);
            return false;
        }
        if (request.action == "hide-overlay") {
            $(document).trigger("hide-fullscreen");
            return false;
        }
        if (request.action == "start-counting") {
            $(document).trigger('start-counting');
            return false;
        }
        if (request.action == "abort-http-request") {
            toastr.warning("HTTP request (" + $('#request-method').val() + " " + $('#request-url').val() + ") aborted.");
            return false;
        }
        if (request.action == "http-request-timeout") {
            $(document).trigger("hide-fullscreen");
            toastr.error("HTTP request (" + $('#request-method').val() + " " + $('#request-url').val() + ") timed out.");
            return false;
        }
        if (request.action == "http-request-error") {
            $(document).trigger("hide-fullscreen");
            toastr.error(request.detail || "Request error", request.title || "Error");
            return false;
        }
        if (request.action == "http-request-load")
        {
            var mime = false;
            $(document).trigger("hide-fullscreen");
            // console.log(request.data);
            $('#response-headers ol').empty();
            if(request.data && request.data.headers)
            {
                _.each(request.data.headers, function(header){
                    var span = $('<span class="d-flex"></span>');
                    span.append($('<span class="header-name"></span>').text(header['key']));
                    span.append($('<span class="header-split">: </span>'));
                    span.append($('<span class="header-value"></span>').text(header['value']));
                    var li = $('<li></li>').append(span);
                    $('#response-headers ol').append(li);

                    if (header['key'].toLowerCase() == 'content-type')
                    {
                        mime = header['value'];
                    }
                    
                });
            }
            var body = request.data.body || '';
            console.log([mime, body]);
            $(document).trigger('update-response-body', [mime, body]);
            
            return false;
        }
    }
);