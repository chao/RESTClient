var util = {

  mlog : function(text) {
    Components.classes["@mozilla.org/consoleservice;1"]
      .getService(Components.interfaces.nsIConsoleService)
      .logStringMessage("RESTClient: "+text);
  },

  addEventListener : function(obj, type, listener) {
     if (typeof(obj) == "string") obj = document.getElementById(obj);
     if (obj) obj.addEventListener(type, listener, false);
  },

  removeEventListener : function(obj, type, listener) {
     if (typeof(obj) == "string") obj = document.getElementById(obj);
     if (obj) obj.removeEventListener(type, listener, false);
  },

  addEventListenerByTagName : function(tag, type, listener) {
     var objs = document.getElementsByTagName(tag);
     for (var i = 0; i < objs.length; i++) {
        objs[i].addEventListener(type, listener, false);
     }
  },

  removeEventListenerByTagName : function(tag, type, listener) {
     var objs = document.getElementsByTagName(tag);
     for (var i = 0; i < objs.length; i++) {
        objs[i].removeEventListener(type, listener, false);
     }
  },

  trim : function(s) {
     if (s) return s.replace(/^\s+/g,"").replace(/\s+$/g,""); else return "";
  },

  startsWith : function(s, prefix) {
     if (s) return( (s.substring(0, prefix.length) == prefix) ); else return false;
  },

  getBoolPref : function(prefName, defval) {
     var result = defval;
     var prefservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
     var prefs = prefservice.getBranch("extensions.porphyry.");
     if (prefs.getPrefType(prefName) == prefs.PREF_BOOL) {
         try { result = prefs.getBoolPref(prefName); }catch(e){}
     }
     return(result);
  },

  getIntPref : function(prefName, defval) {
     var result = defval;
     var prefservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
     var prefs = prefservice.getBranch("extensions.porphyry.");
     if (prefs.getPrefType(prefName) == prefs.PREF_INT) {
         try { result = prefs.getIntPref(prefName); }catch(e){}
     }
     return(result);
  },

  getStrPref : function(prefName, defval) {
     var result = defval;
     var prefservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
     var prefs = prefservice.getBranch("extensions.porphyry.");
     if (prefs.getPrefType(prefName) == prefs.PREF_STRING) {
         try { result = prefs.getComplexValue(prefName, Components.interfaces.nsISupportsString).data; }catch(e){}
     }
     return(result);
  },

  //-----------------------------------------------------------------------------

  setBoolPref : function(prefName, value) {
     var prefservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
     var prefs = prefservice.getBranch("extensions.porphyry.");
     try { prefs.setBoolPref(prefName, value); } catch(e){}
  },

  setIntPref : function(prefName, value) {
     var prefservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
     var prefs = prefservice.getBranch("extensions.porphyry.");
     try { prefs.setIntPref(prefName, value); } catch(e){}
  },

  setStrPref : function(prefName, value) {
     var prefservice = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
     var prefs = prefservice.getBranch("extensions.porphyry.");
     var sString = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
     sString.data = value;
     try { prefs.setComplexValue(prefName, Components.interfaces.nsISupportsString, sString); } catch(e){}
  },

  //-----------------------------------------------------------------------------

  getDefaultCharset : function(defval) {
     var charset = util.getStrPref("porphyry.intl.charset.default", "");
     if (charset.length) return charset;
  	var gPrefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch);
  	if(gPrefs.prefHasUserValue("intl.charset.default")) {
  	   return gPrefs.getCharPref("intl.charset.default");
  	} else {
  	   var strBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
  	   var intlMess = strBundle.createBundle("chrome://global-platform/locale/intl.properties");
  	   try {
  	      return intlMess.GetStringFromName("intl.charset.default");
  	   } catch(e) {
     	   return defval;
        }
  	}
  },

  convertToUTF8 : function(data, charset) {
     try {
        data = decodeURI(data);
     }catch(e){
        if (!charset) charset = gporphyry.getDefaultCharset();
        if (charset) {
           var uc = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
           try {
              uc.charset = charset;
              data = uc.ConvertToUnicode(unescape(data));
              data = decodeURI(data);
           }catch(e){}
           uc.Finish();
        }
     }
     return data;
  },

  convertToASCII : function(data, charset) {
     if (!charset) charset = gporphyry.getDefaultCharset();
     if (charset) {
        var uc = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
        uc.charset = charset;
        try {
           data = uc.ConvertFromUnicode(data);
        }catch(e){
           data = uc.ConvertToUnicode(unescape(data));
           data = decodeURI(data);
           data = uc.ConvertFromUnicode(data);
        }
        uc.Finish();
     }
     return data;
  },

  //-----------------------------------------------------------------------------
  isURL : function (url) {
    /*var rx = new RegExp("http(s)?://([\\w-]+\\.)+[\\w-]+(/[\\w-\\+ ./?%:&=#\\[\\]]*)?");
    var matches = rx.exec(url);
    return (matches != null && url == matches[0]); */
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(url);
  },

  getUrlDomain : function(url) {
     if (url && !gporphyry.startsWith(url, "about:")) {
        if (/^file:\/\/.*/.test(url)) return url;
        var matches = url.match(/^([A-Za-z]+:\/+)*([^\:^\/]+):?(\d*)(\/.*)*/);
        if (matches) url = matches[1]+matches[2]+(matches[3]==""?"":":"+matches[3])+"/";
     }
     return url;
  },

  getUrlHost : function(url) {
    if (url && !gporphyry.startsWith(url, "about:")) {
      if (/^file:\/\/.*/.test(url)) return url;
      var matches = url.match(/^([A-Za-z]+:\/+)*([^\:^\/]+):?(\d*)(\/.*)*/);
      if (matches) url = matches[2];
    }
    return url;
  }
//-----------------------------------------------------------------------------
}