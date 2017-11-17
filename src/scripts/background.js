import ext from "./utils/ext";

var xhr = new XMLHttpRequest();
var sendResponse = function(response) { 
    response.target = 'index';
    ext.runtime.sendMessage(response);
};

xhr.onprogress = function (evt) {
    if (evt.lengthComputable) {
        var percentComplete = evt.loaded * 100 / evt.total;

        if (evt.loaded == evt.total) {
            sendResponse({ action: "update-progress-label", data: 'Sending data...' });
            sendResponse({ action: "update-progress-bar", data: 0 });
        }
        else {
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

            xhr.send();
        }
        if (request.action == "abort-http-request")
        {
            xhr.abort();
        }
    }
);