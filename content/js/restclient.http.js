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

restclient.http = {
  mimeType : false,
  methods: ['GET','POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'],
  sendRequest: function(requestMethod, requestUrl, requestHeaders, mimeType, requestBody) {
    try{
      restclient.main.updateProgressBar(100);
      restclient.main.showResponse();
      restclient.http.mimeType = mimeType;
      //restclient.log(requestMethod);
      var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
      xhr.onerror = restclient.http.onerror;
      xhr.onload = restclient.http.onload;
      xhr.onprogress = restclient.http.onprogress;
      
      xhr.open(requestMethod, requestUrl, true);
      xhr.setRequestHeader("Accept-Language", null);

      for(var i=0, header; header = requestHeaders[i]; i++) {
        xhr.setRequestHeader(header[0], header[1]);
        
        //Override XMLHTTPRequest default charset
        if(typeof mimeType != 'string' && 
            header[0].toLowerCase() == 'content-type' && header[1].toLowerCase().indexOf('charset') > -1)
        {
          xhr.overrideMimeType(header[1]);
        }
      }

      if(typeof mimeType == 'string')
        xhr.overrideMimeType(mimeType);

      restclient.http.xhr = xhr;
      if(restclient.getPref('requestTimer', false) === true)
        restclient.http.startTime = new Date().getTime();
      else
        restclient.http.startTime = false;
        
      xhr.send(requestBody);
    } catch (e) {
      restclient.main.setResponseHeader({"Error": [
                                                  "Could not connect to server",
                                                  e.message
                                                  ]}, false);
      restclient.main.updateProgressBar(-1);
    }
  },
  onprogress: function(evt) {
    //restclient.log(evt.position * 100 / evt.totalSize + "," + evt.position + "," + evt.totalSize);
    var percentComplete = evt.position * 100 / evt.totalSize;
    restclient.main.updateProgressBar(percentComplete, 'Receving data...');
    if(evt.position == evt.totalSize)
      restclient.main.updateProgressBar(-1, 'Sending data...');
  },
  onerror: function(xhr) {
    restclient.main.clearResult();
    restclient.main.updateProgressBar(-1);
    restclient.main.setResponseHeader({"Error": "Could not connect to server"}, false);
  },
  onload: function(xhr) {
    if(restclient.http.startTime)
    {
      var requestTime = (new Date().getTime()) - restclient.http.startTime;
      restclient.main.showStatus('Execute Time : ' + requestTime + 'ms')
    }
    restclient.main.clearResult();
    xhr = xhr.target;
    var headers = {};
    headers["Status Code"] = xhr.status + " " + xhr.statusText;

    var headersText     = xhr.getAllResponseHeaders(),
        responseHeaders = headersText.split("\n"),
        key, value;

    for (var i = 0, header; header = responseHeaders[i]; i++) {
      if(header.indexOf(":") > 0) {
        key   = header.substring(0, header.indexOf(":"));
        value = xhr.getResponseHeader(key);
        if(value)
          headers[key] = value;
      }
    }
    headers["Status Code"] = xhr.status + " " + xhr.statusText;
    //restclient.log(headers);
    
    restclient.main.setResponseHeader(headers);
    var contentType = xhr.getResponseHeader("Content-Type");

    var displayHandler = 'display';
    if(contentType && contentType != '') {
      if(contentType.indexOf('html') >= 0) {
        displayHandler = 'displayHtml';
      }
      if(contentType.indexOf('xml') >= 0) {
        displayHandler = 'displayXml';
      }
      if(contentType.indexOf('json') >= 0) {
        displayHandler = 'displayJson';
      }
      if(contentType.indexOf('image') >= 0) {
        if(restclient.http.mimeType === false)
          displayHandler = 'displayImageRaw';
        else
          displayHandler = 'displayImage';
      }
    }
    
    // handle a zero length body
    if(xhr.responseText.length == 0) {
      displayHandler = 'displayImageRaw';
    }
    
    //restclient.log(displayHandler);
    //restclient.log(contentType);
    restclient.main.checkMimeType.apply(restclient.http, []);
    restclient.main[displayHandler].apply(restclient.http, []);
    
    restclient.main.updateProgressBar(-1);
  },
  abortRequest: function(){
    if(!restclient.http.xhr)
      return false;
    restclient.http.xhr.abort();
    restclient.main.clearResult();
    restclient.main.updateProgressBar(-1);
  }
}
