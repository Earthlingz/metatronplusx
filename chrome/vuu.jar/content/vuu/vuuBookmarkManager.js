/**
 * @author Anthony Gabel
 *
 * Provides the code behind vuuBookmarkManager.xul for all functions
 * relating to the VUU bookmark manager dialog.
 *
 * @requires className Description
 */


/**
 * Single object that provides code for the VUU bookmark manager Dialog.
 */
var gVUUBMDialog =
{
    /**
     * Called each time the Dialog window is created (opened)
     * (directly after it loads). Sets any values passed as a window argument
     * param:  aEvent - Event - Onload event obejct
     */

    onload: function(aEvent)
    {
        // populate bookmark list
        if (document.getElementById("bm_types").selectedIndex == -1) {
            document.getElementById("bm_types").selectedIndex = 0;
        }

        if (document.getElementById("bm_servers").selectedIndex == -1) {
            document.getElementById("bm_servers").selectedIndex = 0;
        }

        document.getElementById("bm_types").selectedIndex = document.
                                getElementById("bm_types").selectedIndex;

        document.getElementById("bm_servers").selectedIndex = document.
                                getElementById("bm_servers").selectedIndex;

        this.buildBookmarkList();
    },

    /**
     * Clears then builds the bookmark list
     */

    buildBookmarkList: function()
    {
        var        bookmarkType = document.getElementById("bm_types").getAttribute("value");
        var        server = this.getServer(document.getElementById("bm_servers").getAttribute("value"));
        var        bookmarks = server.bookmarkManager;
        var        bookmark = null;
        var        tree = document.getElementById("treechildren_bookmarks");
        var        item = null;
        var        cell = null;
        var        row = null;
        var        i = 0;

        var        nameFoe = bookmarks.getDisplayNameFromType(bookmarks.TYPE_FOE);
        var        nameInterest = bookmarks.getDisplayNameFromType(bookmarks.TYPE_INTEREST);
        var        nameFriend = bookmarks.getDisplayNameFromType(bookmarks.TYPE_FRIEND);

        this.clearBookmarkList();

        if (bookmarkType == "kingdom") {
            document.getElementById("treecol_name").collapsed = true;

            for (i = 0; i < bookmarks.numFoeKingdoms; i++) {
                bookmark = bookmarks.getKingdomBookmarkByIndex(i, bookmarks.TYPE_FOE);
                tree.appendChild(this.createItem(bookmark, bookmarks.TYPE_FOE, nameFoe));
            }

            for (i = 0; i < bookmarks.numInterestKingdoms; i++) {
                bookmark = bookmarks.getKingdomBookmarkByIndex(i, bookmarks.TYPE_INTEREST);
                tree.appendChild(this.createItem(bookmark, bookmarks.TYPE_INTEREST, nameInterest));
            }

            for (i = 0; i < bookmarks.numFriendKingdoms; i++) {
                bookmark = bookmarks.getKingdomBookmarkByIndex(i, bookmarks.TYPE_FRIEND);
                tree.appendChild(this.createItem(bookmark, bookmarks.TYPE_FRIEND, nameFriend));
            }

        } else if (bookmarkType == "province") {
            document.getElementById("treecol_name").collapsed = false;

            for (i = 0; i < bookmarks.numFoeProvinces; i++) {
                bookmark = bookmarks.getProvinceBookmarkByIndex(i, bookmarks.TYPE_FOE);
                tree.appendChild(this.createItem(bookmark, bookmarks.TYPE_FOE, nameFoe));
            }

            for (i = 0; i < bookmarks.numInterestProvinces; i++) {
                bookmark = bookmarks.getProvinceBookmarkByIndex(i, bookmarks.TYPE_INTEREST);
                tree.appendChild(this.createItem(bookmark, bookmarks.TYPE_INTEREST, nameInterest));
            }

            for (i = 0; i < bookmarks.numFriendProvinces; i++) {
                bookmark = bookmarks.getProvinceBookmarkByIndex(i, bookmarks.TYPE_FRIEND);
                tree.appendChild(this.createItem(bookmark, bookmarks.TYPE_FRIEND, nameFriend));
            }
        }
    },

    createItem: function(aBookmark, aType, aTypeName)
    {
        var        item = document.createElement("treeitem");
        var        row = document.createElement("treerow");

        item.appendChild(row);
        row.appendChild(this.createTreeCell("(" + aBookmark.kingdom + ":" + aBookmark.island + ")", aBookmark.kingdom + ":" + aBookmark.island));
        row.appendChild(this.createTreeCell("", aType, aTypeName));
        row.appendChild(this.createTreeCell(aBookmark.name, aBookmark.name));
        row.appendChild(this.createTreeCell(aBookmark.description, ""));

        return item;
    },

    createTreeCell: function(aLabel, aValue, aProperty)
    {
        var        cell = document.createElement("treecell");

        cell.setAttribute("label", aLabel);
        cell.setAttribute("value", aValue);

        if (aProperty) {
            cell.setAttribute("properties", aProperty);
        }

        return cell;
    },

    /**
     * Completely removes all items from the bookmarks list
     */

    clearBookmarkList: function()
    {
        var        tree = document.getElementById('tree_bookmarks');
        var        rowCount = tree.view.rowCount;
        var        item = null;

        for (var i = rowCount - 1; i >= 0; i--) {
            item = tree.view.getItemAtIndex(i);
            item.parentNode.removeChild(item);
        }
    },

    /**
     * Open the add bookmark dialog for the correct server / type.
     */

    addBookmark: function()
    {
        var        bookmarkType = document.getElementById("bm_types").value;
        var        server = this.getServer(document.getElementById("bm_servers").value);

        if (bookmarkType == "kingdom") {
            this.getTop().gVUUBookmarks.addKingdomBookmark("", "", server.hrefID)
        } else if (bookmarkType == "province") {
            this.getTop().gVUUBookmarks.addProvinceBookmark("", "", "", server.hrefID)
        }

        this.buildBookmarkList();
    },

    /**
     * Open the edit bookmark dialog for the correct server / type.
     */

    editBookmark: function()
    {
        // currently nothing!
    },

    /**
     * Remove any selected bookmarks from the correct server / type.
     */

    removeBookmarks: function()
    {
        var        bookmarkType = document.getElementById("bm_types").value;
        var        server = this.getServer(document.getElementById("bm_servers").value);
        var        tree = document.getElementById('tree_bookmarks');
        var        item = null;
        var        location = null;
        var        type = null;
        var        name = null;

        var        start = new Object();
        var        end = new Object();
        var        numRanges = tree.view.selection.getRangeCount();

        for (var t = numRanges - 1; t >= 0; t--) {
            tree.view.selection.getRangeAt(t, start, end);
            for (var itemIndex = end.value; itemIndex >= start.value; itemIndex--) {
                if (bookmarkType == "kingdom") {
                    item = tree.view.getItemAtIndex(itemIndex);
                    location = item.firstChild.firstChild.getAttribute("value").split(":");
                    type = item.firstChild.firstChild.nextSibling.getAttribute("value");

                    server.bookmarkManager.removeKingdomBookmark(parseInt(location[0]), parseInt(location[1]), parseInt(type));
                    item.parentNode.removeChild(item);
                } else if (bookmarkType == "province") {
                    item = tree.view.getItemAtIndex(itemIndex);
                    location = item.firstChild.firstChild.getAttribute("value").split(":");
                    type = item.firstChild.firstChild.nextSibling.getAttribute("value");
                    name = item.firstChild.firstChild.nextSibling.nextSibling.getAttribute("value");

                    server.bookmarkManager.removeProvinceBookmark(name, parseInt(location[0]), parseInt(location[1]), parseInt(type));
                    item.parentNode.removeChild(item);
                }
            }
        }
    },

    /**
     * Updates which buttons should be enabled / disabled
     */

    updateActionStatus: function(aBookmarkTree)
    {
        var        selectedCount = 0;
        var        start = new Object();
        var        end = new Object();
        var        numRanges = aBookmarkTree.view.selection.getRangeCount();

        for (var t = 0; t < numRanges && selectedCount < 2; t++) {
            aBookmarkTree.view.selection.getRangeAt(t, start, end);

            for (var itemIndex = start.value; itemIndex <= end.value && selectedCount < 2; itemIndex++)
                selectedCount++;
        }

        // add button is always enabled

        // edit button only enabled when a single item is selected
        if (selectedCount == 1) {
            document.getElementById("btn_edit").disabled = false;
        } else {
            document.getElementById("btn_edit").disabled = true;
        }

        if (selectedCount >= 1) {
            document.getElementById("btn_remove").disabled = false;
        } else {
            document.getElementById("btn_remove").disabled = true;
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

    getTop: function()
    {
        var        top = null;
        var        win = window.opener;

        while (win && win.opener)
            win = win.opener;

        return win.top;
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
