/**
 * Written by Anthony Gabel on ?? November 2004.
 *
 * Provides the code behind vuuSidebar.xul for all functions
 * relating to the VUU Sidebar.
 *
 * Requires:
 *  TODO
 *  reporter.js
 */


/**
 * Single object that provides code for the VUU Sidebar.
 */
var gVUUSidebar =
{
    /**
     * Called each time a VUU sidebar window is opened (directly after it loads)
     * param:  aEvent - Event - Onload event obejct
     */

    onload: function(aEvent)
    {
        if (top.gVUU.prefs.getBoolPref("vuuDisplaySidebarAllInOne")) {
            window.document.getElementById("section_all_in_one").removeAttribute("hidden");
        }

        // set collapsable elements correctly
        if (!top.gVUU.prefs.getBoolPref("vuuModifySidebarVUUMainExpanded")) {
            this.toggleCollapsedBody(window.document.getElementById("section_vuu_main_header"));
        }

        if (!top.gVUU.prefs.getBoolPref("vuuModifySidebarAllInOneExpanded")) {
            this.toggleCollapsedBody(window.document.getElementById("section_all_in_one_header"));
        }

        if (!top.gVUU.prefs.getBoolPref("sidebarAllInOneOptionsExpanded")) {
            this.toggleCollapsedBody(window.document.getElementById("section_all_in_one_options_header"));
        }

        if (!top.gVUU.prefs.getBoolPref("vuuModifySidebarVUUARTExpanded")) {
            this.toggleCollapsedBody(window.document.getElementById("section_army_return_times_header"));
        }

        if (!top.gVUU.prefs.getBoolPref("vuuModifySidebarSDExpanded")) {
            this.toggleCollapsedBody(window.document.getElementById("section_spell_durations_header"));
        }

        this.updateArmyReturnTimes();
        this.updateSpellDurations();
    },

    /**
     * Toggles whether the body of a sidebar section is collapsed or expanded
     * param:  aNode - HTMLElement - section header element
     */

    toggleCollapsedBody: function(aNode)
    {
        var expanded = false;

        if (aNode.nextSibling.getAttribute("class") == "section-body-collapsed") {
            // expand
            aNode.setAttribute("class", "section-header-expanded");
            aNode.nextSibling.setAttribute("class", "section-body-expanded");
            expanded = true;
        } else {
            // collapse
            aNode.setAttribute("class", "section-header-collapsed");
            aNode.nextSibling.setAttribute("class", "section-body-collapsed");
        }

        if (aNode.getAttribute("id") == "section_vuu_main_header") {
            top.gVUU.prefs.setBoolPref("vuuModifySidebarVUUMainExpanded", expanded);
        } else if (aNode.getAttribute("id") == "section_all_in_one_header") {
            top.gVUU.prefs.setBoolPref("vuuModifySidebarAllInOneExpanded", expanded);
        } else if (aNode.getAttribute("id") == "section_all_in_one_options_header") {
            top.gVUU.prefs.setBoolPref("sidebarAllInOneOptionsExpanded", expanded);
        } else if (aNode.getAttribute("id") == "section_army_return_times_header") {
            top.gVUU.prefs.setBoolPref("vuuModifySidebarVUUARTExpanded", expanded);
        } else if (aNode.getAttribute("id") == "section_spell_durations_header") {
            top.gVUU.prefs.setBoolPref("vuuModifySidebarSDExpanded", expanded);
        }
    },

    /**
     * Forwards to gVUU.copyPageToClipboard().
     */

    copyPageToClipboard: function()
    {
        top.gVUU.copyPageToClipboard();
    },

    /**
     * Opens the VUU homepage in a new tab.
     */

    gotoHomepage: function()
    {
        var newUrl = "http://metatronplus.googlepages.com";
        var tBrowser = top.document.getElementById("content");
        var tab = tBrowser.addTab(newUrl);
        tBrowser.selectedTab = tab;
    },

    /**
     * Displays the VUU preferences dialog
     */

    displayPreferences: function(aPaneID)
    {
        // TODO - kludge to get around Firefox prefwindow bug where incorrect pane is displayed
        aPaneID = "pane_general";

        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                                    .getService(Components.interfaces.nsIPrefBranch);

        var instantApply = prefs.getBoolPref("browser.preferences.instantApply");
        var features = "chrome,titlebar,toolbar,centerscreen" + (instantApply ? ",dialog=no" : ",modal");

        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                    .getService(Components.interfaces.nsIWindowMediator);

        var win = wm.getMostRecentWindow("MetatronPlus:Preferences");

        if (win) {
            win.focus();
            if (aPaneID) {
                var pane = win.document.getElementById(aPaneID);
                win.document.documentElement.showPane(pane);
            }
        } else {
            window.openDialog("chrome://vuu/content/vuuPreferences.xul",
                                    "vuuSidebarPreferencesWindow", features, aPaneID);
        }
    },

    /**
     * Displays the VUU bookmark manager dialog
     */

    displayBookmarkManager: function()
    {
        var server = null;
        var doc = null;
        var i = 0;

        window.open("chrome://vuu/content/vuuBookmarkManager.xul",
                                "vuuSidebarBookmarkManagerWindow", "chrome,resizable,modal,dialog");

        for (i = 0; i < top.gVUU.servers.numServers; i++) {
            server = top.gVUU.servers.getServerByIndex(i);
            server.bookmarkManager.saveAll();
        }

        doc = top.gVUUDOM.getMainUtopiaDocument(top, "eTODO");
        server = top.gVUU.servers.getServerByHref(doc.location.href);

        if (server != null) {
            top.gVUUBookmarks.updateBookmarkDisplay(doc, server.bookmarkManager);
        }
    },

    /**
     * Resets all cached server information.
     */

    resetServerInfo: function()
    {
        window.open("chrome://vuu/content/vuuResetServerData.xul",
                                "vuuSidebarResetServerDataWindow", "chrome,resizable,modal,dialog");

        this.updateArmyReturnTimes();
        this.updateSpellDurations();
    },


    /****************************************************
    *****************************************************
    ***** All-in-one formatter section
    *****************************************************
    ****************************************************/

    /**
     * All-in-one formatter submit button.
     * Submits the information to the formatter and opens a new tab with
     * the results.
     */

    aioSubmit: function()
    {
        var newUrl = "chrome://vuu/skin/allinone_input.html";
        var tBrowser = top.document.getElementById("content");
        var tab = tBrowser.addTab(newUrl);

        tBrowser.selectedTab = tab;

        // give the page some time to load from hard drive
        setTimeout(
            gVUUSidebar.aioSubmitHelper(
                tBrowser,
                tab,
                document.getElementById("aio_data").value,
                document.getElementById("aio_nw").value,
                document.getElementById("aio_group").selectedIndex,
                document.getElementById("aio_exportLinesOnly").checked,
                document.getElementById("aio_warKingdom").value,
                document.getElementById("aio_warIsland").value,
                document.getElementById("aio_summarizeAid").checked,
                document.getElementById("aio_summaryOnly").checked,
                document.getElementById("aio_enemyStats").checked,
                document.getElementById("aio_selfExportLine").checked,
                document.getElementById("aio_bbcode").checked
            ), 333
        );

        // clear the all in one input controls
        setTimeout(gVUUSidebar.aioClearTimeout, 400);
    },

    /**
     * Copies the current page's original text to the formatter data textbox in
     * the sidebar and presses the 'submit' button.
     */

    aioSubmitPage: function()
    {
        var doc = top.gVUUDOM.getMainUtopiaDocument(top.window);
        var tmpNode = null;

        if (doc && doc.body) {
            // if this is a modified page there will be an 'original text' element
            // is the original text element present?
            if ((tmpNode = doc.getElementById("vuu_original_text")) != null) {
                // get text from element & copy to formatter textbox
                document.getElementById("aio_data").value = tmpNode.value;
            } else {
                // get text from page and copy to formatter textbox
                document.getElementById("aio_data").value =
                top.gVUUDOM.getAllText(top.window, doc.body);
            }

            // 0 = WoL, 1 = Gen, 2 = GuW
            if (doc.location.href.indexOf("wol.swirve.com") != -1) {
                document.getElementById("aio_group").selectedIndex = 0;
            } else if (doc.location.href.indexOf("b.swirve.com") != -1) {
                document.getElementById("aio_group").selectedIndex = 2;
            } else if (doc.location.href.indexOf("gen.swirve.com") != -1) {
                document.getElementById("aio_group").selectedIndex = 1;
            }
        }

        this.aioSubmit();
    },

    /**
     * Fills in the All-in-one data in 'aTab's browser. 'aTab's browser's content
     * document should contain "chrome://vuu/skin/allinone_input.html"
     * param:  aBrowser - Browser - a browser object
     * param:  aTab - Tab - a tab whose browser's content document contains
     *         "chrome://vuu/skin/allinone_input.html"
     * param:  aData - String - data to be formatted
     * param:  aNW - String - networth of target being formatted
     * param:  aServer - index - 0 = WoL, 1 = Gen, 2 = GuW
     */

    aioSubmitHelper: function(aBrowser, aTab, aData, aNW, aServer,
                            aExportLinesOnly, aWarKingdom, aWarIsland, aSummarizeAid,
                            aSummaryOnly, aEnemyStats, aSelfExportLine, aBBCode)
    {
        // use closure to pass parameters to setTimeout
        return (
            function()
            {
                var browser = aBrowser.getBrowserForTab(aTab);

                browser.contentDocument.getElementById("aio_data").value = aData;
                browser.contentDocument.getElementById("aio_nw").value = aNW;
                if (aServer == 0) browser.contentDocument.getElementById("aio_wol").checked = true;
                else if (aServer == 1) browser.contentDocument.getElementById("aio_gen").checked = true;
                else if (aServer == 2) browser.contentDocument.getElementById("aio_tour").checked = true;
                browser.contentDocument.getElementById("aio_exportLinesOnly").checked = aExportLinesOnly;

                // options
                browser.contentDocument.getElementById("aio_warKingdom").value = aWarKingdom;
                browser.contentDocument.getElementById("aio_warIsland").value = aWarIsland;
                browser.contentDocument.getElementById("aio_summarizeAid").checked = aSummarizeAid;
                browser.contentDocument.getElementById("aio_summaryOnly").checked = aSummaryOnly;
                browser.contentDocument.getElementById("aio_enemyStats").checked = aEnemyStats;
                browser.contentDocument.getElementById("aio_selfExportLine").checked = aSelfExportLine;
                browser.contentDocument.getElementById("aio_bbcode").checked = aBBCode;

                browser.contentDocument.getElementById("aio_submit").click();
            }
        );
    },

    /**
     * Presses the 'clear' button for the All-in-one formatter on the sidebar
     */

    aioClearTimeout: function()
    {
        document.getElementById("aio_clear").click();
    },

    /**
     * Clears all fields of the All-in-one formatter on the sidebar
     */

    aioClear: function()
    {
        document.getElementById("aio_data").value = "";
        document.getElementById("aio_nw").value = "";
        document.getElementById("aio_exportLinesOnly").checked = false;
        document.getElementById("aio_warKingdom").value = "";
        document.getElementById("aio_warIsland").value = "";
        document.getElementById("aio_summarizeAid").checked = false;
        document.getElementById("aio_summaryOnly").checked = false;
        document.getElementById("aio_enemyStats").checked = true;
        //document.getElementById("aio_selfExportLine").checked = false;
        document.getElementById("aio_bbcode").checked = false;
    },

    /****************************************************/
    /****************************************************/
    /***** Army return times section ********************/
    /****************************************************/
    /****************************************************/

    /**
     * Whether the army return times section has had it's XUL elements
     * initialized yet
     */

    artSectionInitialized: false,

    /**
     * Updates the sidebar's XUL to display the current army return times
     */

    updateArmyReturnTimes: function()
    {
        var nodeVbox = null;
        var nodeContent = null;
        var tmpNode = null;
        var unknown = true;
        var server = null;
        var i = 0;
        var j = 0;

        if (top.gVUU.prefs.getBoolPref("vuuModifySidebarArmyTimes")) {
            // show army return times section
            window.document.getElementById("section_army_return_times").removeAttribute("hidden");

            // initialization of army away times sections
            if (!this.artSectionInitialized) {
                for (i = 0; i < top.gVUU.servers.numServers; i++) {
                    server = top.gVUU.servers.getServerByIndex(i);

                    // create army away time section for this server
                    // create the encompasing vbox
                    nodeVbox = window.document.createElement("vbox");
                    nodeVbox.id = "art_" + server.sidebarElementID;
                    nodeVbox.hidden = "true";

                    // create the header label
                    tmpNode = window.document.createElement("label");
                    tmpNode.setAttribute("class", "section-row-art-header");
                    tmpNode.setAttribute("value", server.name);
                    nodeVbox.appendChild(tmpNode);

                    nodeContent = window.document.createElement("vbox");
                    nodeContent.setAttribute("id", "art_" + server.hrefID + "_content");
                    nodeVbox.appendChild(nodeContent);

                    // create a final spacer element
                    tmpNode = window.document.createElement("spacer");
                    tmpNode.setAttribute("class", "section-space");
                    nodeVbox.appendChild(tmpNode);

                    window.document.getElementById("section_army_return_times_collapsable")
                        .appendChild(nodeVbox);
                }

                this.artSectionInitialized = true;
            }

            // actual updating of army away time sections
            for (i = 0; i < top.gVUU.servers.numServers; i++) {
                server = top.gVUU.servers.getServerByIndex(i);

                if (server.cache.numArmies == 0) {
                    window.document.getElementById("art_" + server.sidebarElementID).hidden = "true";
                } else {
                    this.updateServerArmyReturnTimes(server);
                    unknown = false;
                }
            }

            // indicate that we don't have any army information if it is all unknown
            if (unknown) {
                window.document.getElementById("lbl_art_unknown").removeAttribute("hidden");
            } else {
                window.document.getElementById("lbl_art_unknown").hidden = "true";
            }
        }
    },

    /**
     * Updates a single servers army return times.
     * param:  aServer - nsIVUUServer - server whose times are to be updated
     */

    updateServerArmyReturnTimes: function(aServer)
    {
        var tmpNode = null;
        var nodeSection = window.document.getElementById("art_" + aServer.sidebarElementID);
        var nodeContent = null;
        var army = null;
        var currentTime = new Date();
        var timeRemaining = null;
        var i = 0;

        // create a new content area, add army labels and replace old content area
        nodeContent = window.document.createElement("vbox");
        nodeContent.setAttribute("id", "art_" + aServer.hrefID + "_content");

        for (i = 0; i < aServer.cache.numArmies; i++) {
            army = aServer.cache.getArmyByIndex(i);
            tmpNode = window.document.createElement("label");
            tmpNode.setAttribute("class", "section-row-art");
            if (army.returnTime) {
                // army is still out
                timeRemaining = army.returnTime - currentTime.getTime();
                tmpNode.setAttribute("value", "#" + (i + 2) + ": "
                + top.gVUUDateTime.getTimeHHMM(new Date(army.returnTime))
                + " (" + top.gVUUDateTime.milliToHHMMSS(timeRemaining) + " rem)");
            } else {
                // army is home
                tmpNode.setAttribute("value", "#" + (i + 2) + ": available");
            }
            nodeContent.appendChild(tmpNode);
        }

        nodeSection.replaceChild(nodeContent, window.document.getElementById("art_" +
                                          aServer.hrefID + "_content"));

        nodeSection.removeAttribute("hidden");
    },


    /****************************************************/
    /****************************************************/
    /***** Spell duration section ***********************/
    /****************************************************/
    /****************************************************/

    /**
     * Whether the spell duration section has had it's XUL elements
     * initialized yet
     */

    sdSectionInitialized: false,

    /**
     * Updates the sidebar's XUL to display the current self-spell durations
     */

    updateSpellDurations: function()
    {
        var nodeVbox = null;
        var tmpNode = null;
        var unknown = true;
        var server = null;

        if (top.gVUU.prefs.getBoolPref("vuuModifySidebarSpellDurations")) {
            // show spell duration section
            window.document.getElementById("section_spell_durations").removeAttribute("hidden");

            // initialization of spell duration sections
            if (!this.sdSectionInitialized) {

                for (var i = 0; i < top.gVUU.servers.numServers; i++) {
                    server = top.gVUU.servers.getServerByIndex(i);

                    // create spell duration section for this server
                    // create the encompasing vbox
                    nodeVbox = window.document.createElement("vbox");
                    nodeVbox.id = "sd_" + server.sidebarElementID;
                    nodeVbox.hidden = "true";

                    // create the header label
                    tmpNode = window.document.createElement("label");
                    tmpNode.setAttribute("class", "section-row-sd-header");
                    tmpNode.setAttribute("value", server.name);
                    nodeVbox.appendChild(tmpNode);

                    // create a 'filler' vbox that will be replaced each time spell
                    // durations are updated
                    tmpNode = window.document.createElement("vbox");
                    nodeVbox.appendChild(tmpNode);

                    // create a final spacer element
                    tmpNode = window.document.createElement("spacer");
                    tmpNode.setAttribute("class", "section-space");
                    nodeVbox.appendChild(tmpNode);

                    window.document.getElementById("section_spell_durations_collapsable").appendChild(nodeVbox);
                }

                this.sdSectionInitialized = true;
            }

            // actual updating of spell duration sections
            for (var i = 0; i < top.gVUU.servers.numServers; i++) {

                server = top.gVUU.servers.getServerByIndex(i);
                if (server.cache.numSpells == 0) {
                    window.document.getElementById("sd_" + server.sidebarElementID).hidden = "true";
                } else {
                    this.updateServerSpellDurations(server);
                    unknown = false;
                }
            }

            // indicate that we don't have any spell duration information if it is all unknown
            if (unknown) {
                window.document.getElementById("lbl_sd_unknown").removeAttribute("hidden");
            } else {
                window.document.getElementById("lbl_sd_unknown").hidden = "true";
            }
        }
    },

    /**
     * Updates a single server's self-spell durations.
     * param:  aServer - nsIVUUServer - server whose times are to be updated
     */

    updateServerSpellDurations: function(aServer)
    {
        var nodeSection = window.document.getElementById("sd_" + aServer.sidebarElementID);
        var tmpNode = window.document.createElement("vbox");
        var tmpNode1 = null;
        var spell = null;

        aServer.cache.sortSpellsByDurationDescending();

        // create a label for each spell
        for (var i = 0; i < aServer.cache.numSpells; i++) {
            spell = aServer.cache.getSpellByIndex(i);
            tmpNode1 = window.document.createElement("label");
            tmpNode1.setAttribute("class", "section-row-sd");

            if (spell.duration == 99) {
                tmpNode1.setAttribute("value", "-- : " + spell.name);
            } else if (spell.duration > 0) {
                tmpNode1.setAttribute("value", this.padZero(spell.duration) + " : " + spell.name);
            } else {
                tmpNode1.setAttribute("value", "expired : " + spell.name);
            }

            tmpNode.appendChild(tmpNode1);
        }

        nodeSection.replaceChild(tmpNode, nodeSection.firstChild.nextSibling);
        nodeSection.removeAttribute("hidden");
    },

    /**
     * Pads a number with up to a single 0 if required (eg. 3 -> 03, 11 -> 11)
     * param:  aNum - integer - number to be tested for padding
     * return: String - fully padded number
     */

    padZero: function(aNum)
    {
        return ((aNum <= 9) ? ("0" + aNum) : aNum);
    },

    /***************************************************/
    /***************************************************/
    /************* Socket testing **********************/
    /***************************************************/
    /***************************************************/

    tmpTest: null,

    socketSetup: function()
    {
        var kpOnDataAvailable = function (channel, socketContext, inStr, sourceOffset, count) {
            this.data += this.inStream.read(count);
            var commands = top.vuuSocket.getCommands(this.data);
            this.data = commands[0];

            for (var i = 1; i < commands.length; i++) {
                top.gVUUReporter.vuuAlert("|" + commands[i] + "|");
            }
        }

        tmpTest = new top.vuuSocket();
        tmpTest.init(top.gVUU.prefs.getIntPref("vuuFormattingPort"), kpOnDataAvailable);
        tmpTest.send("1 test command.:::\n");
        tmpTest.send("2 test command.:::\n");
        tmpTest.send("3 test command.:::\n");
    },

    socketClose: function()
    {
        tmpTest.close();
    },

    socketSend: function()
    {
        tmpTest.send("haveCB.Past Glories (6:50).LostANDFound (15:12):::\n");
    },

    /***************************************************/
    /***************************************************/
    /**************** Testing (simple) *****************/
    /***************************************************/
    /***************************************************/

    // method so testing simple stuff
    test: function(aText)
    {
        top.gVUUReporter.vuuAlert(top, "Sidebar Test", aText);
        // simple testing stuff goes here... duh!
    }

};  // end gVUUSidebar declaration
