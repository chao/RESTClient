const HTMLNS = "http://www.w3.org/1999/xhtml";


var restclient = {
	passwordObject: null,
	_stringBundle: null,

	checkEnterKeyPress: function(evt){
		switch( evt.keyCode ){
			case 13:
				restclient.doRequest();
				break;
			default:
				break;
		}
    
    return true;
	},

	checkDeleteKeyPress: function(evt){
		switch( evt.keyCode ){
			case 46:
				restclient.deleteSelectedHeader();
				break;
			default:
				break;
		}
	},

	deleteSelectedHeader: function(){
	  var headerList = document.getElementById('headerList');
    var reqHeaderChilds = document.getElementById('reqHeaderChilds');
    if (headerList.view.selection.count > 0 && headerList.editingRow < 0) {
      for (var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--) {
         if (headerList.view.selection.isSelected(i))
            reqHeaderChilds.removeChild(reqHeaderChilds.childNodes[i]);
      }
    }
	},

	clearRequestHeader: function(){
        var reqHeaderChilds = document.getElementById('reqHeaderChilds');
        for (var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--) {
            reqHeaderChilds.removeChild(reqHeaderChilds.childNodes[i]);
        }
	},

  init: function(){
    var controller = new TabController();
    controller.tbRequestUrl = "dupa tam";

    this._stringBundle = document.getElementById("string-bundle");
	  this.updateSaveButton();
    var that = this;
    var requestMethodDropdown = document.getElementById('requestMethod');
    var requestUrlDropdown = document.getElementById('tbRequestUrl');
    requestMethodDropdown.addEventListener('command', function() { that.updateOAuthAuthorizationHeader(); }, false);
	},

	updateLogin: function(){
	  var login = document.getElementById("login-icon");
		if( ! this.isAuthorizationHeaderSet() ){
			login.label = this._stringBundle.getString("restclient.login");
			login.checked = false;
		}else{
			login.label = this._stringBundle.getString("restclient.logout");
			login.checked = true;
		}
	},
  
  isAuthorizationHeaderSet: function() {
	  var reqHeaderChilds = document.getElementById('reqHeaderChilds');
    for (var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--) {
      if(reqHeaderChilds.childNodes[i].childNodes[0].childNodes[0].getAttribute('label') == "Authorization") {
        return true;
      }
    }
    
    return false;
  },

	doLogin: function(){
		var login = document.getElementById("login-icon");
    
    // If the login button is already checked, clear the Authorization header and uncheck the button
		if(login.checked) {
      this.oAuthPasswordObject = null;
      this.removeHttpRequestHeader("Authorization");
      this.updateLogin();
      return;
    }
    
    // If the login button is not already checked, display the login dialog
    var passwordObject       = new Object();
    passwordObject.login     = "";
    passwordObject.password  = "";
    passwordObject.returnVal = false;
    window.openDialog("chrome://restclient/content/login.xul", "login", "chrome,modal,dialog,resizable,centerscreen", passwordObject);
    
    // If the user pressed cancel on the dialog, return
    if (!passwordObject.returnVal) {
      return;
    }
    
    
    // Basic authentication
    if(passwordObject.securityScheme == 0) {
      util.mlog("login[" + passwordObject.login + "] pass[" + passwordObject.password + "]");
      var auth = "Basic " + Base64.encode(passwordObject.login + ':' + passwordObject.password);
      util.mlog(auth);
      this.setHttpRequestHeader("Authorization", auth);
      
    // oAuth authentication
		} else {
      this.oAuthPasswordObject = passwordObject;
      this.setOAuthAuthorizationHeader(passwordObject);
    }
    
		this.updateLogin();
	},
  
  updateOAuthAuthorizationHeader: function() {
    // If the Authorization header and the oAuth credentials are already set,
    // update the Authorization header.
    if( this.isAuthorizationHeaderSet() && this.oAuthPasswordObject != null ) {
      this.setOAuthAuthorizationHeader(this.oAuthPasswordObject);
    }
  },
  
  setOAuthAuthorizationHeader: function(passwordObject) {
    var parameters = { oauth_signature_method: passwordObject.signatureMethod };
    
    var nullIfEmpty = function(str) { return (str == '') ? null : str; };
    var accessor = { consumerKey:    nullIfEmpty(passwordObject.consumerKey),
                     consumerSecret: nullIfEmpty(passwordObject.consumerSecret),
                     accessorSecret: nullIfEmpty(passwordObject.accessorSecret),
                     token:          nullIfEmpty(passwordObject.token),
                     tokenSecret:    nullIfEmpty(passwordObject.tokenSecret)
    };
    
    
    var action = document.getElementById('tbRequestUrl').value;
    var message = { action: action, parameters: parameters };
    message.method = document.getElementById('requestMethod').value;
    
    parameters.oauth_version   = passwordObject.autoVersion   ? null : passwordObject.version;
    parameters.oauth_nonce     = passwordObject.autoNonce     ? null : passwordObject.nonce;
    parameters.oauth_timestamp = passwordObject.autoTimestamp ? null : passwordObject.timestamp;
    OAuth.completeRequest(message, accessor);
    
    // The realm is just the URL with the parameters and anchor removed
    var realm = action;
    if(realm.indexOf('?') >= 0) {
      realm = realm.substring(0, realm.indexOf('?'));
    }
    if(realm.indexOf('#') >= 0) {
      realm = realm.substring(0, realm.indexOf('#'));
    }
    
    var auth = OAuth.getAuthorizationHeader(realm, message.parameters);
    this.setHttpRequestHeader("Authorization", auth);
  },

	addRequestHeader: function(){
		var headerObject       = new Object();
		headerObject.name     = "";
		headerObject.value  = "";
		headerObject.returnVal = false;
		window.openDialog("chrome://restclient/content/header.xul", "header", "chrome,modal,dialog,resizable,centerscreen", headerObject);

		if (headerObject.returnVal) {
		  	this.addHttpRequestHeader(headerObject.name, headerObject.value);
		}
	},

  setHttpRequestHeader: function(headerKey, headerValue){
    var header = this.getHttpRequestHeader(headerKey);
    if(header != null) {
      header.firstChild.childNodes[1].setAttribute('label', headerValue);
    } else {
      this.addHttpRequestHeader(headerKey, headerValue);
    }
  },
  
	addHttpRequestHeader: function(headerKey, headerValue){
  	var reqHeaderChilds = document.getElementById('reqHeaderChilds');
  	var item = document.createElement('treeitem');
  	var row = document.createElement('treerow');
 		var c1 = document.createElement('treecell');
 		var c2 = document.createElement('treecell');
  	c1.setAttribute('label', headerKey);
  	c2.setAttribute('label', headerValue);
  	row.appendChild(c1);
  	row.appendChild(c2);
  	item.appendChild(row);
  	reqHeaderChilds.appendChild(item);
  	return (reqHeaderChilds.childNodes.length-1);
	},

	removeHttpRequestHeader: function(headerKey){
    var header = this.getHttpRequestHeader(headerKey);
    if(header != null) {
      header.parentNode.removeChild(header);
    }
	},
  
	getHttpRequestHeader: function(headerKey){
    var reqHeaderChilds = document.getElementById('reqHeaderChilds');
    for (var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--) {
      if(reqHeaderChilds.childNodes[i].childNodes[0].childNodes[0].getAttribute('label') == headerKey) {
        return reqHeaderChilds.childNodes[i];
      }
    }
    
    return null;
	},
  

  saveHistory: function(strName, strUrl){
    var gFormHistory = Components.classes["@mozilla.org/satchel/form-history;1"].getService(Components.interfaces.nsIFormHistory ?
                                                                                            Components.interfaces.nsIFormHistory :
                                                                                            Components.interfaces.nsIFormHistory2);
    gFormHistory.addEntry(strName, strUrl);
    //alert(gFormHistory.rowCount);
  },

  doRequest: function(){
    var requestUrl = document.getElementById("tbRequestUrl").value;
    var requestMethod = document.getElementById("requestMethod").selectedItem.getAttribute('label');
    var requestBody = document.getElementById("tbRequestBody").value;
    var headerList = document.getElementById('headerList');
    var reqHeaderChilds = document.getElementById('reqHeaderChilds');

    if(!util.isURL(requestUrl)){
      alert('URL Error!');
      return;
    }
    
    // Update the OAuth Authorization header.
    // We need to do this here so that if the timestamp is set automatically it
    // will be set at the time the request is sent, not at the time the Authorization
    // request header is added
    this.updateOAuthAuthorizationHeader();
    
    this.saveHistory("rc-search-history", requestUrl);
    util.mlog("Send request: method[" + requestMethod + "] Url[" + requestUrl + "]");
    util.mlog("Body[" + requestMethod + "] Url[" + requestUrl + "]");
    try {
      var meter = document.getElementById("meter");
      meter.mode = "undetermined";
	    meter.value="50%";
      var xmlHttpRequest = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
      xmlHttpRequest.open(requestMethod, requestUrl, true);
      xmlHttpRequest.setRequestHeader("Accept-Language", null);

      for(var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--){
        var headerKey = reqHeaderChilds.childNodes[i].childNodes[0].childNodes[0].getAttribute('label')
        var headerValue = reqHeaderChilds.childNodes[i].childNodes[0].childNodes[1].getAttribute('label')
        util.mlog(headerKey);
        util.mlog(headerValue);
        xmlHttpRequest.setRequestHeader(headerKey, headerValue);
      }

      var startTime = new Date().getTime();
      xmlHttpRequest.onerror = function() { restclient.doErrorResponse(this); };
      xmlHttpRequest.onload = function() { restclient.doResponse(this, startTime); };
      // Required to handle binary (image) responses
      xmlHttpRequest.overrideMimeType("text/plain; charset=x-user-defined");
      xmlHttpRequest.send(requestBody);
    }
    catch (e) {
      util.mlog("getResource INFO:" + e.name + ": " + e.message);
    }
  },

  doPostResponse: function(xmlHttpRequest) {
      var meter = document.getElementById("meter");
	    meter.value="100%";
	    meter.mode = "determined";
      restclient.clearResult();
  },

  doErrorResponse: function(xmlHttpRequest) {
    restclient.doPostResponse();
    restclient.addHttpHeader("Error", "Could not connect to server");
  },

  doResponse: function(xmlHttpRequest, startTime) {
    restclient.doPostResponse();

    var millisString = this._stringBundle.getString("restclient.milliseconds");
    var bytesString = this._stringBundle.getString("restclient.bytes");

    var endTime = new Date().getTime();
    setTimeTaken((endTime - startTime) + " " + millisString);
    setBytes(xmlHttpRequest.responseText.length + " " + bytesString);

    var responseBody = document.getElementById('responseBody');
    try {
      var responseHeaderString = xmlHttpRequest.status + " " + xmlHttpRequest.statusText + "";
      restclient.addHttpHeader("Status Code", responseHeaderString);

			var headersText = xmlHttpRequest.getAllResponseHeaders();
			var responseHeaders = headersText.split("\n");
			for (i=0; i<responseHeaders.length; i++) {
				head = responseHeaders[i];
		    fieldNameEnding = head.indexOf(":");
		    if(fieldNameEnding > 0){
			    key = head.substring(0, fieldNameEnding);
			    headValue = head.substring(fieldNameEnding + 2, head.length);
			    headValue = headValue.replace(/\s$/, "");
			    restclient.addHttpHeader(key, headValue);
		    }
		  }

      var contentType = xmlHttpRequest.getResponseHeader("Content-Type");
      if (contentType.indexOf("image") >= 0) {
        this.displayImage(xmlHttpRequest.responseText, contentType);
      } else {
        responseBody.value = xmlHttpRequest.responseText;
      }

      if (contentType.indexOf("html") >= 0) {
        this.displayHtml(xmlHttpRequest.responseText);
      }

      if (contentType.indexOf("json") >= 0) {
        var outputDiv = document.getElementById("xmlContent");
        json2xul.prettyPrintJSON(outputDiv, xmlHttpRequest.responseText);
        return;
      }
      
		  var xmlDoc = xmlHttpRequest.responseXML;
		  if(xmlDoc == null)
		  	return;
		  var xslDocument = document.implementation.createDocument("", "dummy", null);
      xslDocument.onload = function (evt) {
        var xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xslDocument);
        var resultFragment = xsltProcessor.transformToFragment(xmlDoc, document);
        var oDiv = document.getElementById("xmlContent");
        oDiv.appendChild(resultFragment);
      };
      xslDocument.load("chrome://restclient/content/XMLPrettyPrint.xsl");

    }
    catch (e) {
      util.mlog("doResponse INFO:" + e.name + ": " + e.message);
    }
  },

  displayImage: function(responseData, contentType) {
    var toConvert = "";
    for(i = 0; i < responseData.length; i++){
      toConvert += String.fromCharCode(responseData.charCodeAt(i) & 0xff);
    }
    var base64encoded = btoa(toConvert);
    var imgSrc = "data:" + contentType + ";base64," + base64encoded;

    var hbox = document.createElement("hbox");
    hbox.setAttribute("pack", "center");
    hbox.setAttribute("flex", "1");

    var vbox = document.createElement("vbox");
    vbox.setAttribute("pack", "center");
    hbox.appendChild(vbox);

    var image = document.createElement("image");
    image.setAttribute("src", imgSrc);
    vbox.appendChild(image);

    document.getElementById("xmlContent").appendChild(hbox);
  },
  
  displayHtml: function(responseData) {
    var iframe = document.createElement("iframe");
    iframe.setAttribute("type", "content");
    iframe.setAttribute("flex", "1");
    
    var docShell = iframe.getAttribute("docShell");
    docShell.allowAuth = false;
    docShell.allowJavascript = false;
    docShell.allowMetaRedirects = false;
    docShell.allowPlugins = false;
    docShell.allowSubframes = false;
        
    iframe.setAttribute("src", "data:text/html," + encodeURIComponent(responseData));
      
    document.getElementById("xmlContent").appendChild(iframe);
  },

  clearRequest: function(){
    var requestUrl = document.getElementById('tbRequestUrl');
    var requestBody = document.getElementById('tbRequestBody');
    var requestMethod = document.getElementById('requestMethod');
    requestUrl.value = "";
    requestBody.value = "";
    requestMethod.selectedIndex = 0;
    this.oAuthPasswordObject = null;
    restclient.clearResult();
    this.updateLogin();
    this.requestBodyChange();
    this.clearRequestHeader();
  },

  storeRestClientTab: function (theTab) {
    var store = Components.classes["@mozilla.org/browser/sessionstore;1"].
                getService(Components.interfaces.nsISessionStore);

    //var theTab = aEvent.originalTarget;
    //var theTabBrowser = gBrowser.getBrowserForTab(theTab);
    //var tabDocument = theTabBrowser.contentDocument.wrappedJSObject;
    var tabDocument = document;      

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
    store.setTabValue(theTab, "tab-controller", tabController.toString());
  },

  restoreRestClientTab: function (theTab) {
    var store = Components.classes["@mozilla.org/browser/sessionstore;1"].
                 getService(Components.interfaces.nsISessionStore);

    //var theTabBrowser = gBrowser.getBrowserForTab(theTab);

    var tbRequestBody   = document.getElementById('tbRequestBody');
    var tbRequestUrl    = document.getElementById('tbRequestUrl');
    var requestMethod   = document.getElementById('requestMethod');
    var reqMethodChilds = document.getElementById('requestMethod').childNodes[0].childNodes;
    var reqHeaderChilds = document.getElementById('reqHeaderChilds');
    if (tbRequestBody != null) {
      var data = store.getTabValue(theTab, "tab-controller");
      var tabController = new TabController();
      if (data != "undefined") {
          tabController.fromString(data);
      }

      setRequestBody(tabController.requestBody);
      setRequestUrl(tabController.requestUrl);

      var reqHeaderList = tabController.headerList;
      for (headerKey in reqHeaderList) {
        var headerValue = reqHeaderList[headerKey];

        this.addHttpRequestHeader(headerKey, headerValue);
      }

      setRequestMethod(tabController.requestMethod);
    }
  },


  clearResult: function(){
    restclient.initHttpHeader();
    restclient.initHttpResponse();
    setTimeTaken("");
    setBytes("");
  },

  initHttpHeader: function(){
   	var headerChilds = document.getElementById('headerChilds');
    for (var i=headerChilds.childNodes.length-1 ; i>=0 ; i--)
    	headerChilds.removeChild(headerChilds.childNodes[i]);
 	},

 	initHttpResponse: function(){
 	  var responseBody = document.getElementById('responseBody');
 	  responseBody.value="";
 	  var xmlContent = document.getElementById('xmlContent');
 	  for (var i=xmlContent.childNodes.length-1 ; i>=0 ; i--)
    	xmlContent.removeChild(xmlContent.childNodes[i]);
 	},

 	addHttpHeader: function(headerKey, headerValue){
 	  var headerChilds = document.getElementById('headerChilds');
  	var item = document.createElement('treeitem');
  	var row = document.createElement('treerow');
 		var c1 = document.createElement('treecell');
    if(headerKey == "Status Code") {
      if(util.startsWith(headerValue, "2")){
        row.setAttribute('properties', "statusOk");
        c1.setAttribute('properties', "statusOk");
      }else{
        row.setAttribute('properties', "statusError");
        c1.setAttribute('properties', "statusError");
      }
    } else if(headerKey == "Error") {
      row.setAttribute('properties', "statusError");
      c1.setAttribute('properties', "statusError");
    }
     
 		if(util.startsWith(headerKey.toLowerCase(),"location")){
 	    util.mlog("location" + headerValue);
 	    c1.setAttribute('properties', "location");
 	  }
  	c1.setAttribute('label', headerKey + ": " + headerValue);
  	row.appendChild(c1);
  	item.appendChild(row);
  	headerChilds.appendChild(item);
  	return (headerChilds.childNodes.length-1);
	},

	copyResult: function(){
		var tbRequestBody = document.getElementById('tbRequestBody');
		var responseBody = document.getElementById('responseBody');
		tbRequestBody.value = responseBody.value;
		this.requestBodyChange();
	},

	saveRequest: function(){
		var saveBtn = document.getElementById('save-icon');
		if(saveBtn.disabled) return;

		var tbRequestBody = document.getElementById('tbRequestBody');
		var data = tbRequestBody.value;
		if(util.trim(data) == ""){
			alert("Nothing to save");
			return;
		}

	  var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"]
		        .createInstance(nsIFilePicker);
		fp.init(window, "Save As", nsIFilePicker.modeSave);
		fp.appendFilters(nsIFilePicker.filterXML | nsIFilePicker.filterText);
		var res = fp.show();
    if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace){
    	var thefile = fp.file;
    	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                         .createInstance(Components.interfaces.nsIFileOutputStream);

			// use 0x02 | 0x10 to open file for appending.
			foStream.init(thefile, 0x02 | 0x08 | 0x20, 0666, 0); // write, create, truncate
			foStream.write(data, data.length);
			foStream.close();
    }
	},


	saveEntireRequest: function(){

        var requestUrl = document.getElementById("tbRequestUrl").value;
        var requestMethod = document.getElementById("requestMethod").selectedItem.getAttribute('label');
        var requestBody = document.getElementById("tbRequestBody").value;
        var reqHeaderChilds = document.getElementById('reqHeaderChilds');

        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
            .createInstance(nsIFilePicker);
        fp.init(window, "Save As", nsIFilePicker.modeSave);
        fp.appendFilters(nsIFilePicker.filterText);


        var outputObject = new Object();
        outputObject["requestUrl"] = requestUrl;
        outputObject["requestMethod"] = requestMethod;
        outputObject["requestBody"] = requestBody;

        var index = 0;
        var headerArray = new Array();

        // Now store headers in pairs
        for (var i = reqHeaderChilds.childNodes.length-1; i>=0; i--) {
            var headerKey = reqHeaderChilds.childNodes[i].childNodes[0].childNodes[0].getAttribute('label')
            var headerValue = reqHeaderChilds.childNodes[i].childNodes[0].childNodes[1].getAttribute('label')
            headerArray[index++] = headerKey;
            headerArray[index++] = headerValue;
        }

        outputObject["headers"] = headerArray;

        var output = JSON.stringify(outputObject);

        var res = fp.show();
        if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace) {
            var thefile = fp.file;
            var path = thefile.path;
            if (path.match("\.txt$") != ".txt") {
                thefile = Components.classes["@mozilla.org/file/local;1"]
                    .createInstance(Components.interfaces.nsILocalFile);
                thefile.initWithPath(path + ".txt")
            }
            var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                .createInstance(Components.interfaces.nsIFileOutputStream);

            // use 0x02 | 0x10 to open file for appending.
            foStream.init(thefile, 0x02 | 0x08 | 0x20, 0666, 0); // write, create, truncate
            foStream.write(output, output.length);
            foStream.close();
        }
    },


	loadRequest: function(){
	  var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"]
        .createInstance(nsIFilePicker);
    fp.init(window, "Select a File", nsIFilePicker.modeOpen);
    fp.appendFilters(nsIFilePicker.filterXML | nsIFilePicker.filterText);
	  var res = fp.show();
    if (res == nsIFilePicker.returnOK){
      var thefile = fp.file;
      var data = "";
			var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
			                        .createInstance(Components.interfaces.nsIFileInputStream);
			var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
			                        .createInstance(Components.interfaces.nsIScriptableInputStream);
			fstream.init(thefile, -1, 0, 0);
			sstream.init(fstream);

			var str = sstream.read(4096);
			while (str.length > 0) {
			  data += str;
			  str = sstream.read(4096);
			}

			sstream.close();
			fstream.close();
			setRequestBody(data);
    }
    this.requestBodyChange();
	},


	loadEntireRequest: function(){
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
                           .createInstance(nsIFilePicker);
        fp.init(window, "Select a File", nsIFilePicker.modeOpen);
        fp.appendFilters(nsIFilePicker.filterText);
        var res = fp.show();
        if (res == nsIFilePicker.returnOK){
            this.clearRequest();
            var thefile = fp.file;
            var data = "";
            var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                            .createInstance(Components.interfaces.nsIFileInputStream);
            var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
                            .createInstance(Components.interfaces.nsIScriptableInputStream);
            fstream.init(thefile, -1, 0, 0);
            sstream.init(fstream);

            var str = sstream.read(4096);
            while (str.length > 0) {
                data += str;
                str = sstream.read(4096);
            }

            sstream.close();
            fstream.close();
            var dataObject = JSON.parse(data);

            setRequestUrl(dataObject["requestUrl"]);
            setRequestMethod(dataObject["requestMethod"]);
            setRequestBody(dataObject["requestBody"]);

            var headerPairs = dataObject["headers"];
            var index = 0;
            while (index < headerPairs.length) {
                this.addHttpRequestHeader(headerPairs[index++], headerPairs[index++]);
            }
        }
        this.requestBodyChange();
	},

	updateSaveButton: function(){
		var tbRequestBody = document.getElementById('tbRequestBody');
		var saveBtn = document.getElementById('save-icon');
		if(util.trim(tbRequestBody.value) == ""){
			saveBtn.disabled = true;
		}else
			saveBtn.disabled = false;
	},

	requestBodyChange: function(ev){
		util.mlog("input:");
		this.updateSaveButton();
	}
}

function setRequestUrl(strUrl){
  var requestUrl = document.getElementById("tbRequestUrl");
  requestUrl.value = strUrl;
  //alert(strUrl);
}

function setRequestMethod(requestMethod){
  var reqMethodSelect = document.getElementById('requestMethod');
  var reqMethodChilds = reqMethodSelect.childNodes[0].childNodes;

  var child = null;
  for (childIndex in reqMethodChilds) {
    child = reqMethodChilds[childIndex];
    if (typeof child == 'object' && child.getAttribute('label') == requestMethod) {
      break;
    }
  }
  if (child != null) {
    reqMethodSelect.selectedItem = child;
  }
}

function setRequestBody(body){
  document.getElementById('tbRequestBody').value = body;
}

function setTimeTaken(timeTaken) {
  document.getElementById("timeTakenLabel").value = timeTaken;
}

function setBytes(bytes) {
  document.getElementById("bytesLabel").value = bytes;
}

window.addEventListener("load", function() {restclient.init();}, false);
