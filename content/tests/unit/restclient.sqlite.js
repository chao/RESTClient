$(function () {
  module("restclient.sqlite.js");
  restclient.init();
  restclient.sqlite.open();
  var requestUUID1, requestUUID2, historyId;
  
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
    var labels = ["example", "unittest","requestfavorited","unittest", "apple"];
    var ret = restclient.sqlite.saveRequest(request, "example#1", 1, labels);
    ok(ret !== false, 'return uuid:' + ret.uuid);
    requestUUID1 = ret.uuid;
    var request = {
      method : 'GET',
      url : 'http://developer.apple.com/iOS',
      body : 'username=chao'
    };
    var labels = ["apple", "developer","tutorial","iOS", "mac"];
    var ret = restclient.sqlite.saveRequest(request, "example#2", 0, labels);
    ok(ret !== false, 'return uuid:' + ret.uuid);
    requestUUID2 = ret.uuid;
  });
  
  test("Test save and get history function", function () {
    var request = {
      method : 'GET',
      url : 'https://developer.mozilla.org/en/Storage',
      body : 'a=b&c=d'
    };
    var historyId = restclient.sqlite.saveHistory(request);
    ok(historyId !== false, 'History saved, return: ' + JSON.stringify(historyId));

    var ret = restclient.sqlite.getHistoryById(historyId);
    ok(ret !== false, 'History retrieved [' + historyId + '], return: ' + JSON.stringify(ret));
  });
  
  test("Test get request by name function and get request by id", function(){
    var result = restclient.sqlite.getRequestByName("example#1");
    ok(typeof result === 'object', 'request not existed');
    
    var request = restclient.sqlite.getRequestByUUID(result.uuid);
    ok(result.requestName === request.requestName, 'Get request:' + JSON.stringify(request));
  });
  
  test("Test get labels", function(){
    var labels = restclient.sqlite.getLabels();
    ok(labels['unittest'] === 1, 'labels:' + JSON.stringify(labels));
  });
  
  test("Test get requests by labels", function(){
    var requests = restclient.sqlite.getRequestsByLabels('apple');
    ok(requests.length == 2, 'requests:' + requests.length + JSON.stringify(requests));
    
    var requests = restclient.sqlite.getRequestsByLabels(['apple']);
    ok(requests.length == 2, 'requests:' + requests.length + JSON.stringify(requests));
    
    var requests = restclient.sqlite.getRequestsByLabels(['iOS']);
    ok(requests.length == 1, 'requests:' + requests.length + JSON.stringify(requests));
    
    var requests = restclient.sqlite.getRequestsByLabels(['apple','unittest']);
    ok(requests.length == 1, 'requests:' + requests.length + JSON.stringify(requests));
  });
  
  test("Test find requests by keyword", function(){
    var requests = restclient.sqlite.findRequestsByKeywordAndLabels('developer');
    ok(requests.length == 2, 'requests:' + requests.length + JSON.stringify(requests));
    
    var requests = restclient.sqlite.findRequestsByKeywordAndLabels('developer', 'apple');
    ok(requests.length == 2, 'requests:' + requests.length + JSON.stringify(requests));
    
    var requests = restclient.sqlite.findRequestsByKeywordAndLabels('developer', ['unittest','apple']);
    ok(requests.length == 1, 'requests:' + requests.length + JSON.stringify(requests));
  });
  
  test("Test update request favorite", function(){
    var ret = restclient.sqlite.updateRequestFavorite(requestUUID2, 1);
    var result = restclient.sqlite.getRequestByName("example#1");
    ok(result.favorite === 1, 'updated favorite okay' + JSON.stringify(result));
  });
  
  test("Test update request name", function(){
    var ret = restclient.sqlite.updateRequestName(requestUUID2, "example#2updated");
    var result = restclient.sqlite.getRequestByName("example#2updated");
    ok(result !== false, 'updated name okay' + JSON.stringify(result));
  });
  
  test("Test remove label cascade", function(){
    var request = {
      method : 'GET',
      url : 'http://developer.zaker.com/iOS',
      body : 'username=beijing'
    };
    var labels = ["zaker", "cascade"];
    var ret = restclient.sqlite.saveRequest(request, "cascade#1", 0, labels);
    var uuid = ret.uuid;
    ok(ret !== false, 'return uuid:' + ret.uuid);
    
    var ret = restclient.sqlite.removeLabel("zaker", false);
    ok(ret !== false, 'removed');
    
    var result = restclient.sqlite.getRequestByName("cascade#1");
    ok(result.uuid == uuid, "not cascade okay");
    
    var ret = restclient.sqlite.removeLabel("cascade", true);
    ok(ret !== false, 'removed');
    
    var result = restclient.sqlite.getRequestByName("cascade#1");
    ok(result === false, "cascade okay" + JSON.stringify(result));
  });
  
  test("insert 100 requests to sqlite", function () {
    var labels = ["arguments", "javascript", "php", "twitter","qunit", "overlay", "oracle", "mysql", "message", "jquery",
    "google", "amazon", "facebook", "oauth", "js", "json", "beijing", "shanghai", "paris"];
    for(var i = 0; i < 100; i++) {
      var request = {
        method : 'POST',
        url : 'https://developer.mozilla.org/en/Example',
        body : 'a=b&c=d'
      };
      var l = _.sample(labels, _.random(1,8) ) 
      
      var ret = restclient.sqlite.saveRequest(request, "example#000" + i, 0, l);
    }
  });
  
  asyncTest("Test close sqlite", function(){
    restclient.sqlite.close();
    expect(1);
    setTimeout(function() {
        ok( true, "Passed and ready to resume!" );
        start();
      }, 1000);
  });
  
});