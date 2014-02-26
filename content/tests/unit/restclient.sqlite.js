$(function () {
  module("restclient.sqlite.js");
  restclient.init();
  restclient.sqlite.open();
  
  test("Test init function", function () {
    ok(typeof restclient.sqlite.db === 'object', 'inited');
  });
  
  test("Test create table function", function () {
    restclient.sqlite.initTables();
    ok(typeof restclient.sqlite.db === 'object', 'inited');
  });
  
  asyncTest("Test save history function", function () {
    var request = {
      request_method : 'GET',
      request_url : 'https://developer.mozilla.org/en/Storage',
      request_body : 'a=b&c=d'
    }
    restclient.sqlite.saveHistory(request, function(requestId){
      ok(true, "the return requestId is: " + requestId);
      start();
    },function(request) {
      ok(false, request.url);
      start();
    });
  });
  
  /*test("Test save request function", function () {
    
    var request = restclient.sqlite.getRequest('request-db54a85dd2f2119102e22e8fe061435a0d0b0e77');
    ok(typeof request === 'string', JSON.stringify(request) );
  });*/
  
});