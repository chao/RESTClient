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

restclient.sqlite = {
  db: null,
  tables: {
    requests: "id TEXT PRIMARY KEY, request_method TEXT, request_url TEXT, request_body TEXT, request TEXT,created_datetime TEXT,last_executed TEXT"
  },
  open: function() {
    try{
      var file = restclient.FileUtils.getFile("ProfD", ["restclient.sqlite"]);
      //console.log(file.path);
      restclient.sqlite.db = restclient.Services.storage.openDatabase(file);
      return true;
    }
    catch(e) {
      console.error(e);
    }
    return false;
  },
  close: function() {
    try{
      restclient.db.asyncClose();
    }
    catch(e) {
      console.error(e);
    }
  },
  initTables: function(force) {
    if(restclient.sqlite.db.tableExists('requests'))
    {
      if (force)
      {
        restclient.sqlite.db.executeSimpleSQL('DELETE FROM requests');
      }
    }
    else
      restclient.sqlite.db.createTable('requests', restclient.sqlite.tables['requests']);
  },
  saveRequest: function(request, callback) {
    var id = "request-" + restclient.helper.sha1(JSON.stringify(request));
    var savedRequest = restclient.sqlite.getRequest(id);
    var last_executed = new Date().valueOf();
    if(savedRequest === false) {
      var created_datetime = new Date().valueOf();
      var stmt = restclient.sqlite.db.createStatement("INSERT INTO requests (id,request_method, request_url, request_body, request, created_datetime, last_executed) VALUES "
                                                     + "(:id, :request_method, :request_url, :request_body, :request, :created_datetime, :last_executed)");
      var params = stmt.newBindingParamsArray(),
          binding = params.newBindingParams();

      binding.bindByName("id", id);
      binding.bindByName("request_method", request.method);
      binding.bindByName("request_url", request.url);
      binding.bindByName("request_body", request.body);
      binding.bindByName("request", JSON.stringify(request));
      binding.bindByName("created_datetime", created_datetime);
      binding.bindByName("last_executed", last_executed);

      params.addParams(binding);
      stmt.bindParameters(params);
      stmt.executeAsync({
        handleError: function(aError) {
          console.error("Error: " + aError.message);
        },
        handleCompletion: function(aReason) {
          if (aReason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED
              && typeof callback === 'function')
            callback.apply(restclient.main, [id]);
        }
      });
    }
    else
    {
      var stmt = restclient.sqlite.db.createStatement("UPDATE requests SET last_executed=:last_executed WHERE id=:id");
      var params = stmt.newBindingParamsArray(),
          binding = params.newBindingParams();

      binding.bindByName("id", id);
      binding.bindByName("last_executed", last_executed);

      params.addParams(binding);
      stmt.bindParameters(params);
      stmt.executeAsync({
        handleError: function(aError) {
          console.error("Error: " + aError.message);
        },
        handleCompletion: function(aReason) {
          if (aReason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED
              && typeof callback === 'function')
            callback.apply(restclient.main, [id]);
        }
      });
    }
  },
  getRequest: function(id){
    if(typeof id !== 'string' || id === '')
      return false;
    var stmt = restclient.sqlite.db.createStatement("SELECT request FROM requests WHERE id=:id");
    var params = stmt.newBindingParamsArray(),
        binding = params.newBindingParams();

    binding.bindByName("id", id);
    params.addParams(binding);
    stmt.bindParameters(params);
    while (stmt.executeStep()) {
      return stmt.row.request;
    }
    return false;
  },
  getRequestCount: function(){
    var stmt = restclient.sqlite.db.createStatement("SELECT count(id) as num FROM requests");
    while (stmt.executeStep()) {
      return stmt.row.num;
    }
    return false;
  }
}