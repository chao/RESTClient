$(function () {
  module("restclient.sqlite.js");
  restclient.init();
  restclient.sqlite.open();
  
  test("Test init function", function () {
    ok(typeof restclient.sqlite.db === 'object', 'inited');
  });
  
  test("Drop table function", function () {
    var result = restclient.sqlite.destroyTables();
    ok(result, 'tables dropped');
  });
  
  test("Test create table function", function () {
    var result = restclient.sqlite.initTables();
    ok(result, 'tables inited');
  });
  
  test("Test get request by name function", function(){
    var result = restclient.sqlite.getRequestByName("example#1");
    ok(result === false, 'not existed');
  });
  
  
  test("Test save request function", function () {
    var request = {
      method : 'POST',
      url : 'https://developer.mozilla.org/en/Example',
      body : 'a=b&c=d'
    };
    var labels = ["example", "unittest","requestfavorited"];
    restclient.sqlite.saveRequest(request, "example#1", 1, labels, function(requestName){
      ok(true, "the return requestId is: " + requestName);
    },function(request) {
      ok(false, request.url);
    });
  });
  
  test("Test save history function", function () {
    var request = {
      method : 'GET',
      url : 'https://developer.mozilla.org/en/Storage',
      body : 'a=b&c=d'
    };
    restclient.sqlite.saveHistory(request, function(requestId){
      ok(true, "the return requestId is: " + requestId);
    },function(request) {
      ok(false, request.url);
    });
  });
  
  test("Test get request by name function", function(){
    var result = restclient.sqlite.getRequestByName("example#1");
    ok(typeof result === 'object', 'request existed');
  });
});