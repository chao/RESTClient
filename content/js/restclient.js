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
      Components.utils.import("resource://gre/modules/PopupNotifications.jsm", restclient);
    },
    setupLogging: function () {
      var debugLevel = restclient.getPref("extensions.unipass.log.level", 'Warn'),
        logfile = restclient.getPref("extensions.unipass.log.file", ""),
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
      return restclient.Preferences.set(name, value);
    },
    getPref : function (name, value) {
      return restclient.Preferences.get(name, value);
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