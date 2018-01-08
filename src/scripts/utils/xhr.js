var XHR = {
  onLoadProgress(evt, tabId) {
    console.log('[xhr.js][onLoadProgress]', evt, tabId);
    if (evt.lengthComputable) {
      var percentComplete = evt.loaded * 100 / evt.total;

      if (evt.loaded < evt.total) {
        this.sendResponse(tabId, { action: "update-progress-label", data: 'Sending data...' });
        this.sendResponse(tabId, { action: "update-progress-bar", data: percentComplete });
      }
    }
  },

  onLoad(evt, tabId, startedAt) {
    console.log('[xhr.js][onLoad]', evt, tabId);
    this.sendResponse(tabId, { action: "set-progress-bar-animated", data: "Successed! Processing result..." });
    var xhr = evt.currentTarget;
    var contentType = xhr.getResponseHeader("Content-Type");
    var response = {};
    response.timeCosted = (new Date().getTime()) - startedAt;
    response.headers = [];
    response.headers.push({ key: "Status Code", value: xhr.status + " " + xhr.statusText });
    var headersText = xhr.getAllResponseHeaders(),
      responseHeaders = headersText.split("\n"),
      key, value;

    for (var i = 0, header; header = responseHeaders[i]; i++) {
      if (header.indexOf(":") > 0) {
        key = header.substring(0, header.indexOf(":"));
        value = xhr.getResponseHeader(key);
        if (value) {
          response.headers.push({ key: key, value: value });
        }
      }
    }
    response.body = xhr.responseText;
    response.xml = xhr.responseXML;
    if (contentType && contentType.indexOf('image') >= 0) {
      var toConvert = "";
      for (var i = 0; i < response.body.length; i++) {
        toConvert += String.fromCharCode(response.body.charCodeAt(i) & 0xff);
      }
      var base64encoded = btoa(toConvert);
      response.image = "data:" + contentType + ";base64," + base64encoded;
    }
    this.sendResponse(tabId, { action: "hide-overlay" });
    this.sendResponse(tabId, { action: "http-request-load", data: response });
  },

  onProgress(evt, tabId) {
    console.log('[xhr.js][onProgress]', evt, tabId);
    if (evt.lengthComputable) {
      var percentComplete = evt.loaded * 100 / evt.total;

      if (evt.loaded < evt.total) {
        this.sendResponse(tabId, { action: "update-progress-label", data: 'Receving data...' });
        this.sendResponse(tabId, { action: "update-progress-bar", data: percentComplete });
      }
      console.log(`[xhr.js][onProgress] percentComplete: ${percentComplete}`);
    }
    else {
      this.sendResponse(senderTabId, { action: "set-progress-bar-animated", data: "Processing..." });
      console.log('[xhr.js][onProgress] Processing...');
    }
  },

  onAbort(evt, tabId) {
    console.log('[xhr.js][onAbort]', evt, tabId);
    this.sendResponse(tabId, { action: "abort-http-request" });
  },

  onTimeout(evt, tabId) {
    console.log('[xhr.js][onTimeout]', evt, tabId);
    this.sendResponse(tabId, { action: "http-request-timeout" });
  },

  onError(evt, tabId) {
    console.log('[xhr.js][onError]', evt, tabId);
    this.sendResponse(tabId, { action: "http-request-error", data: { "title": "Error", "detail": "Could not connect to server" } });
  },

  sendResponse(senderTabId, response) {
    response.target = 'index';
    response.senderTabId = senderTabId;
    browser.runtime.sendMessage(response);
  },

  makeRequest(request, sender) 
  {
    var senderTabId = sender.tab.id; // get the sender tab id
    var xhr = new XMLHttpRequest();
    this.sendResponse(senderTabId, { action: "set-progress-bar-animated", data: "Starting..." });
    var req = {
      'method': request.data.method || 'GET',
      'url': request.data.url || '',
      'headers': request.data.headers || [],
      'body': request.data.body || '',
    }
    console.log('[background.js] start to send request', req);
    xhr.open(req.method, req.url, true);
    this.sendResponse(senderTabId, { action: "start-counting" });
    console.log('[background.js] Initiating XMLHttpRequest...');
    this.sendResponse(senderTabId, { action: "update-progress-label", data: 'Initiating XMLHttpRequest...' });
    
    // if(req.method.toLowerCase() != 'delete')
    // {
    //   console.log('[background.js] set Accept-Language to null');
    //   xhr.setRequestHeader('Accept-Language', null);
    // }

    for (var i = 0, header; header = req.headers[i]; i++) {
      xhr.setRequestHeader(header['name'], header['value']);

      //Override XMLHTTPRequest default charset
      if (header['name'].toLowerCase() == 'content-type' && header['value'].toLowerCase().indexOf('charset') > -1) {
        xhr.overrideMimeType(header['value']);
      }
    }

    var startedAt = new Date().getTime();
    var self = this;
    xhr.upload.addEventListener('onprogress', function (evt) {
      self.onLoadProgress(evt, senderTabId);
    }, false);

    xhr.addEventListener("load", function (evt) {
      self.onLoad(evt, senderTabId, startedAt);
    }, false);

    xhr.addEventListener("onprogress", function (evt) {
      self.onProgress(evt, senderTabId);
    }, false);

    xhr.upload.addEventListener('onabort', function (evt) {
      self.onLoadProgress(evt, senderTabId);
    }, false);

    xhr.upload.addEventListener('ontimeout', function (evt) {
      self.onTimeout(evt, senderTabId);
    }, false);

    xhr.upload.addEventListener('onerror', function (evt) {
      self.onError(evt, senderTabId);
    }, false);

    if (typeof req.body != 'undefined' && req.body.length > 0)
    {
      xhr.send(req.body);
    }
    else
    {
      xhr.send();
    }
    return xhr;
  }
}
module.exports = XHR;