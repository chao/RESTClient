var json2xul = {
  
  prettyPrintJSON: function(outputDiv, text){
    // The box for output at the top-level
    var jsonContent = document.createElement("vbox");
    jsonContent.setAttribute("class", "json-content");
    
    try {
      // Parse the JSON
      var parsedObj = JSON.parse(text);
      // Turn the Javascript object into XUL objects
      if (typeof parsedObj == 'object') {
        var asXul = this.getXulObject(parsedObj);
        jsonContent.appendChild(asXul);
      } else {
        var ex = {name: "JSON Parse error",
                  message: "JSON is invalid or top level element is not a JSON object"};
        this.showParseError(jsonContent, ex);
      }
    } catch (e) {
      this.showParseError(jsonContent, e);
    }
    
    outputDiv.appendChild(jsonContent);
  },
  
  showParseError: function(jsonContent, ex) {
    var title = document.createElement("label");
    title.setAttribute("value", "There was an error parsing the JSON document:");
    title.setAttribute("class", "json-error-title");
    jsonContent.appendChild(title);
    if(ex) {
      var message = document.createElement("label");
      message.setAttribute("value", ex.name + ": " + ex.message);
      message.setAttribute("class", "json-error-message");
      jsonContent.appendChild(message);
    }
  },
  
  getXulObject: function(value){
    if (typeof value != 'object') {
      return null;
    }
    
    // array
    if (Object.prototype.toString.apply(value) === '[object Array]') {
      var xulObj = document.createElement("vbox");
      for (var i = 0; i < value.length; i ++) {
        this.addXulChild(xulObj, value[i]);
      }
      return xulObj;
    }
    
    // object
    var xulObj = document.createElement("vbox");
    for (var prop in value) {
      this.addXulChild(xulObj, value[prop], prop);
    }
    
    return xulObj;
  },
  
  
  addXulChild: function(xulObj, value, property){
    var childIsObj = (typeof value == 'object' && value != null);
    var childObj = childIsObj ? this.getXulObject(value) : this.getXulValue(value);
    
    // If the value has a label (object properties will have labels)
    if (property != null) {
      var label = document.createElement("label");
      label.setAttribute("class", "json-label");
      label.setAttribute("value", property + ":");
      
      // If the value is an object or array
      if (childIsObj) {
        var childIsArray = (Object.prototype.toString.apply(value) === '[object Array]');
        
        var openBrace = document.createElement("label");
        openBrace.setAttribute("value", childIsArray ? "[" : "{");
        openBrace.setAttribute("class", "json-brace");
        var closeBrace = document.createElement("label");
        closeBrace.setAttribute("value", childIsArray ? "]" : "}");
        closeBrace.setAttribute("class", "json-brace");
        
        var xulMember = document.createElement("vbox");
        xulMember.setAttribute("class", "json-object");
        
        //
        // Add it like this:
        //
        // label
        // {
        //    <child object>
        // }
        // 
        xulMember.appendChild(label);
        xulMember.appendChild(openBrace);
        xulMember.appendChild(childObj);
        xulMember.appendChild(closeBrace);
      }
      else {
        // If the value is not an object or array, just add the label/value horizontally, ie
        // label: <value>
        var xulMember = document.createElement("hbox");
        xulMember.setAttribute("class", "json-member");
        xulMember.appendChild(label);
        xulMember.appendChild(childObj);
      }
      xulObj.appendChild(xulMember);
    } else {
      // If the value doesn't have a label, just add it directly
      childObj.setAttribute("class", childObj.getAttribute("class") + " json-member");
      var childIsArray = (Object.prototype.toString.apply(value) === '[object Array]');

      if (childIsObj) {
        var openBrace = document.createElement("label");
        openBrace.setAttribute("value", childIsArray ? "[" : "{");
        openBrace.setAttribute("class", "json-brace");
        var closeBrace = document.createElement("label");
        closeBrace.setAttribute("value", childIsArray ? "]" : "}");
        closeBrace.setAttribute("class", "json-brace");
        xulObj.appendChild(openBrace);
        xulObj.appendChild(childObj);
        xulObj.appendChild(closeBrace);
        
      } else {
        xulObj.appendChild(childObj);
      }

    }
  },
  testCount: 0,
  getXulValue: function(value){
      var xulObj = document.createElement("description");
      switch (typeof value) {
        case 'object':
          // null
          if (!value) {
            xulObj.setAttribute("value", 'null');
            xulObj.setAttribute("class", "json-null");
            return xulObj;
          }
          return null;
        
        // string
        case 'string':
          xulObj.appendChild( document.createTextNode(String(value)) );
          xulObj.setAttribute("class", "json-string");
          return xulObj;
        
        // number
        case 'number':
          xulObj.setAttribute("value", isFinite(value) ? String(value) : 'null');
          xulObj.setAttribute("class", "json-numeric");
          return xulObj;
        
        // bool
        case 'boolean':
          xulObj.setAttribute("value", String(value));
          xulObj.setAttribute("class", "json-bool");
          return xulObj;
        
        // At the time of writing, 'null' will never be returned by typeof,
        // but one day the specification for the typeof function might be fixed
        // so that it does.
        case 'null':
          xulObj.setAttribute("value", String(value));
          xulObj.setAttribute("class", "json-null");
          return xulObj;
      }
      
      return null;
  }
}

