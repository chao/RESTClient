// import ext from "./utils/ext";
// import storage from "./utils/storage";
$(function () {

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
    browser.storage.local.get('request-urls').then(
        (data) => {
            console.log(data);
            if(data['request-urls'] && data['request-urls'].length > 0)
            {
                window.favoriteUrls = data['request-urls'];
            }
            else
            {
                window.favoriteUrls = [];
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
            browser.storage.local.set({ ['request-urls'] : favoriteUrls }).then(() => {
                // console.log(favoriteUrls);
            });
        }
    });

    $(document).on('click', '#request-urls-dropdown .dropdown-item', function(){
        var url = $(this).text();
        $('#request-url').val(url).trigger('change');
    });

    /********************** Init Request Headers **************************/
    browser.storage.local.get('request-headers').then(
        (data) => {
            console.log(data);
            if(data['request-headers'] && data['request-headers'].length > 0)
            {
                window.favoriteHeaders = data['request-headers'];
            }
            else
            {
                window.favoriteHeaders = [];
            }
            $(document).trigger('init-favorite-headers-dropdown-items', false);
            $('.btn-toggle-favorite-url').prop('disabled', false);
        }
    );

    $(document).on('init-favorite-headers-dropdown-items', function(e, saveToStorage){
        $('.dd-favorite-headers .dropdown-item:not(.default-menu)').remove();
        // console.log(favoriteUrls);
        if(typeof favoriteHeaders == 'object' && favoriteHeaders.length > 0)
        {
            $('<div class="dropdown-divider"></div>')
                .insertAfter('.dd-favorite-headers .dropdown-item:first-child');
            _.forEach(favoriteHeaders, function(header) {
                var el = $('<a class="dropdown-item" href="#"></a>').text(header);
                el.insertAfter('.dd-favorite-headers .dropdown-divider:not(.default-menu)');
            });
        }
        if(saveToStorage)
        {
            browser.storage.local.set({ ['request-headers'] : favoriteHeaders }).then(() => {
                // console.log(favoriteUrls);
            });
        }
    });

    $(document).on('click', '.nav-custom-header', function(){
        $('#modal-header').modal('show');
    });

    $(document).on('click', '.btn-save-request-header', function(){
        var requestName = $('#request-header-name').val();
        var requestValue = $('#request-header-value').val();
        var favorite = ($('#save-request-header-favorite:checked').length == 1);
        $(document).trigger('append-request-header', [requestName, requestValue, favorite]);
        $('#modal-header').modal('hide');
    });

    $(document).on('append-request-header', function(e, name, value, favorite){
        console.log('append request: ' + name + ',' + value);
        var closer = $('<a href="javascript:;" class="btn-remove-header">x</a>');
        var el = $('<span class="badge badge-default p-2"></span>')
            .text(requestName + ': ' + value)
            .append(closer).
            .data('request-name', requestName)
            .data('request-value', requestValue)
            .data('favorite', favorite);
        $('.list-request-headers').append(el);
    });

    $(document).on('click', '.dd-favorite-headers .dropdown-item', function(){
    });
});