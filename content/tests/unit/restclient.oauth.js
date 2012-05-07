$(function () {
  module("restclient.oauth.js")
    
  test("Test parseParameterString function", function () {
    var url =  "http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content",
      parts = restclient.helper.parseUrl(url),
      search = parts['search'];
    
    search = search.substring(1);
    ok(search === 'msg=1234&type=unread', "result:" + search);
    
    var param = restclient.oauth.parseParameterString(search);
    ok(typeof param === 'object', JSON.stringify(param));
  })

  test("Test sign with querystring", function(){
    var url = "http://term.ie/oauth/example/request_token.php?a=b&c=d",
        nonce = "JPP9SuZ1PeUNJvd",
        timestamp = "1336360620",
        version = "1.0",
        key = "key",
        secret = "secret";
    restclient.oauth.reset();
    var paths = restclient.helper.parseUrl(url),
        param = {'oauth_version': version, 'oauth_nonce': nonce,
                     'oauth_timestamp': timestamp, 'oauth_signature_method': 'HMAC-SHA1'},
        queryString = paths['search'].substring(1);
    param = $.extend(param, restclient.oauth.parseParameterString(queryString));
    var sign = restclient.oauth.sign({
        action: "GET",
        path: paths['hrefNoSearch'],
        signatures: {'consumer_key': key, 'consumer_secret': secret},
        parameters: param
      });
    ok(sign.signature === '4FhXNzEH2VZZnzydOO3oUv6rpCY%3D');
  })
  
  test("Test sign with querystring", function(){
    var url = "http://term.ie/oauth/example/request_token.php?a=b&a=c&a=d",
        nonce = "JPP9SuZ1PeUNJvd",
        timestamp = "1336360620",
        version = "1.0",
        key = "key",
        secret = "secret";
    restclient.oauth.reset();
    var paths = restclient.helper.parseUrl(url),
        param = {'oauth_version': version, 'oauth_nonce': nonce,
                     'oauth_timestamp': timestamp, 'oauth_signature_method': 'HMAC-SHA1'},
        queryString = paths['search'].substring(1);
    param = $.extend(param, restclient.oauth.parseParameterString(queryString));
    console.log(paths['hrefNoSearch'] + "|");
    console.log(param);
    var sign = restclient.oauth.sign({
        action: "GET",
        path: paths['hrefNoSearch'],
        signatures: {'consumer_key': key, 'consumer_secret': secret},
        parameters: param
      });
    ok(sign.signature === 'DWxlH8SA28rlls7lqhfxoNhA0As%3D', sign.signature);
  })
})