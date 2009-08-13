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
	},

	checkDeleteKeyPress: function(evt){
	  util.mlog("key press" + evt.keyCode);
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
    if (headerList.view.selection.count > 0) {
      for (var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--) {
         if (headerList.view.selection.isSelected(i))
            reqHeaderChilds.removeChild(reqHeaderChilds.childNodes[i]);
      }
    }
	},

	clearRequestHeader: function(){
	  var headerList = document.getElementById('headerList');
    var reqHeaderChilds = document.getElementById('reqHeaderChilds');
    if (headerList.view.selection.count > 0) {
      for (var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--) {
         reqHeaderChilds.removeChild(reqHeaderChilds.childNodes[i]);
      }
    }
	},

	init: function(){
		this._stringBundle = document.getElementById("string-bundle");
	  this.updateSaveButton();
	},

	updateLogin: function(){
	  var login = document.getElementById("login-icon");
	  var reqHeaderChilds = document.getElementById('reqHeaderChilds');
	  var bLogin = false;
    for (var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--) {
      if(reqHeaderChilds.childNodes[i].childNodes[0].childNodes[0].getAttribute('label')
        == "Authorization")
        bLogin = true;
    }
		if(!bLogin){
			login.label = this._stringBundle.getString("restclient.login");
			login.checked = false;
		}else{
			login.label = this._stringBundle.getString("restclient.logout");
			login.checked = true;
		}
	},

	doLogin: function(){
		var login = document.getElementById("login-icon");
		if(!login.checked){
		  var passwordObject       = new Object();
		  passwordObject.login     = "";
		  passwordObject.password  = "";
		  passwordObject.returnVal = false;
		  window.openDialog("chrome://restclient/content/login.xul", "login", "chrome,modal,dialog,resizable,centerscreen", passwordObject);

		  if (passwordObject.returnVal) {
		  	util.mlog("login[" + passwordObject.login + "] pass[" + passwordObject.password + "]");
      	var auth = "Basic " + Base64.encode(passwordObject.login + ':' + passwordObject.password);
      	util.mlog(auth);
		  	this.addHttpRequestHeader("Authorization", auth);
		  }
		}else{
			this.passwordObject = null;
			this.removeHttpRequestHeader("Authorization");
		}
		this.updateLogin();
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
    var reqHeaderChilds = document.getElementById('reqHeaderChilds');
    for (var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--) {
      if(reqHeaderChilds.childNodes[i].childNodes[0].childNodes[0].getAttribute('label')
        == headerKey)
        reqHeaderChilds.removeChild(reqHeaderChilds.childNodes[i]);
    }
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

    this.saveHistory("rc-search-history", requestUrl);
    util.mlog("Send request: method[" + requestMethod + "] Url[" + requestUrl + "]");
    util.mlog("Body[" + requestMethod + "] Url[" + requestUrl + "]");
    try {
      var meter = document.getElementById("meter");
      meter.mode = "undetermined";
	    meter.value="50%";
      var xmlHttpRequest = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
      xmlHttpRequest.open(requestMethod, requestUrl, true);

      for(var i=reqHeaderChilds.childNodes.length-1 ; i>=0 ; i--){
        var headerKey = reqHeaderChilds.childNodes[i].childNodes[0].childNodes[0].getAttribute('label')
        var headerValue = reqHeaderChilds.childNodes[i].childNodes[0].childNodes[1].getAttribute('label')
        util.mlog(headerKey);
        util.mlog(headerValue);
        xmlHttpRequest.setRequestHeader(headerKey, headerValue);
      }

      xmlHttpRequest.onerror = function() { restclient.doResponse(this, 0); };
      xmlHttpRequest.onload = function() { restclient.doResponse(this, 1); };
      xmlHttpRequest.send(requestBody);
    }
    catch (e) {
      util.mlog("getResource INFO:" + e.name + ": " + e.message);
    }
  },

  doResponse: function(xmlHttpRequest, outcome) {
  	var responseBody = document.getElementById('responseBody');
    try {
      var meter = document.getElementById("meter");
	    meter.value="100%";
	    meter.mode = "determined";
      restclient.clearResult();
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
		  responseBody.value = xmlHttpRequest.responseText;
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

  clearRequest: function(){
    var requestUrl = document.getElementById('tbRequestUrl');
    var requestBody = document.getElementById('tbRequestBody');
    var requestMethod = document.getElementById('requestMethod');
    requestUrl.value = "";
    requestBody.value = "";
    requestMethod.selectedIndex = 0;
    this.passwordObject = null;
    restclient.clearResult();
    this.updateLogin();
    this.requestBodyChange();
    this.clearRequestHeader();
  },

  clearResult: function(){
    restclient.initHttpHeader();
    restclient.initHttpResponse();
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
    if(headerKey == "Status Code")
      if(util.startsWith(headerValue, "2")){
        row.setAttribute('properties', "statusOk");
        c1.setAttribute('properties', "statusOk");
      }else{
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
    if (res == nsIFilePicker.returnOK){
    	var thefile = fp.file;
    	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                         .createInstance(Components.interfaces.nsIFileOutputStream);

			// use 0x02 | 0x10 to open file for appending.
			foStream.init(thefile, 0x02 | 0x08 | 0x20, 0666, 0); // write, create, truncate
			foStream.write(data, data.length);
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
			document.getElementById('tbRequestBody').value = data;
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

window.addEventListener("load", function() {restclient.init();}, false);