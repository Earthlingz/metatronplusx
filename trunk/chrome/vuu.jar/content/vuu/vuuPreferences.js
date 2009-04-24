/**
 * Written by Anthony Gabel on ?? November 2004.
 *
 * Provides the code behind vuuPreferences.xul for all functions
 * relating to the VUU preferences dialog.
 *
 * Requires:
 *  TODO
 *  reporter.js
 */


/**
 * Single object that provides code for the VUU Preferences Dialog.
 */
var gVUUPrefDialog =
{
  /**
   * Called each time a VUU Preferences Dialog window is created (opened)
   * (directly after it loads). Loads all preferences into the dialog
   * param:  aEvent - Event - Onload event obejct
   */
  onload: function(aEvent)
  {
    // ensure formatting options are correctly enabled / disabled
    this.formattingProgramEnabledToggle(
      document.getElementById("chk_integration_enableAppIntegration").checked);
    this.kingdomSortingEnabledToggle(
      document.getElementById("chk_kingdom_modSorting").checked);
    /*this.kingdomRandomButtonEnabledToggle(*/
    /*document.getElementById("chk_kingdom_modPrevNext").checked);*/
    this.warroomDefaultGeneralsEnabledToggle(
      document.getElementById("chk_warroom_modSetGenerals").checked);

    window.sizeToContent();
  },

  /**
   * Called each time a VUU Preferences Dialog window is closed via the 'Accept' button.
   * Saves all preferences from the dialog
   */
  onaccept: function()
  {
    var prefs = this.getPrefs();

    // enable formatting program if applicable
    if (prefs.getBoolPref("vuuGeneralEnabled") && prefs.getBoolPref("vuuFormattingEnabled"))
      this.socketServerInitialize();
    else
      this.socketServerTerminate();
  },

  /**
   * Called each time a VUU Preferences Dialog window is closed via the 'Cancel' button.
   * Restore all preferences from the dialog
   */
  oncancel: function()
  {
    return;
  },

  /**
   * Returns the preferences branch relating to VUU
   * return:  nsIPrefBranch - preferences branch relating to VUU
   */
  getPrefs: function()
  {
    var prefs = null;
    var win = window.opener;

    while (win && win.opener)
      win = win.opener;

    prefs = win.top.gVUU.prefs;

    if (!prefs)
    {
      var prefService = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService);
      prefs = prefService.getBranch("extensions.vuu.");
    }

    return prefs;
  },

  /**
   * Enables / disables sub-preferences related to kingdom sorting
   */
  kingdomSortingEnabledToggle: function(aChecked)
  {
    aChecked = !aChecked;
    document.getElementById("chk_kingdom_sortIgnoreCase").disabled = aChecked;
    document.getElementById("chk_kingdom_modAlwaysSort").disabled = aChecked;
    this.kingdomSortingByEnabledToggle(!aChecked
      && document.getElementById("chk_kingdom_modAlwaysSort").checked)
  },

  /**
   * Enables / disables sub-preferences related to kingdom sorting by xxxx
   */
  kingdomSortingByEnabledToggle: function(aChecked)
  {
    aChecked = !aChecked;
    document.getElementById("lst_kingdom_modAlwaysSortBy").disabled = aChecked;
  },

  /**
   * Enables / disables sub-preferences related to random kingdom button
   */
  kingdomRandomButtonEnabledToggle: function(aChecked)
  {
    aChecked = !aChecked;
    document.getElementById("lbl_kingdom_modServer1MaxKingdom").disabled = aChecked;
    document.getElementById("txt_kingdom_modServer1MaxKingdom").disabled = aChecked;
    document.getElementById("lbl_kingdom_modServer1MaxIsland").disabled = aChecked;
    document.getElementById("txt_kingdom_modServer1MaxIsland").disabled = aChecked;

    document.getElementById("lbl_kingdom_modServer2MaxKingdom").disabled = aChecked;
    document.getElementById("txt_kingdom_modServer2MaxKingdom").disabled = aChecked;
    document.getElementById("lbl_kingdom_modServer2MaxIsland").disabled = aChecked;
    document.getElementById("txt_kingdom_modServer2MaxIsland").disabled = aChecked;

    document.getElementById("lbl_kingdom_modServer3MaxKingdom").disabled = aChecked;
    document.getElementById("txt_kingdom_modServer3MaxKingdom").disabled = aChecked;
    document.getElementById("lbl_kingdom_modServer3MaxIsland").disabled = aChecked;
    document.getElementById("txt_kingdom_modServer3MaxIsland").disabled = aChecked;
  },

  /**
   * Enables / disables sub-preferences related to warroom default generals
   */
  warroomDefaultGeneralsEnabledToggle: function(aChecked)
  {
    aChecked = !aChecked;
    document.getElementById("lbl_warroom_defaultGenerals").disabled = aChecked;
    document.getElementById("txt_warroom_defaultGenerals").disabled = aChecked;
  },

  /**
   * Enables / disables sub-preferences related to specifying the formatting program
   * to use when formatting
   */
  formattingProgramEnabledToggle: function(aChecked)
  {
    aChecked = !aChecked;
    document.getElementById("lbl_integration_appName").disabled = aChecked;
    document.getElementById("txt_integration_appName").disabled = aChecked;
    document.getElementById("lbl_integration_appPath").disabled = aChecked;
    document.getElementById("txt_integration_appPath").disabled = aChecked;
    document.getElementById("btn_integration_appPathBrowse").disabled = aChecked;
    document.getElementById("lbl_integration_appPort").disabled = aChecked;
    document.getElementById("txt_integration_appPort").disabled = aChecked;
    document.getElementById("chk_kingdom_modIntelIndication").disabled = aChecked;
  },

  /**
   * Displays a filepicker to the user and sets the formatting program path if
   * a valid selection is made
   */
  formattingProgramBrowse: function()
  {
    // Set up file picker
    var fp = Components.classes["@mozilla.org/filepicker;1"]
      .createInstance(Components.interfaces.nsIFilePicker);
    fp.init(window, "Integration Application", Components.interfaces.nsIFilePicker.modeOpen);
    fp.appendFilter("Executable File (*.exe)","*.exe;");
    fp.appendFilters(Components.interfaces.nsIFilePicker.filterAll);

    var ret = fp.show();
    if (ret == Components.interfaces.nsIFilePicker.returnCancel || !fp.file)
      return;

    document.getElementById("txt_integration_appPath").value = fp.file.path;
  },

  /**
   * TODO - replace with service
   * Enables the formatting program connection.
   */
  socketServerInitialize: function ()
  {
    var win = window.opener;
    while (win && win.opener)
      win = win.opener;

    win.top.gVUUSocketData.initialize();
  },

  /**
   * TODO - replace with service
   * Disables the formatting program connection.
   */
  socketServerTerminate: function ()
  {
    var win = window.opener;
    while (win && win.opener)
      win = win.opener;

    win.top.gVUUSocketData.terminate();
  },


  /****************************************************
  *****************************************************
  ***** Testing (simple)
  *****************************************************
  ****************************************************/

  // method so testing simple stuff
  test: function(aText)
  {
    // simple testing stuff goes here... duh!


  }

};  // end gVUUPrefDialog declaration
