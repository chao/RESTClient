/* ***** BEGIN LICENSE BLOCK *****
Copyright (c) 2007-2012, Chao ZHOU (chao@zhou.fr). All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may
      be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * ***** END LICENSE BLOCK ***** */

"use strict";

restclient.helper = {
  //URL parse function and makeUrlAbosulte function are copied from jQuery Mobile
  // http://jquerymobile.com/
  urlParseRE: /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/,
  //Parse a URL into a structure that allows easy access to
  //all of the URL components by name.
  parseUrl: function( url ) {
    // If we're passed an object, we'll assume that it is
    // a parsed url object and just return it back to the caller.
    if ( $.type( url ) === "object" ) {
      return url;
    }

    var matches = this.urlParseRE.exec( url || "" ) || [];

      // Create an object that allows the caller to access the sub-matches
      // by name. Note that IE returns an empty string instead of undefined,
      // like all other browsers do, so we normalize everything so its consistent
      // no matter what browser we're running on.
      return {
        href:         matches[  0 ] || "",
        hrefNoHash:   matches[  1 ] || "",
        hrefNoSearch: matches[  2 ] || "",
        domain:       matches[  3 ] || "",
        protocol:     matches[  4 ] || "",
        doubleSlash:  matches[  5 ] || "",
        authority:    matches[  6 ] || "",
        username:     matches[  8 ] || "",
        password:     matches[  9 ] || "",
        host:         matches[ 10 ] || "",
        hostname:     matches[ 11 ] || "",
        port:         matches[ 12 ] || "",
        pathname:     matches[ 13 ] || "",
        directory:    matches[ 14 ] || "",
        filename:     matches[ 15 ] || "",
        search:       matches[ 16 ] || "",
        hash:         matches[ 17 ] || "",
        scheme:       (typeof matches[4] == "string" && matches[4].indexOf(':') > -1) ? matches[4].substr(0, matches[4].indexOf(':')) : ""
      };
  },
  //Returns true for any relative variant.
	isRelativeUrl: function( url ) {
		// All relative Url variants have one thing in common, no protocol.
		return this.parseUrl( url ).protocol === "";
	},
	//Returns true for an absolute url.
	isAbsoluteUrl: function( url ) {
		return this.parseUrl( url ).protocol !== "";
	},
	//Turn relPath into an asbolute path. absPath is
	//an optional absolute path which describes what
	//relPath is relative to.
	makePathAbsolute: function( relPath, absPath ) {
		if ( relPath && relPath.charAt( 0 ) === "/" ) {
			return relPath;
		}

		relPath = relPath || "";
		absPath = absPath ? absPath.replace( /^\/|(\/[^\/]*|[^\/]+)$/g, "" ) : "";

		var absStack = absPath ? absPath.split( "/" ) : [],
			relStack = relPath.split( "/" );
		for ( var i = 0; i < relStack.length; i++ ) {
			var d = relStack[ i ];
			switch ( d ) {
				case ".":
					break;
				case "..":
					if ( absStack.length ) {
						absStack.pop();
					}
					break;
				default:
					absStack.push( d );
					break;
			}
		}
		return "/" + absStack.join( "/" );
	},

	//Turn the specified realtive URL into an absolute one. This function
	//can handle all relative variants (protocol, site, document, query, fragment).
	makeUrlAbsolute: function( relUrl, absUrl ) {
		if ( !this.isRelativeUrl( relUrl ) ) {
			return relUrl;
		}

		var relObj = this.parseUrl( relUrl ),
			absObj = this.parseUrl( absUrl ),
			protocol = relObj.protocol || absObj.protocol,
			doubleSlash = relObj.protocol ? relObj.doubleSlash : ( relObj.doubleSlash || absObj.doubleSlash ),
			authority = relObj.authority || absObj.authority,
			hasPath = relObj.pathname !== "",
			pathname = this.makePathAbsolute( relObj.pathname || absObj.filename, absObj.pathname ),
			search = relObj.search || ( !hasPath && absObj.search ) || "",
			hash = relObj.hash;

		return protocol + doubleSlash + authority + pathname + search + hash;
	},
	setParam: function(url, name, value) {
	  if ( !this.isAbsoluteUrl( url ) ) {
			return url;
		}
		var parts = this.parseUrl(url);
		var search = "?" + name + "=" + value;
		if (parts.search)
		{
		  search = parts.search.substr(1);
		  restclient.log(search);
		  var found = false;
		  var elements = search.split('&');
		  for (var i=0, element; element = elements[i]; i++) {
		    var keyToken = element.split('=');
		    if(keyToken[0] === name) {
		      elements[i] = name + "=" + value;
		      found = true;
		      break;
		    }
		  }
		  if (!found)
		    elements.push(name + "=" + value);
		  
		  search = "?" + elements.join('&');
		}
		
		return parts.protocol + parts.doubleSlash + parts.authority + parts.pathname + search;
	},
	validateUrl: function (url) {
    return this.isAbsoluteUrl(url);
  },
  sha1: function(str) {
    var converter =
      Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

    converter.charset = "UTF-8";
    var result = {};
    var data = converter.convertToByteArray(str, result);
    var ch = Components.classes["@mozilla.org/security/hash;1"]
                       .createInstance(Components.interfaces.nsICryptoHash);
    ch.init(ch.SHA1);
    ch.update(data, data.length);
    var hash = ch.finish(false);


    // return the two-digit hexadecimal code for a byte
    function toHexString(charCode)
    {
      return ("0" + charCode.toString(16)).slice(-2);
    }

    // convert the binary hash data to a hex string.
    var s = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");

    return s;
  }
}