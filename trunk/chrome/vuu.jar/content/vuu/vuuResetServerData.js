/**
 * Written by Anthony Gabel on 13 February 2006.
 *
 * Provides the code behind vuuResetServerData.xul for all functions
 * relating to the VUU reset server data dialog.
 *
 * Requires:
 *  TODO
 *  reporter.js
 */


/**
 * Single object that provides code for the VUU reset server data Dialog.
 */
var gVUUResetServerDataDialog =
{
    /**
     * Called each time a VUU Reset Server Data Dialog window is created (opened)
     * (directly after it loads). Sets any values passed as a window argument
     * param:  aEvent - Event - Onload event obejct
     */

    onload: function(aEvent)
    {
        // no code
    },

    /**
     * Called each time a VUU Reset Server Data Dialog window is closed via the 'Accept' button.
     * Resets the server data of any selected servers
     */

    onaccept: function()
    {
        var        server = null;
        var        bookmarks = null;

        if (document.getElementById("vuuServer1").checked) {
            server = this.getServer("wol");
            server.cache.resetAll();

            bookmarks = this.getBookmarkManager("wol");
            bookmarks.resetAll();
            bookmarks.saveAll();
        }

        if (document.getElementById("vuuServer2").checked) {
            server = this.getServer("b");
            server.cache.resetAll();

            bookmarks = this.getBookmarkManager("b");
            bookmarks.resetAll();
            bookmarks.saveAll();
        }

        if (document.getElementById("vuuServer3").checked) {
            server = this.getServer("gen");
            server.cache.resetAll();

            bookmarks = this.getBookmarkManager("gen");
            bookmarks.resetAll();
            bookmarks.saveAll();
        }
    },

    /**
     * Returns the appropriate server object for the given server
     * @param:  aHrefID - string - hrefID of server to retrieve
     * return:  nsIVUUServer - retrieved server
     */

    getServer: function(aHrefID)
    {
        var        servers = null;
        var        win = window.opener;

        while (win && win.opener) {
            win = win.opener;
        }

        servers = win.top.gVUU.servers;

        if (servers == null) {
            servers = Components.classes["@mozilla.org/vuu/servers-service;1"].
                            getService(Components.interfaces.nsIVUUServersService);
        }

        return servers.getServerByHrefID(aHrefID);
    },

    /**
     * Returns the appropriate bookmark manager for the given server
     * @param:  aHrefID - string - hrefID of server used to retrieve bookmark manager
     * return:  nsIVUUBookmarkManager - bookmark manager for this dialog
     */

    getBookmarkManager: function(aHrefID)
    {
        var        servers = null;

        servers = Components.classes["@mozilla.org/vuu/servers-service;1"].
                        getService(Components.interfaces.nsIVUUServersService);

        return servers.getServerByHrefID(aHrefID).bookmarkManager;
    }

};  // end gVUUResetServerDataDialog declaration
