# RESTClient

[RESTClient](http://restclient.net) is a debugger for RESTful web services. Currently only [Firefox addon](https://addons.mozilla.org/en-US/firefox/addon/9780/) has been finished.

## Changes


### Firefox Addon

* Version 2.0.2
  * Fixed links in the returned xml - they are now clickable again
  * Added OAuth Realm support
  * Allow user to switch page layout (by precentage/fixed)
  * Allow user to view request headers in table or as tags
  * Added a remove all headers button
  * Fixed request URL input box size bug
  * Fixed OAuth query string bug
  * Fixed OAuth whitespace ending bug

* Version 2.0.1
  * Fixed XML result indentation
  * Remember open response tab
  * Fixed request url input box size bug
  * Support Firefox 12
  * Allow user to load old requests (exported by version 1.3.x)
  * Updated favorite url, add a drop down list for showing favorite URLs
  * Updated UI color, to enhance the request form

* Version 2.0.0
  * Re-designed the UI by using [twitter bootstrap](twitter.github.com/bootstrap/)
  * Bind hotkeys to send request, input url, etc.
  * Fixed multiple set-cookie response bug  (isseue #26)
  * Allow to copy response headers
  * Added theme support