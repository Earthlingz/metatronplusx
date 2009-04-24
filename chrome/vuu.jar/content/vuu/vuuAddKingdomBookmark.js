/**
 * Written by Anthony Gabel on 22 September 2005.
 *
 * Provides the code behind vuuAddKingdomBookmark.xul for all functions
 * relating to the VUU add kingdom bookmark dialog.
 *
 * Requires:
 *  TODO
 *  reporter.js
 */


/**
 * Custom error handler
 */
function vuuCustomErrorHandler(aDescription, aPage, aLine, aChar)
{
    top.gVUUReporter.vuuAlert(window, "Javascript Error Occured"
        ,"Error description:  " + aDescription
        + "\nPage address:       " + aPage
        + "\nLine number:        " + aLine
        + "\nCharacter:          " + aChar);

    return true;
}

/**
 * Single object that provides code for the VUU add kingdom bookmark Dialog.
 */
var gVUUAddKBookmarkDialog =
{
    /**
     * Called each time a VUU Add Kingdom Bookmark Dialog window is created (opened)
     * (directly after it loads). Sets any values passed as a window argument
     * param:  aEvent - Event - Onload event obejct
     */

    onload: function(aEvent)
    {
        window.onerror = vuuCustomErrorHandler;

        if (window.arguments[0]) {

            var        params = window.arguments[0];

            if (params.serverHrefID != null) {

                if (params.serverHrefID == "wol") {
                document.getElementById("lstServers").selectedIndex = 0;
                } else if (params.serverHrefID == "b") {
                document.getElementById("lstServers").selectedIndex = 1;
                } else if (params.serverHrefID == "gen") {
                document.getElementById("lstServers").selectedIndex = 2;
                }

            }

            if (params.kingdomNum != null) {
                document.getElementById("txtKingdomNum").value = params.kingdomNum;
            }

            if (params.islandNum != null) {
                document.getElementById("txtIslandNum").value = params.islandNum;
            }
        }
    },

    /**
     * Called each time a VUU Add Kingdom Boomark Dialog window is closed via the 'Accept' button.
     * Adds and saves the new bookmark
     */

    onaccept: function()
    {
        var        params = window.arguments[0];
        var        bookmarks = this.getBookmarkManager();
        var        selectedIndex = -1;

        var        kingdom = null;
        var        island = null;
        var        type = null;
        var        description = null;

        kingdom = parseInt(document.getElementById("txtKingdomNum").value);
        island = parseInt(document.getElementById("txtIslandNum").value);

        selectedIndex = document.getElementById("lstTypes").selectedIndex;

        if (selectedIndex == 0) {
            type = bookmarks.TYPE_FOE;
        } else if (selectedIndex == 1) {
            type = bookmarks.TYPE_FRIEND;
        } else if (selectedIndex == 2) {
            type = bookmarks.TYPE_INTEREST;
        }

        description = document.getElementById("txtDescription").value;

        bookmarks.addKingdomBookmark(kingdom, island, type, description);
        bookmarks.saveKingdomBookmarks();

        params.out = true;
    },

    /**
     * Returns the appropriate bookmark manager for this add kingdom dialog
     * return:  nsIVUUBookmarkManager - bookmark manager for this dialog
     */

    getBookmarkManager: function()
    {
        var        servers = null;

        servers = Components.classes["@mozilla.org/vuu/servers-service;1"].
        getService(Components.interfaces.nsIVUUServersService);

        if (document.getElementById("lstServers").selectedIndex == 0) {
            return servers.getServerByHrefID("wol").bookmarkManager;
        } else if (document.getElementById("lstServers").selectedIndex == 1) {
            return servers.getServerByHrefID("b").bookmarkManager;
        } else if (document.getElementById("lstServers").selectedIndex == 2) {
            return servers.getServerByHrefID("gen").bookmarkManager;
        }
    }

};  // end gVUUAddKBookmarkDialog declaration
