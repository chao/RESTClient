"use strict";

restclient.http = {
  sendRequest: function(requestMethod, requestUrl, requestHeaders, requestBody) {
    try{
      restclient.main.updateProgressBar(100);
      restclient.main.showResponse();
      var xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
      xhr.onerror = restclient.http.onerror;
      xhr.onload = restclient.http.onload;
      xhr.onprogress = restclient.http.onprogress;
      xhr.open(requestMethod, requestUrl, true);
      xhr.setRequestHeader("Accept-Language", null);
      for(var i=0, header; header = requestHeaders[i]; i++) {
        xhr.setRequestHeader(header[0], header[1]);
      }
      restclient.http.xhr = xhr;
      //xhr.overrideMimeType("text/xml; charset=x-user-defined");
      xhr.send(requestBody);
    } catch (e) {
      restclient.main.setResponseHeader("Error: Could not connect to server\n" 
        + "Error:" + e.getMessage(), false);
    }
  },
  onprogress: function(evt) {
    //console.log(evt.position * 100 / evt.totalSize + "," + evt.position + "," + evt.totalSize);
    var percentComplete = evt.position * 100 / evt.totalSize;
    restclient.main.updateProgressBar(percentComplete, 'Receving data...');
    if(evt.position == evt.totalSize)
      restclient.main.updateProgressBar(-1, 'Sending data...');
  },
  onerror: function(xhr) {
    //console.log(xhr);
    restclient.main.clearResult();
    restclient.main.updateProgressBar(-1);
    restclient.main.setResponseHeader("Error: Could not connect to server", false);
  },
  onload: function(xhr) {
    //console.log(xhr);
    restclient.main.clearResult();
    xhr = xhr.target;
    var responseHeader = "";
    responseHeader += "Status Code: " + xhr.status + " " + xhr.statusText + "\n";

    responseHeader += xhr.getAllResponseHeaders();
    //console.log(responseHeader);
    restclient.main.setResponseHeader(responseHeader);
    
    var contentType = xhr.getResponseHeader("Content-Type");
    
    if(contentType.indexOf('html') >= 0)
    {
      restclient.main.displayHtml(xhr);
    }
    else
      if(contentType.indexOf('xml') >= 0)
      {
        restclient.main.displayXml(xhr);
      }
      else
        if(contentType.indexOf('json') >= 0)
        {
          restclient.main.displayJson(xhr);
        }
        else
          if (contentType.indexOf('image') >= 0) 
          {
            restclient.main.displayImage(xhr);
          }
          else
          {
            restclient.main.display(xhr);
          }
    window.prettyPrint && prettyPrint();
    //restclient.main.updateProgressBar(-1);
  },
  abortRequest: function(){
    if(!restclient.http.xhr)
      return false;
    restclient.http.xhr.abort();
    restclient.main.clearResult();
    restclient.main.updateProgressBar(-1);
  }
}