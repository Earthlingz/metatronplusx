/**
 * Written by Anthony Gabel on 04 July 2005.
 * Major Update: 17 July 2005 (consolidate into global VUUReporter object)
 *
 * Singleton reporter object useful for reporting errors, status, debugging info etc.
 *
 * Requires:
 *  none
 */


var gVUUReporter =
{
    /**
     * Prints a VUU specific version of 'aMessage' to the javascript console
     * param:  aMessage - String - message to print to javascript console
     */

    vuuPrintToJSConsole: function (aMessage)
    {
        this.printToJSConsole("MetatronPlus - " + aMessage);
    },

    /**
     * Prints 'aMessage' to the javascript console
     * param:  aMessage - String - message to print to javascript console
     */

    printToJSConsole: function (aMessage)
    {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService);

        consoleService.logStringMessage(aMessage);
    },

    /**
     * Displays a VUU specific alert dialog
     * param:  aWindow - Window - parent window
     * param:  aTitle - String - title of alert dialog
     * param:  aMessage - String - message to display
     */

    vuuAlert: function (aWindow, aTitle, aMessage)
    {
        this.alert(aWindow, "MetatronPlus - " + aTitle, aMessage);
    },

    /**
     * Displays a generic alert dialog
     * param:  aWindow - Window - parent window
     * param:  aTitle - String - title of alert dialog
     * param:  aMessage - String - message to display
     */

    alert: function (aWindow, aTitle, aMessage)
    {
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
        .getService(Components.interfaces.nsIPromptService);

        prompts.alert(aWindow, aTitle, aMessage);
    }
};  // end gVUUReporter declaration
