function restoreRestClientTab(aEvent) {
  var store = Components.classes["@mozilla.org/browser/sessionstore;1"].
               getService(Components.interfaces.nsISessionStore);

  var theTab = aEvent.originalTarget;
  var theTabBrowser = gBrowser.getBrowserForTab(theTab);

  var tbRequestBody = theTabBrowser.contentDocument.getElementById('tbRequestBody');
  var tbRequestUrl = theTabBrowser.contentDocument.getElementById('tbRequestUrl');
  var requestMethod = theTabBrowser.contentDocument.getElementById('requestMethod');
  var reqMethodChilds = theTabBrowser.contentDocument.getElementById('requestMethod').childNodes[0].childNodes;
  var reqHeaderChilds = theTabBrowser.contentDocument.getElementById('reqHeaderChilds');
  if (tbRequestBody != null) {
    var data = store.getTabValue(aEvent.originalTarget, "tab-controller");
    var tabController = new TabController();
    if (data != "undefined") {
        tabController.fromString(data);
    }

    tbRequestBody.wrappedJSObject.value = tabController.requestBody;
    tbRequestUrl.wrappedJSObject.value = tabController.requestUrl;
    var reqHeaderList = tabController.headerList;
    for (headerKey in reqHeaderList) {
      var headerValue = reqHeaderList[headerKey];

      var item = theTabBrowser.contentDocument.createElement('treeitem');
      var row  = theTabBrowser.contentDocument.createElement('treerow');
      var c1   =  theTabBrowser.contentDocument.createElement('treecell');
      var c2   =  theTabBrowser.contentDocument.createElement('treecell');
      c1.setAttribute('label', headerKey);
      c2.setAttribute('label', headerValue);
      row.appendChild(c1);
      row.appendChild(c2);
      item.appendChild(row);
      reqHeaderChilds.appendChild(item);
    }

    var child = null;
    for (childIndex in reqMethodChilds) {
      var child = reqMethodChilds[childIndex];
      if (typeof child == 'object' && child.getAttribute('label') == tabController.requestMethod) {
        break;
      }          
    }
    if (child != null) {
      requestMethod.wrappedJSObject.selectedItem = child;
    }

    // bring back the icon
    var func = function () { gBrowser.setIcon(theTab, "chrome://restclient/skin/logo16.png"); };
    setTimeout(func, 500);
  }
}
document.addEventListener("SSTabRestored", restoreRestClientTab, false);

function storeRestClientTab(aEvent) {
  var store = Components.classes["@mozilla.org/browser/sessionstore;1"].
              getService(Components.interfaces.nsISessionStore);

  var theTab = aEvent.originalTarget;
  var theTabBrowser = gBrowser.getBrowserForTab(theTab);
  var tabDocument = theTabBrowser.contentDocument.wrappedJSObject;

  var requestUrl = tabDocument.getElementById("tbRequestUrl").value;
  var requestMethod = tabDocument.getElementById("requestMethod").selectedItem.getAttribute('label');
  var requestBody = tabDocument.getElementById("tbRequestBody").value;
  var reqHeaderChilds = tabDocument.getElementById('reqHeaderChilds');
  var requestHeaderList = {};

  for (var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--){
    var headerKey = reqHeaderChilds.childNodes[i].childNodes[0].childNodes[0].getAttribute('label')
    var headerValue = reqHeaderChilds.childNodes[i].childNodes[0].childNodes[1].getAttribute('label')
    
    requestHeaderList[headerKey] = headerValue;
  }

  var tabController = new TabController();
  tabController.requestUrl = requestUrl;
  tabController.requestMethod = requestMethod;
  tabController.requestBody = requestBody;
  tabController.headerList = requestHeaderList;
  store.setTabValue(aEvent.originalTarget, "tab-controller", tabController.toString());
}
document.addEventListener("SSTabClosing", storeRestClientTab, false);

var observerService = Component.classes["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);


function loadRestClient() {
    var theTab          = gBrowser.addTab('chrome://restclient/content/restclient.xul');
    theTab.label        = "REST Client";
    gBrowser.selectedTab = theTab;

    var func = function () { gBrowser.setIcon(theTab, "chrome://restclient/skin/logo16.png"); };
    setTimeout(func, 500);
}


