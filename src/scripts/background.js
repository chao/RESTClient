import ext from "./utils/ext";

// Open a new RESTClient tab when the icon was clicked
browser.browserAction.onClicked.addListener(function () {
    ext.tabs.create({
        'url': ext.extension.getURL('index.html')
    });
});

ext.runtime.onMessage.addListener(
    function (request, sender, callback) {
        console.log(request.action);
        if (request.action === "execute-http-request") {
            console.log(request.data);
            ext.runtime.sendMessage({ action: "update-progress-bar", data: 100 });
        }
    }
);