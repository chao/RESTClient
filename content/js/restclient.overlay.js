"use strict";

restclient.overlay = {
  init : function() {
    restclient.init();
    restclient.overlay.firstRun();
  },
  firstRun : function() {
    var firstRunPref = "extensions.restclient.firstRunDone";
    if(!restclient.getPref(firstRunPref, false))
    {
      var navbar = document.getElementById("nav-bar");
      var newset = navbar.currentSet + ',restclient-navbar-button';
      navbar.currentSet = newset;
      navbar.setAttribute("currentset", newset );
      document.persist("nav-bar", "currentset");
      gBrowser.selectedTab = gBrowser.addTab("http://www.restclient.net/");  
      restclient.setPref(firstRunPref, true);
    }
  },
  open: function(){
    alert('load');
  }
}
window.addEventListener("load", function(){ restclient.overlay.init();  }, false);
window.addEventListener("unload", function(){ }, false);