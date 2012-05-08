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

if (typeof (restclient) === "undefined") {

  var restclient = {
    init : function () {
      restclient.importModules();
    },
    importModules : function () {
      Components.utils.import("resource://restclient/modules/StringBundle.js", restclient);
      Components.utils.import("resource://restclient/modules/Preferences.js", restclient);

      Components.utils.import("resource://gre/modules/NetUtil.jsm", restclient);
      Components.utils.import("resource://gre/modules/FileUtils.jsm", restclient);
    },
    setPref : function (name, value) {
      return restclient.Preferences.set("extension.restclient." + name, value);
    },
    getPref : function (name, value) {
      return restclient.Preferences.get("extension.restclient." + name, value);
    },
    i18n : function (n, arg) {
        i18nStrings = new restclient.StringBundle("chrome://restclient/locale/restclient.properties");
      try {
        return i18nStrings.get(n, arg);
      } catch (e) {
        console.error(n);
        console.error(JSON.stringify(arg));
        console.error(e.message);
      }
    },
    convertStringToUTF8: function(aStr)
    {
      var utf8Converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"].
          getService(Components.interfaces.nsIUTF8ConverterService);
    
      try {
        return utf8Converter.convertStringToUTF8 (aStr, "UTF-8"); //utf8Converter.convertStringToUTF8(aStr, "utf-8", false); 
      }
      catch(e) {
        console.error(e);
        return aStr;
      }
    },
    log: function(str) {
      try{
        console.log(str);
      }catch(e){}
    },
    error: function(o) {
      try{
        console.error(o);
      }catch(e){}
    }
  }
}