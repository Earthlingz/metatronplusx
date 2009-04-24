/**
 * @author Anthony Gabel
 *
 * Functionality related to VUU bookmarking.
 *
 * @requires className Description
 */

var gVUUBookmarks =
{
    /**
     * ID of bookmark display area in a document.
     */

    bookmarkDisplayID: "vuu_left_bookmarks",

    /**
     * ID of page content display area in a document (everything not related to bookmarking display).
     */

    pageContentID: "vuu_page_center",

    /**
     * ID of the new full page content area
     */

    fullPageContentID: "vuu_page_full_content",

    // ID of bookmark link on kingdom page
    linkBookmark: "vuu_link_bookmark",

    // ID of tag link on kingdom page
    linkTag: "vuu_link_tag",

    kingdomLinkHref: "scores.cgi?ks=$k&is=$i",
    otherLinkHref: "javascript:fire_bookmarking_event('$n:$k:$i');",

    /**
     * Returns whether the given document should display bookmarking related information.
     * @param  {HTMLDocument} aDoc Document to be tested
     * @return true if document should display bookmarking information, false otherwise.
     * @type   boolean
     */

    isBookmarkDisplayPage: function(aDoc)
    {
        var        href = aDoc.location.href;

        if (href.indexOf("scores.cgi") != -1
            || href.indexOf("magic.cgi") != -1
            || href.indexOf("thievery.cgi") != -1
            || href.indexOf("attack.cgi") != -1
            || href.indexOf("msg.cgi") != -1 && href.indexOf("read") == -1)
        {
            return true;
        }

        return false;
    },

    isKingdomPage: function(aDoc)
    {
        return aDoc.location.href.indexOf("scores.cgi") != -1;
    },

    /**
     * Updates any bookmarking related information in the given document, or adds it if
     * there is nothing to update and the document is a condidate for bookmarking display informaiton.
     * @param  {HTMLDocument} aDoc Document to be modified
     * @param  {nsIVUUBookmarkManager} aBookmarks Bookmark manager from which information
     *         to add to the document is retrieved.
     */

    updateBookmarkDisplay: function(aDoc, aBookmarks)
    {
        var        linkHref = null;
        var        newBookmarkDisplay = null;

        // only update if the page is a Swirve page
        if (gVUU.isSwirvePage(aDoc)) {
            // if bookmarking is disabled or the page isn't one on which bookmarks are displayed
            // then return
            if (!gVUU.prefs.getBoolPref("allBookmarkingEnabled")
                    || !this.isBookmarkDisplayPage(aDoc))
            {
                return;
            }

            var        nodeToReplace = aDoc.getElementById(this.bookmarkDisplayID);

            // create the new bookmark display node
            if (this.isKingdomPage(aDoc))
                linkHref = this.kingdomLinkHref;
            else
                linkHref = this.otherLinkHref;

            newBookmarkDisplay = this.buildBookmarkDisplay(aDoc, aBookmarks, linkHref);

            // a display node already exists. Replace it with the new node
            if (nodeToReplace != null)
            {
                nodeToReplace.parentNode.replaceChild(newBookmarkDisplay, nodeToReplace);
            } else {
                // a display node DOES NOT already exist so build and add it. This should only
                // occur when a page first loads
                var table = aDoc.createElement("table");
                table.setAttribute("id", this.fullPageContentID);
                table.setAttribute("width", "100%");
                var tbody = aDoc.createElement("tbody");
                table.appendChild(tbody);
                var tr = aDoc.createElement("tr");
                tbody.appendChild(tr);

                var oldContent = aDoc.createElement("td");
                var center = gVUUDOM.getDescendentElement(aDoc.body, "center", 1, "eTODO");
                center.setAttribute("id", this.pageContentID);

                tr.appendChild(newBookmarkDisplay);
                tr.appendChild(oldContent);
                center.parentNode.insertBefore(table, center);
                oldContent.appendChild(center);
            }

            this.highlightBookmarks(aDoc, aBookmarks);
        }
    },

    /**
     * Adds bookmarking related information to the given document only if the document
     * is a candidate for bookmarking display information.
     * note: DO NOT CALL THIS FUNCTION FROM OUTSIDE THIS OBJECT. Call updateBookmarkDisplay() instead.
     * @param  {HTMLDocument} aDoc Document to be modified
     * @param  {nsIVUUBookmarkManager} aBookmarks Bookmark manager from which information
     *         to add to the document is retrieved.
     * @param  {String} aLinkHref What should happen when a bookmark is clicked by the user.
     *         Formatted with $k = kingdom number and $i = island number (kingodm and island
     *         numbers will be retrieved from the bookmark manager for each link created.
     *         eg. "scores.cgi?ks=$k&is=$i" <- for each bookmarked link created
     *         the appropriate kingdom and island numbers will be insterted at $k and $i.
     */

    buildBookmarkDisplay: function(aDoc, aBookmarks, aLinkHref)
    {
        var        curBookmark = null;
        var        origLinkHref = aLinkHref;
        var        newTD = aDoc.createElement("td");
        var        link = null;

        newTD.setAttribute("style", "vertical-align: top;");
        newTD.setAttribute("id", this.bookmarkDisplayID);

        newTD.appendChild(aDoc.createElement("p"));
        newTD.appendChild(aDoc.createElement("br"));

        // Kingdoms
        if (aBookmarks.taggedKingdom != null) {
            curBookmark = aBookmarks.taggedKingdom;
            link = this.createBookmarkLink(aDoc, curBookmark, origLinkHref, aBookmarks.COLOR_TAGGED);
            newTD.appendChild(link);
            newTD.appendChild(aDoc.createElement("br"));
            newTD.appendChild(aDoc.createElement("br"));
        }

        for (var i = 0; i < aBookmarks.numFoeKingdoms; i++) {
            curBookmark = aBookmarks.getKingdomBookmarkByIndex(i, aBookmarks.TYPE_FOE);
            link = this.createBookmarkLink(aDoc, curBookmark, origLinkHref, aBookmarks.COLOR_FOE);
            newTD.appendChild(link);
            newTD.appendChild(aDoc.createElement("br"));
        }

        if (aBookmarks.numFoeKingdoms > 0)
            newTD.appendChild(aDoc.createElement("br"));

        for (var i = 0; i < aBookmarks.numInterestKingdoms; i++) {
            curBookmark = aBookmarks.getKingdomBookmarkByIndex(i, aBookmarks.TYPE_INTEREST);
            link = this.createBookmarkLink(aDoc, curBookmark, origLinkHref, aBookmarks.COLOR_INTEREST);
            newTD.appendChild(link);
            newTD.appendChild(aDoc.createElement("br"));
        }

        if (aBookmarks.numInterestKingdoms > 0)
            newTD.appendChild(aDoc.createElement("br"));

        for (var i = 0; i < aBookmarks.numFriendKingdoms; i++) {
            curBookmark = aBookmarks.getKingdomBookmarkByIndex(i, aBookmarks.TYPE_FRIEND);
            link = this.createBookmarkLink(aDoc, curBookmark, origLinkHref, aBookmarks.COLOR_FRIEND);
            newTD.appendChild(link);
            newTD.appendChild(aDoc.createElement("br"));
        }

        if (aBookmarks.numFriendKingdoms > 0)
            newTD.appendChild(aDoc.createElement("br"));

        // Provinces
        if (aBookmarks.taggedProvince != null) {
            curBookmark = aBookmarks.taggedProvince;
            link = this.createBookmarkLink(aDoc, curBookmark, origLinkHref, aBookmarks.COLOR_TAGGED);
            newTD.appendChild(link);
            newTD.appendChild(aDoc.createElement("br"));
            newTD.appendChild(aDoc.createElement("br"));
        }

        for (var i = 0; i < aBookmarks.numFoeProvinces; i++) {
            curBookmark = aBookmarks.getProvinceBookmarkByIndex(i, aBookmarks.TYPE_FOE);
            link = this.createBookmarkLink(aDoc, curBookmark, origLinkHref, aBookmarks.COLOR_FOE);
            newTD.appendChild(link);
            newTD.appendChild(aDoc.createElement("br"));
        }

        if (aBookmarks.numFoeProvinces > 0)
            newTD.appendChild(aDoc.createElement("br"));

        for (var i = 0; i < aBookmarks.numInterestProvinces; i++) {
            curBookmark = aBookmarks.getProvinceBookmarkByIndex(i, aBookmarks.TYPE_INTEREST);
            link = this.createBookmarkLink(aDoc, curBookmark, origLinkHref, aBookmarks.COLOR_INTEREST);
            newTD.appendChild(link);
            newTD.appendChild(aDoc.createElement("br"));
        }

        if (aBookmarks.numInterestProvinces > 0)
            newTD.appendChild(aDoc.createElement("br"));

        for (var i = 0; i < aBookmarks.numFriendProvinces; i++) {
            curBookmark = aBookmarks.getProvinceBookmarkByIndex(i, aBookmarks.TYPE_FRIEND);
            link = this.createBookmarkLink(aDoc, curBookmark, origLinkHref, aBookmarks.COLOR_FRIEND);
            newTD.appendChild(link);
            newTD.appendChild(aDoc.createElement("br"));
        }

        if (aBookmarks.numFriendProvinces > 0)
            newTD.appendChild(aDoc.createElement("br"));

        return newTD;
    },

    /**
     * Creates a link from a bookmark. What happens when clicking on the link is determined
     * by "aLinkHref".
     * @param  {HTMLDocument} aDoc
     * @param  {nsIVUUBookmark} aBookmark A kingdom or province bookmark
     * @param  {String} aLinkHref
     * @param  {String} aColor
     * @return Created link node
     * @type   Element
     */

    createBookmarkLink: function(aDoc, aBookmark, aLinkHref, aColor)
    {
        var        link = aDoc.createElement("a");
        var        linkHref = aLinkHref.replace(/\$k/g, aBookmark.kingdom);

        linkHref = linkHref.replace(/\$i/g, aBookmark.island);
        linkHref = linkHref.replace(/\$n/g, aBookmark.name);

        link.setAttribute("href", linkHref);
        link.textContent = aBookmark.fullName;
        link.setAttribute("style", "color: " + aColor + ";");
        link.setAttribute("title", aBookmark.description);

        return link;
    },

    highlightBookmarks: function(aDoc, aBookmarks)
    {
        if (this.isKingdomPage(aDoc)) {
            this.highlightKingdomPage(aDoc);
        } else {
            this.highlightOtherPage(aDoc, aBookmarks);
        }
    },

    highlightKingdomPage: function(aDoc)
    {
        var        node = aDoc.getElementById("tableKingdomData");

        node = gVUUDOM.getDescendentElement(node, "tbody", 1);

        var        nodeToReplace = gVUUDOM.getChildElement(node, "tr", 2);
        var        newNode = null;
        var        helper = new vuuKingdomSortingHelper(aDoc);

        newNode = helper.createProvincesRow(helper.CURRENT);
        node.replaceChild(newNode, nodeToReplace);

        var        kingdom = parseInt(aDoc.forms[0].elements.namedItem("vuuHiddenKingdomNum").getAttribute("value"));
        var        island = parseInt(aDoc.forms[0].elements.namedItem("vuuHiddenIslandNum").getAttribute("value"));
        var        server = gVUU.servers.getServerByHref(aDoc.location.href);
        var        bookmark = server.bookmarkManager.getKingdomBookmark(kingdom, island);
        var        linkBookmark = aDoc.getElementById(this.linkBookmark);

        node = aDoc.getElementById("vuu_bookmark_actions");

        if (bookmark == null) {

            if (node != null) {
                node.removeAttribute("style");
            }

            if (linkBookmark != null) {
                linkBookmark.setAttribute("onclick", "fire_bookmarking_event('add'); return false;");
                linkBookmark.textContent = "Bookmark Kingdom";
            }
        } else if (node != null) {

            node.setAttribute("style", "border-bottom: solid "
                              + server.bookmarkManager.getColorFromType(bookmark.type) + ";");

            if (linkBookmark != null) {
                linkBookmark.setAttribute("onclick", "fire_bookmarking_event('remove'); return false;");
                linkBookmark.textContent = "Delete Bookmark";
            }
        }

    },

    highlightOtherPage: function(aDoc, aBookmarks)
    {
        var        regex = /((\w|\s){1,20})\s\((\d{1,2}):(\d{1,2})\)/;
        var        regexResult = null;

        var        province = null;
        var        selectBox = aDoc.forms[0].elements.namedItem("targetprovince");

        if (selectBox == null) {
            selectBox = aDoc.forms[1].elements.namedItem("targetprovince");
        }

        if (selectBox == null) return;

        selectBox.setAttribute("onchange",
                "this.setAttribute('style', this.options[this.selectedIndex].getAttribute('style'));");

        for (i = 0; i < selectBox.length; i++) {

            regexResult = regex.exec(selectBox.options[i].text);

            if (regexResult != null) {
                province = aBookmarks.getProvinceBookmark(regexResult[1].trim(),
                                        parseInt(regexResult[3]), parseInt(regexResult[4]));

                if (province != null) {
                    selectBox.options[i].setAttribute("style", "background-color: " +
                                        aBookmarks.getColorFromType(province.type) + ";");

                } else {
                    selectBox.options[i].setAttribute("style", "background-color: " +
                                        gVUUColors.WHITE + ";");

                }

            } else {
                selectBox.options[i].setAttribute("style", "background-color: " +
                                        gVUUColors.WHITE + ";");
            }
        }

        selectBox.setAttribute("style", selectBox.options[selectBox.selectedIndex].getAttribute("style"));
    },

    addProvinceBookmark: function(aName, aKingdom, aIsland, aServerHrefID)
    {
        var        params = { provinceName: aName, kingdomNum: aKingdom, islandNum: aIsland, serverHrefID: aServerHrefID, out: false };

        window.openDialog("chrome://vuu/content/vuuAddProvinceBookmark.xul",
                        "vuuOverlayAddProvinceBookmarkWindow", "chrome,resizable,modal,dialog", params);

        return params.out;
    },

    addKingdomBookmark: function(aKingdom, aIsland, aServerHrefID)
    {
        var params = { kingdomNum: aKingdom, islandNum: aIsland, serverHrefID: aServerHrefID, out: false };

        window.openDialog("chrome://vuu/content/vuuAddKingdomBookmark.xul",
                        "vuuKingdomPageAddKingdomBookmarkWindow", "chrome,resizable,modal,dialog", params);

        return params.out;
    },

    /**
     * Called whenever the context menu is activated. Determines whether
     * "Bookmark Province" should be shown.
     */

    onProvinceBookmarkPopup: function(aEvent)
    {
        if (!gVUU.prefs.getBoolPref("allBookmarkingEnabled")) {
            gContextMenu.showItem("vuuContext_bookmarkProvince", false);
            gContextMenu.showItem("vuuContext_removeProvinceBookmark", false);
            gContextMenu.showItem("vuuContext_tagProvince", false);
            return;
        }

        var        doc = gVUUDOM.getMainUtopiaDocument(window, "eTODO");
        var        server = gVUU.servers.getServerByHref(doc.location.href);
        var        selection = gVUUDOM.getSelectedText();
        var        regex = /((\w|\s){1,20})\s\((\d{1,2}):(\d{1,2})\)/;
        var        regexResult = null;
        var        displayMenuItem = false;
        var        name = null;
        var        kingdom = null;
        var        island = null;

        if (server == null)
            server = gVUU.servers.getServerByForumHref(doc.location.href)

        if (selection != "")
            regexResult = regex.exec(selection);

        gContextMenu.showItem("vuuContext_tagProvince", server != null && regexResult != null);

        if (regexResult != null) {
            name = regexResult[1].trim();
            kingdom = parseInt(regexResult[3]);
            island = parseInt(regexResult[4]);

            for (var i = 0; i < gVUU.servers.numServers; i++) {
                server = gVUU.servers.getServerByIndex(i);

                if (server.bookmarkManager.getProvinceBookmark(name, kingdom, island) != null) {
                    displayMenuItem = true;
                    break;
                }
            }
        }

        gContextMenu.showItem("vuuContext_bookmarkProvince", !displayMenuItem && regexResult != null);
        gContextMenu.showItem("vuuContext_removeProvinceBookmark", displayMenuItem && regexResult != null);
    },

    /**
     * Adds a province to the province bookmarks
     */

    onPopupBookmarkProvince: function()
    {
        var        doc = gVUUDOM.getMainUtopiaDocument(window, "eTODO");
        var        server = gVUU.servers.getServerByHref(doc.location.href);
        var        hrefID = null;
        var        selection = gVUUDOM.getSelectedText();
        var        name = null;
        var        kingdom = null;
        var        island = null;

        if (server == null)
            server = gVUU.servers.getServerByForumHref(doc.location.href)

        if (server != null)
            hrefID = server.hrefID;

        if (selection != "") {
            var regex = /((\w|\s){1,20})\s\((\d{1,2}):(\d{1,2})\)/;
            var regexResult = regex.exec(selection);

            if (regexResult != null) {
                name = regexResult[1].trim();
                kingdom = parseInt(regexResult[3]);
                island = parseInt(regexResult[4]);

                this.addProvinceBookmark(name, kingdom, island, hrefID);
            }
        }
    },

    /**
     * Removes a bookmarked province from the appropriate bookmark manager
     */

    onPopupRemoveProvinceBookmark: function()
    {
        var        server = null;
        var        selection = gVUUDOM.getSelectedText();
        var        name = null;
        var        kingdom = null;
        var        island = null;
        var        bookmark = null;

        if (selection != "") {
            var regex = /((\w|\s){1,20})\s\((\d{1,2}):(\d{1,2})\)/;
            var regexResult = regex.exec(selection);

            if (regexResult != null) {
                name = regexResult[1].trim();
                kingdom = parseInt(regexResult[3]);
                island = parseInt(regexResult[4]);

                for (var i = 0; i < gVUU.servers.numServers; i++) {
                    server = gVUU.servers.getServerByIndex(i);
                    bookmark = server.bookmarkManager.getProvinceBookmark(name, kingdom, island);
                    if (bookmark != null) {
                        server.bookmarkManager.removeProvinceBookmark(name, kingdom, island, bookmark.type);
                        server.bookmarkManager.saveProvinceBookmarks();
                        this.updateBookmarkDisplay(
                        gVUUDOM.getMainUtopiaDocument(window, "eTODO"), server.bookmarkManager);
                        break;
                    }
                }
            }
        }
    },

    /**
     * Tags a province
     */

    onPopupTagProvince: function()
    {
        var        doc = gVUUDOM.getMainUtopiaDocument(window, "eTODO");
        var        server = gVUU.servers.getServerByHref(doc.location.href);
        var        selection = gVUUDOM.getSelectedText();
        var        name = null;
        var        kingdom = null;
        var        island = null;

        if (server == null)
            server = gVUU.servers.getServerByForumHref(doc.location.href)

        if (server != null && selection != "") {

            var        regex = /((\w|\s){1,20})\s\((\d{1,2}):(\d{1,2})\)/;
            var        regexResult = regex.exec(selection);

            if (regexResult != null) {
                name = regexResult[1].trim();
                kingdom = parseInt(regexResult[3]);
                island = parseInt(regexResult[4]);

                server.bookmarkManager.setTaggedProvince(name, kingdom, island);
                this.updateBookmarkDisplay(
                    gVUUDOM.getMainUtopiaDocument(window, "eTODO"), server.bookmarkManager);
            }
        }
    }
};
