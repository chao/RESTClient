/*******************************************************************************
 *  Object used to listen to tab events and keep track of controllers
 *
 *  @param    func           The controller function to instantiate.
 *  
 *  @version 1.0
 ******************************************************************************/
function TabListener(func) {
  this.func = func;
  
  // get the session store
  this.store = Components.classes["@mozilla.org/browser/sessionstore;1"].
               getService(Components.interfaces.nsISessionStore);

  if (func != null) {
  // prefill the controller array
  this.prefill();
  
  // add session event listeners
  document.addEventListener("SSTabRestoring", this, false);
  document.addEventListener("SSTabClosing", this, false);
  
  // add tab event listeners
  var container = getBrowser().tabContainer;
  container.addEventListener("TabOpen", this, false);
  container.addEventListener("TabMove", this, false);
  container.addEventListener("TabClose", this, false);  
  container.addEventListener("TabSelect", this, false);
  
  // add the private browsing observer
  var os = Components.classes["@mozilla.org/observer-service;1"].
           getService(Components.interfaces.nsIObserverService);
  os.addObserver(this, "private-browsing", true);
  }
}
TabListener.prototype = {
  func: null,
  store: null,
  
  /**
   * Array of controllers stored in the same order as tabs.
   */
  _controllers: null,
  get controllers() { return this._controllers; },
  set controllers(val) { this._controllers = val; },
  
  /**
   * Index of the selected tab.
   */
  _index: null,
  get index() { return this._index; },
  set index(val) { this._index = val; },
  
  /**
   * Controller for the selected tab.
   */
  get selected() { return this.controllers[this.index]; },
  
  /**
   * Prefill the array of controllers.
   */
  prefill: function TabListener_prefill() {
    
    // set the index to the selected tab index
    this.index = getBrowser().selectedTab._tPos;
    
    // loop through the open tabs and instantiate a controller for each tab.
    controllers = []    
    var container = getBrowser().tabContainer;
    for (var i=0; i<container.childNodes.length; i++)
      controllers.append(new this.func());
    this.controllers = controllers;
  },

  /* ::::: nsIDOMEventListener ::::: */
  handleEvent: function urlnavOverlay_handleEvent(event) {
    var index = event.originalTarget._tPos;
    var controller;
    
    switch (event.type) {
      
    // tab open - store a new controller in the array
    case "TabOpen":
      this.controllers.splice(index, 0, new this.func());
      break;
    
    // tab is being restored - restore controller from the session store
    case "SSTabRestoring":
      controller = this.controllers[index];
      var data = this.store.getTabValue(event.originalTarget, "tab-controller");
      if (data != "undefined")
        controller.fromString(data);
      break;
    
    // user moved the tab - move the controller in the array
    case "TabMove":
      var oldIndex = event.detail;
      this.controllers.splice(index, 0, this.controllers.splice(oldIndex, 1)[0]);
      break;
    
    // tab is closing - save state to the session store
    case "SSTabClosing":
      controller = this.controllers[index];
      this.store.setTabValue(event.originalTarget, "tab-controller", controller.toString());
      break;
    
    // tab is closed - remove the controller from the array
    case "TabClose":
      this.controllers.splice(index, 1);
      break;
    
    // tab is selected - change the stored tab index
    case "TabSelect":
      this.index = index;
      break;
    
    default:
      return;
    }
  },
  
  /* ::::: nsIObserver ::::: */
  observe: function urlnavOverlay_observe(subject, topic, data) {
    
    // make sure it's the private browsing topic
    if (topic != "private-browsing")
      return;
    
    // reset the controllers
    this.prefill();
  },
  
  /* ::::: nsISupports ::::: */
  QueryInterface: function TabListener_QI(iid) {
    if (iid.equals(Components.interfaces.nsIDOMEventListener) ||
        iid.equals(Components.interfaces.nsIObserver) ||
        iid.equals(Components.interfaces.nsISupportsWeakReference) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_ERROR_NO_INTERFACE;
  }    
}


