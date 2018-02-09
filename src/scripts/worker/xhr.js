let currentRequest = false;
var XHR = {
  onLoadProgress(evt) {
    console.log('[xhr.js][onLoadProgress]', evt);
    if (evt.lengthComputable) {
      var percentComplete = evt.loaded * 100 / evt.total;

      if (evt.loaded < evt.total) {
        postMessage({ action: "update-progress-label", data: "jsXhrSending"});
        postMessage({ action: "update-progress-bar", data: percentComplete });
      }
    }
  },

  onLoad(evt, startedAt) {
    console.log('[xhr.js][onLoad]', evt);
    postMessage({ action: "set-progress-bar-animated", data: "jsXhrOnLoad" });
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
    response.response = xhr.response;
    if (contentType && contentType.indexOf('image') >= 0) {
      var toConvert = "";
      for (var i = 0; i < response.body.length; i++) {
        toConvert += String.fromCharCode(response.body.charCodeAt(i) & 0xff);
      }
      var base64encoded = btoa(toConvert);
      response.image = "data:" + contentType + ";base64," + base64encoded;
    }
    postMessage({ action: "hide-overlay" });
    postMessage({ action: "http-request-load", data: response });
  },

  onProgress(evt) {
    console.log('[xhr.js][onProgress]', evt);
    if (evt.lengthComputable) {
      var percentComplete = evt.loaded * 100 / evt.total;

      if (evt.loaded < evt.total) {
        postMessage({ action: "update-progress-label", data: "jsXhrOnProgressReceving" });
        postMessage({ action: "update-progress-bar", data: percentComplete });
      }
      console.log(`[xhr.js][onProgress] percentComplete: ${percentComplete}`);
    }
    else {
      postMessage({ action: "set-progress-bar-animated", data: "jsXhrOnProgressProcessing" });
      console.log('[xhr.js][onProgress] Processing...');
    }
  },

  onAbort(evt) {
    console.log('[xhr.js][onAbort]', evt);
    postMessage({ action: "abort-http-request" });
  },

  onTimeout(evt) {
    console.log('[xhr.js][onTimeout]', evt);
    postMessage({ action: "http-request-timeout" });
  },

  onError(evt) {
    console.log('[xhr.js][onError]', evt);
    let xhr = evt.target;
    postMessage({
      action: "http-request-error",
      data: {
        readyState: xhr.readyState,
        status: xhr.status
      }
    });
  },

  makeRequest(request) {
    var xhr = new XMLHttpRequest();
    postMessage({ action: "set-progress-bar-animated", data: "jsXhrMakeRequestStart" });
    var req = {
      'method': request.method || 'GET',
      'url': request.url || '',
      'headers': request.headers || [],
      'body': request.body || '',
    }
    console.log('[xhr.js] start to send request', req);
    xhr.open(req.method, req.url, true);
    postMessage({ action: "start-counting" });
    console.log('[xhr.js] Initiating XMLHttpRequest...');
    postMessage({ action: "update-progress-label", data: "jsXhrMakeRequestInitiating" });

    var overrideMimeType = true;
    for (var i = 0, header; header = req.headers[i]; i++) {
      xhr.setRequestHeader(header['name'], header['value']);

      //Override XMLHTTPRequest default charset
      if (header['name'].toLowerCase() == 'content-type') {
        overrideMimeType = false;
      }
      if (header['name'].toLowerCase() == 'content-type' && header['value'].toLowerCase().indexOf('charset') > -1) {
        xhr.overrideMimeType(header['value']);
      }
    }

    if (overrideMimeType) {
      xhr.overrideMimeType('text\/plain; charset=x-user-defined');
    }

    var startedAt = new Date().getTime();
    var self = this;
    xhr.upload.addEventListener('onprogress', this.onLoadProgress, false);

    xhr.addEventListener("load", function (evt) {
      self.onLoad(evt, startedAt);
    }, false);

    xhr.addEventListener("progress", this.onProgress, false);
    xhr.addEventListener('abort', this.onAbort, false);
    xhr.addEventListener('timeout', this.onTimeout, false);
    xhr.addEventListener('error', this.onError, false);

    if (typeof req.body != 'undefined' && req.body.length > 0) {
      xhr.send(req.body);
    }
    else {
      xhr.send();
    }
    return xhr;
  }
}

onmessage = function (oEvent) {
  if (typeof oEvent.data == 'object')
  {
    console.log('[xhr.js][onmessage]', oEvent.data);
    currentRequest = XHR.makeRequest(oEvent.data);
  }
  else
  {
    if (oEvent.data == 'abort-http-request' && currentRequest != false)
    {
      currentRequest.abort();
    }
  }
};