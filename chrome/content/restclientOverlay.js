function loadRestClient() {
    var theTab          = gBrowser.addTab('chrome://restclient/content/restclient.xul');
    theTab.label        = "REST Client";
    gBrowser.selectedTab = theTab;
    var func = function () { gBrowser.setIcon(theTab, "chrome://restclient/skin/logo16.png"); };
    setTimeout(func, 500);
}