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
      Components.utils.import("resource://restclient/modules/Observers.js", restclient);
      Components.utils.import("resource://restclient/modules/log4moz.js", restclient);

      Components.utils.import("resource://gre/modules/NetUtil.jsm", restclient);
      Components.utils.import("resource://gre/modules/FileUtils.jsm", restclient);
    },
    setupLogging: function () {
      var debugLevel = restclient.getPref("extensions.restclient.log.level", 'Warn'),
        logfile = restclient.getPref("extensions.restclient.log.file", ""),
        formatter = new restclient.Log4Moz.BasicFormatter(),
        root = restclient.Log4Moz.repository.rootLogger,
        capp = new restclient.Log4Moz.ConsoleAppender(formatter),
        dapp = new restclient.Log4Moz.DumpAppender(formatter);
      if (root.appenders.length > 0) {
        return;
      }
      root.level = restclient.Log4Moz.Level[debugLevel];

      capp.level = restclient.Log4Moz.Level[debugLevel];
      root.addAppender(capp);

      dapp.level = restclient.Log4Moz.Level[debugLevel];
      root.addAppender(dapp);

      if (logfile !== "") {
        var logFile = restclient.getLocalDirectory();
        logFile.append("log.txt");
        var appender = new restclient.Log4Moz.RotatingFileAppender(logFile, formatter);
        appender.level = restclient.Log4Moz.Level[debugLevel];
        root.addAppender(appender);
      }
      restclient.logger = true;
    },
    getLogger : function (name) {
      if (!restclient.logger) {
        restclient.setupLogging();
      }
      return restclient.Log4Moz.repository.getLogger(name);
    },
    setPref : function (name, value) {
      return restclient.Preferences.set("extension.restclient." + name, value);
    },
    getPref : function (name, value) {
      return restclient.Preferences.get("extension.restclient." + name, value);
    },
    getLocalDirectory : function () {
      var directoryService =
        Components.classes["@mozilla.org/file/directory_service;1"].
        getService(Components.interfaces.nsIProperties),
        localDir = directoryService.get("ProfD", Components.interfaces.nsIFile);

      localDir.append("restclient");

      if (!localDir.exists() || !localDir.isDirectory()) {
        // read and write permissions to owner and group, read-only for others.
        localDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 484);
      }
      return localDir;
    },
    getRecentWindow : function () {
      var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Components.interfaces.nsIWindowMediator);
      return wm.getMostRecentWindow("navigator:browser");
    },
    i18n : function (n, arg) {
      var logger = restclient.getLogger('restclient.i18n'),
        i18nStrings = new restclient.StringBundle("chrome://restclient/locale/s.properties");
      try {
        return i18nStrings.get(n, arg);
      } catch (e) {
        logger.fatal(n);
        logger.fatal(JSON.stringify(arg));
        logger.fatal(i18nStrings.get(n));
        logger.fatal(e.message);
      }
    }
  }
}