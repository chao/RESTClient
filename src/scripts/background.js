import ext from "./utils/ext";

var xhr = new XMLHttpRequest();
var startedAt = false;
// xhr.timeout = 200000;
var sendResponse = function(response) { 
    response.target = 'index';
    ext.runtime.sendMessage(response);
};
xhr.upload.onprogress = function (evt) {
    console.log('[background] upload.onprogress');
    console.log(evt);
    if (evt.lengthComputable) {
        var percentComplete = evt.loaded * 100 / evt.total;

        if (evt.loaded < evt.total) {
            sendResponse({ action: "update-progress-label", data: 'Sending data...' });
            sendResponse({ action: "update-progress-bar", data: percentComplete });
        }
    }
}
xhr.onprogress = function (evt) {
    console.log(evt);
    if (evt.lengthComputable) {
        var percentComplete = evt.loaded * 100 / evt.total;

        if (evt.loaded < evt.total) {
            sendResponse({ action: "update-progress-label", data: 'Receving data...' });
            sendResponse({ action: "update-progress-bar", data: percentComplete });
        }
        console.log(percentComplete);
    }
    else {
        sendResponse({ action: "set-progress-bar-animated", data: "Processing..." });
        console.log('[background] Processing...');
    }
}
xhr.onload = function () {
    console.log('[background] hide-overlay');
    sendResponse({ action: "hide-overlay" });
}
xhr.onabort = function () {
    console.log('[background] abort');
    sendResponse({ action: "abort-http-request" });
}
xhr.ontimeout = function (e) {
    console.log('[background] timeout');
    sendResponse({ action: "http-request-timeout" });
}
xhr.onerror = function (e) {
    console.log('[background] error');
    sendResponse({ action: "http-request-error", data: { "title": "Error", "detail": "Could not connect to server"} });
}
xhr.onload = function(e) {
    console.log('[background] load');
    sendResponse({ action: "set-progress-bar-animated", data: "Successed! Processing result..." });
    console.log(e.target);
    var contentType = xhr.getResponseHeader("Content-Type");
    var response = {};
    response.timeCosted = (new Date().getTime()) - startedAt;
    response.headers = [];
    response.headers.push( {key: "Status Code", value: xhr.status + " " + xhr.statusText});
    var headersText = xhr.getAllResponseHeaders(),
        responseHeaders = headersText.split("\n"),
        key, value;

    for (var i = 0, header; header = responseHeaders[i]; i++) {
        if (header.indexOf(":") > 0) {
            key = header.substring(0, header.indexOf(":"));
            value = xhr.getResponseHeader(key);
            if (value)
            {
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
    sendResponse({ action: "http-request-load", data: response } );
}

// Open a new RESTClient tab when the icon was clicked
browser.browserAction.onClicked.addListener(function () {
    ext.tabs.create({
        'url': ext.extension.getURL('index.html')
    });
});

ext.runtime.onMessage.addListener(
    function (request, sender) {
        if (request.target !== 'background') {
            return false;
        }
        console.log(request.action);
        if (request.action === "execute-http-request") {
            sendResponse({ action: "set-progress-bar-animated", data: "Starting..." });
            var params = request.data;
            console.log(params);
            
            var requestMethod = params.method || 'GET';
            var requestUrl = params.url || '';
            var requestHeaders = params.headers || [];

            xhr.open(requestMethod, requestUrl, true);
            console.log('[background] start to send request');
            sendResponse({ action: "start-counting" });
            console.log('[background] Initiating XMLHttpRequest...');
            sendResponse({ action: "update-progress-label", data: 'Initiating XMLHttpRequest...' });
            xhr.setRequestHeader("Accept-Language", null);

            for (var i = 0, header; header = requestHeaders[i]; i++) {
                xhr.setRequestHeader(header['name'], header['value']);

                //Override XMLHTTPRequest default charset
                if (header['name'].toLowerCase() == 'content-type' && header['value'].toLowerCase().indexOf('charset') > -1) {
                    xhr.overrideMimeType(header['value']);
                }
            }
            startedAt = new Date().getTime();
            xhr.send();
        }
        if (request.action == "abort-http-request")
        {
            xhr.abort();
        }
    }
);