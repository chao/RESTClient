// import ext from "./utils/ext";
// import storage from "./utils/storage";
$(function () {

    // init request method typeahead
    // var requestMethods = new Bloodhound({
    //   datumTokenizer: Bloodhound.tokenizers.whitespace,
    //   queryTokenizer: Bloodhound.tokenizers.whitespace,
    //   local: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT']
    // });
    // $('#request-method').typeahead({
    //   hint: true,
    //   highlight: true,
    //   minLength: 0
    // },
    // {
    //   name: 'methods',
    //   source: requestMethods
    // });
    $('#request-method, #request-url').on('focus', function(){
        $(this).select();
    });
    $('#request-method-dropdown a').on('click', function(){
        var method = $(this).text();
        $('#request-method').val(method);
    });
    // Load favorite urls from storage
    browser.storage.local.get('request-urls').then(
        (urls) => {
            if(typeof urls == 'object' && urls.length > 0)
            {

            }
            else
            {

            }
        }
    );
    console.log('Hello jQuery');
});