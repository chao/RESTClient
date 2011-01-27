
var handlerSelector = {

    handlers: new Array(new JsonContentHandler(), new ImageContentHandler(), new HtmlContentHandler()),
    defaultHandler: new XmlContentHandler(),


    getHandler: function(contentType) {
    	for (var handlerIndex in this.handlers) {
            var handler = this.handlers[handlerIndex];
            if (contentType.indexOf(handler.contentTypeFragment) >= 0) {
                return handler;
            }
    	}
        return this.defaultHandler;
    }

}

function XmlContentHandler() {
    this.contentTypeFragment = "xml";
    this.rawTabLabelKey = 'raw.xml.tab.label';
    this.parsedTabLabelKey = 'parsed.xml.tab.label';
    
    this.handleContent = function(contentType, xmlHttpRequest) {
        var responseBody = $('responseBody');
        responseBody.value = xmlHttpRequest.responseText;
        
        var xmlDoc = xmlHttpRequest.responseXML;
 
        if(xmlDoc == null)
            return;

        var xslDocument = document.implementation.createDocument("", "dummy", null);
        xslDocument.onload = function (evt) {
            var xsltProcessor = new XSLTProcessor();
            xsltProcessor.importStylesheet(xslDocument);
            var resultFragment = xsltProcessor.transformToFragment(xmlDoc, document);
            var oDiv = $("xmlContent");
            oDiv.appendChild(resultFragment);
        };
        xslDocument.load("chrome://restclient/content/XMLPrettyPrint.xsl");
    };
    

}

function JsonContentHandler() {
    this.contentTypeFragment = "json";
    this.rawTabLabelKey = 'raw.json.tab.label';
    this.parsedTabLabelKey = 'parsed.json.tab.label';
    
    this.handleContent = function(contentType, xmlHttpRequest) {
        var responseBody = $('responseBody');
        responseBody.value = xmlHttpRequest.responseText;

        var outputDiv = $("xmlContent");
        json2xul.prettyPrintJSON(outputDiv, xmlHttpRequest.responseText);
    };

}

function ImageContentHandler() {
    this.contentTypeFragment = "image";
    this.rawTabLabelKey = 'raw.image.tab.label';
    this.parsedTabLabelKey = 'parsed.image.tab.label';
    
    this.handleContent = function(contentType, xmlHttpRequest) {
        var responseData = xmlHttpRequest.responseText;

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

	$('responseBody').value = base64encoded;
        $("xmlContent").appendChild(hbox);

    };

}

function HtmlContentHandler() {
    this.contentTypeFragment = "html";
    this.rawTabLabelKey = 'raw.html.tab.label';
    this.parsedTabLabelKey = 'parsed.html.tab.label';
    
    this.handleContent = function(contentType, xmlHttpRequest) {
        var responseData = xmlHttpRequest.responseText;

        var responseBody = $('responseBody');
        responseBody.value = responseData;
        
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
      
        $("xmlContent").appendChild(iframe);

    };

}
