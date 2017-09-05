import ext from "./utils/ext";

// Open a new RESTClient tab when the icon was clicked
browser.browserAction.onClicked.addListener(function() {
  ext.tabs.create({'url': ext.extension.getURL('index.html')});
});

ext.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.action === "perform-save") {
      console.log("Extension Type: ", "/* @echo extension */");
      console.log("PERFORM AJAX", request.data);

      sendResponse({ action: "saved" });
    }
  }
);