/*******************************************************************************
 *  Object used to store information on a per tab basis.  This should be passed
 *  into the TabListener as the func argument.
 *
 *  http://richwklein.com/2009/07/21/tab-listener/
 *
 *  @version 1.0
 ******************************************************************************/
function TabController() {}
TabController.prototype = {

  /**
   * IMPORTANT!!! Add the properties here that you need to keep track of.
   */
  requestUrl: null,
  requestMethod: null,
  requestBody: null,
  headerList: null,



  /**
   * Called when a tab is being restored so that we restore the controllers state.
   *
   * @param   data           A string of json data stored in the session store.
   */
  fromString: function TabController_fromString(data) {
    var json = window.JSON.parse(data);
    for (var property in json)
        this[property] = json[property];
  },

  /**
   * Called when a tab is being closed so that we can store the controllers state.
   *
   * @returns                A string of json data stored in the session store.
   */
  toString: function TabController_toString() {
    var json = {};
    for (var property in this)
      json[property] = this[property]
    return window.JSON.stringify(json);
  }
};
