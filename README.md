# RESTClient

[RESTClient](http://restclient.net) is a debugger for RESTful web services. Currently only [Firefox addon](https://addons.mozilla.org/en-US/firefox/addon/9780/) has been finished.

## Changes

### Firefox Addon

* Version 3.0.6
  * Added Chinese locale.
  * Added an instruction for add self signed web site to certificates exception list.
  * Added headers for following server side redirection.
  * Binary response type is supported.
  * Added download button for binary response.
  * Fixed some bugs.
* Version 3.0.5
  * Fixed basic authentication unicode problem.
  * Added OAuth 1.0 authentication.
  * Added OAuth 2.0 support.
  * Added CURL command support, you can copy your request as a curl command or paste a curl command to execute.
  * Added authentication badge for all the authentication mode.
  * Added response download button for non-binary response.
* Version 3.0.4
  * Added preview for JSON, XML response body
  * Added data migration for migrating data from RESTClient 2
  * Allow to import RESTClient 1 request file
* Version 3.0.0
  * Rewrite RESTClient by as a WebExtensions
  * Use Bootstrap 4.0 alpha 4
* Version 2.0.3
  * Supported OAuth2 authentication
  * Fixed url history bug
  * Show HTTP request execution time
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