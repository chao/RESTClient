function $(el) {
  return document.getElementById(el);
}

function init(aEvent) {
  
  var save = util.getBoolPref("restclient.save", false);
  if(save){
    $('securitySchemeRadio').selectedIndex = util.getIntPref("restclient.securityScheme", "");
    
    $('login').value    = util.getStrPref("restclient.login", "");
    $('password').value = util.getStrPref("restclient.password", "");
    
    $('signatureMethod').selectedIndex      = util.getIntPref("restclient.sigMethodIndex", "");
    $('consumerKey').value                  = util.getStrPref("restclient.consumerKey", "");
    $('consumerSecret').value               = util.getStrPref("restclient.consumerSecret", "");
    $('accessorSecret').value               = util.getStrPref("restclient.accessorSecret", "");
    $('token').value                        = util.getStrPref("restclient.token", "");
    $('tokenSecret').value                  = util.getStrPref("restclient.tokenSecret", "");
    $('nonce').value                        = util.getStrPref("restclient.nonce", "");
    $('version').value                      = util.getStrPref("restclient.version", "");
    $('timestamp').value                    = util.getStrPref("restclient.timestamp", "");

    $('autoNonce').checked                  = util.getBoolPref("restclient.autoNonce", "");
    $('autoVersion').checked                = util.getBoolPref("restclient.autoVersion", "");
    $('autoTimestamp').checked              = util.getBoolPref("restclient.autoTimestamp", "");
    
    $('save').checked = true;
  } else {
    var args = window.arguments[0];
    
    function valueIfNull(arg, value) { return arg == null ? value : arg};
    function blankIfNull(arg) { return arg == null ? "" : arg; }
    
    $('securitySchemeRadio').selectedIndex = valueIfNull(args.securityScheme, 0);
    
    $('login').value    = args.login;
    $('password').value = args.password;
    
    $('signatureMethod').selectedIndex = valueIfNull(args.sigMethodIndex, 0);
    
    $('consumerKey').value             = blankIfNull(args.consumerKey);
    $('consumerSecret').value          = blankIfNull(args.consumerSecret);
    $('accessorSecret').value          = blankIfNull(args.accessorSecret);
    $('token').value                   = blankIfNull(args.token);
    $('tokenSecret').value             = blankIfNull(args.tokenSecret);
    $('nonce').value                   = blankIfNull(args.nonce);
    $('version').value                 = valueIfNull(args.version, "1.0");
    $('timestamp').value               = valueIfNull(args.timestamp, (new Date().getTime() / 1000));
    
    $('autoNonce').checked             = valueIfNull(args.autoNonce, true);
    $('autoVersion').checked           = valueIfNull(args.autoVersion, true);
    $('autoTimestamp').checked         = valueIfNull(args.autoTimestamp, true);
  }
  
  $('securitySchemeRadio').addEventListener('command', updateSecuritySchemeVisibility, false);
  updateSecuritySchemeVisibility();
  
  $('timestamp').addEventListener('change', updateTimestamp, false);
  updateTimestamp();
  
  $('autoNonce').addEventListener('command', autoNonceOnClick, false);
  $('autoVersion').addEventListener('command', autoVersionOnClick, false);
  $('autoTimestamp').addEventListener('command', autoTimestampOnClick, false);
  
  autoNonceOnClick();
  autoVersionOnClick();
  autoTimestampOnClick();
}

function updateSecuritySchemeVisibility() {
  var showBasic = ($('securitySchemeRadio').selectedIndex == 0);
  $('securitySchemeBasic').style.display = showBasic ? ''     : 'none';
  $('securitySchemeOAuth').style.display = showBasic ? 'none' : '';
}

function autoNonceOnClick()     { $('nonce').disabled     = $('autoNonce').checked; };
function autoVersionOnClick()   { $('version').disabled   = $('autoVersion').checked; };
function autoTimestampOnClick() { $('timestamp').disabled = $('autoTimestamp').checked; };

function updateTimestamp() {
  var millis = $('timestamp').value * 1000;
  var date = new Date();
  date.setTime(millis);
  $('timestampAsDate').value = date;
}

function saveChange() {
  var save          = $('save').checked;
}

function doOK() {
  window.arguments[0].securityScheme = $('securitySchemeRadio').selectedIndex;
  
  window.arguments[0].login     = $('login').value;
  window.arguments[0].password  = $('password').value;
  
  var sigMethodIndex = $('signatureMethod').selectedIndex;
  var sigMethodText = 'HMAC-SHA1';
  switch(sigMethodIndex) {
    case 1:
      sigMethodText = 'PLAINTEXT';
    break;
    /* Not supported by the oauth.js library
    case 2:
        sigMethodText = 'RSA-SHA1';
    break;
    */
  }
  
  window.arguments[0].sigMethodIndex = sigMethodIndex;
  window.arguments[0].signatureMethod = sigMethodText;
  
  window.arguments[0].consumerKey    = $('consumerKey').value;
  window.arguments[0].consumerSecret = $('consumerSecret').value;
  window.arguments[0].accessorSecret = $('accessorSecret').value;
  window.arguments[0].token          = $('token').value;
  window.arguments[0].tokenSecret    = $('tokenSecret').value;
  window.arguments[0].nonce          = $('nonce').value;
  window.arguments[0].version        = getVersionString($('version').value);
  window.arguments[0].timestamp      = $('timestamp').value;
  
  window.arguments[0].autoNonce      = $('autoNonce').checked;
  window.arguments[0].autoVersion    = $('autoVersion').checked;
  window.arguments[0].autoTimestamp  = $('autoTimestamp').checked;
  
  window.arguments[0].returnVal = true;
  
  var save          = $('save').checked;
  if(save){
      util.setIntPref("restclient.securityScheme", $('securitySchemeRadio').selectedIndex);
      
      util.setStrPref("restclient.login", $('login').value);
      util.setStrPref("restclient.password", $('password').value);
      util.setBoolPref("restclient.save", true);
      
      util.setIntPref("restclient.sigMethodIndex", $('signatureMethod').selectedIndex);
      util.setStrPref("restclient.consumerKey",    $('consumerKey').value);
      util.setStrPref("restclient.consumerSecret", $('consumerSecret').value);
      util.setStrPref("restclient.accessorSecret", $('accessorSecret').value);
      util.setStrPref("restclient.token",          $('token').value);
      util.setStrPref("restclient.tokenSecret",    $('tokenSecret').value);
      util.setStrPref("restclient.nonce",          $('nonce').value);
      util.setStrPref("restclient.version",        $('version').value);
      util.setStrPref("restclient.timestamp",      $('timestamp').value);
      
      util.setBoolPref("restclient.autoNonce",     $('autoNonce').checked);
      util.setBoolPref("restclient.autoVersion",   $('autoVersion').checked);
      util.setBoolPref("restclient.autoTimestamp", $('autoTimestamp').checked);
  }
  
  return true;
}

function getVersionString(versionNum) {
  if(versionNum.indexOf('.') > 0) {
    return versionNum;
  }
  return versionNum + ".0";
}

