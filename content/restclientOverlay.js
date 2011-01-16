function restoreRestClientTab(aEvent) {
  var theTab = aEvent.originalTarget;
  var theTabBrowser = gBrowser.getBrowserForTab(theTab);
  var tabWindow = gBrowser.getBrowserForTab(theTab).contentWindow.wrappedJSObject;

  if (typeof tabWindow.restclient != "undefined") {
    tabWindow.restclient.restoreRestClientTab(theTab);

    // bring back the icon
    setTimeout(function () { gBrowser.setIcon(theTab, "chrome://restclient/skin/logo16.png"); }, 500);
  }
}
document.addEventListener("SSTabRestored", restoreRestClientTab, false);


function storeRestClientTab(aEvent) {
  var theTab = aEvent.originalTarget;
  var theTabBrowser = gBrowser.getBrowserForTab(theTab);
  var tabWindow = gBrowser.getBrowserForTab(theTab).contentWindow.wrappedJSObject;

  if (typeof tabWindow.restclient != "undefined") {
    tabWindow.restclient.storeRestClientTab(theTab);
  }
}
document.addEventListener("SSTabClosing", storeRestClientTab, false);


function ShutdownObserver() {}
ShutdownObserver.prototype = {
  observe: function(subject, topic, data) {

    var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                           .getInterface(Components.interfaces.nsIWebNavigation)
                           .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                           .rootTreeItem
                           .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                           .getInterface(Components.interfaces.nsIDOMWindow);
    var container = mainWindow.getBrowser().tabContainer;
    for (var i=0; i<container.childNodes.length;i++) {
      var tabWindow = mainWindow.getBrowser().getBrowserForTab(
        container.childNodes[i]).
        contentWindow.wrappedJSObject;

      if (typeof tabWindow.restclient != "undefined") {
        tabWindow.restclient.storeRestClientTab(container.childNodes[i]);
      }
    }
  }
}
var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
observerService.addObserver(new ShutdownObserver(), "quit-application-requested", false);


function loadRestClient() {
    var theTab          = gBrowser.addTab('chrome://restclient/content/restclient.xul');
    theTab.label        = "REST Client";
    gBrowser.selectedTab = theTab;

    setTimeout(function () { gBrowser.setIcon(theTab, "chrome://restclient/skin/logo16.png"); }, 500);
}