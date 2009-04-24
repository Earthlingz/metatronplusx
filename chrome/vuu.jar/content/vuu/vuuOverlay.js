/**
 * Written by Anthony Gabel on ?? November 2004.
 * Major Update: 15 July 2005 (reduce clutter in global space by making a
 *   global VUU object instead of separate functions)
 * Update: 02 August 2005 - (fixed spell loading off by one error and removed
 *   preference defaults to defaults/preferences/vuu.js)
 *
 * This is where the script begins. The main extension object is declared here
 * and eventhandlers are added to Firefox windows at the end of this file.
 *
 * Requires:
 *  TODO
 */


/**
 * VUU extension's GUID
 */
const gVUU_GUID = "{2c5693fc-cbf5-4310-8c58-fa879d4cc644}";

/**
 * Short, simple debug method. Prints message to the Javascript console.
 * param:  aDebugText - String - message to print to javascript console
 */
function vuuDebug(aDebugText)
{
    gVUUReporter.vuuPrintToJSConsole(aDebugText);
}

function MpDebug(localFlag, aDebugText)
{
    if (localFlag && gVUU.debug) {
        gVUUReporter.vuuPrintToJSConsole("Debug Message : " + aDebugText);
    }
}

/**
 * The main extension object
 */
var gVUU =
{
    /** Whether this object has been initialized yet */
    initialized: false,

    /** Whether Debugging is enabled or not*/
    debug: true,

    /**
     * Singleton utopia servers information (for all servers).
     * Holds an nsIVUUServersService interface
     */

    servers: null,

    /**
     * Holds a reference to a GUID generator
     * Holds an nsIVUUGUIDGeneratorService interface
     */

    guidGenerator: null,

    /**
     * Whether the throne & links/top.htm pages have been loaded. Used to
     * correctly display free income highlighting
     */

    pageLoadedThrone: false,
    pageLoadedLinks: false,

    /** Page constants */
    PAGE_UNKNOWN: 100,
    PAGE_KINGDOM: 1,
    PAGE_GROWTH: 2,
    PAGE_SEND_MESSAGE: 3,
    // PAGE_COUNCIL_CIVILIAN: 4, <- page removed from Utopia
    PAGE_READ_MESSAGES: 5,
    PAGE_SCIENCE: 6,
    PAGE_INTRO: 7,
    PAGE_THRONE: 8,
    PAGE_WAR_ROOM: 9,
    PAGE_COUNCIL_MILITARY: 10,
    PAGE_COUNCIL_MYSTICS: 11,
    PAGE_RELATIONS: 12,
    PAGE_WORLD: 13,
    PAGE_DEMOGRAPHICS: 14,
    PAGE_AID: 15,
    PAGE_KINGDOM_GROWTH: 16,
    PAGE_LINKS: 17,
    PAGE_MYSTICS: 18,
    PAGE_FREE_INCOME: 19,
    PAGE_THIEVERY: 20,
    PAGE_BOARDS: 21,
    PAGE_NEWS: 22,
    PAGE_LEADERS: 23,

    /** Preference related */
    // preferences object that allows access to VUU preferences
    prefs: null,
    // preferences relating to the sorting of kingdoms
    PREF_KINGDOM_SORT_PROVINCE: 0,
    PREF_KINGDOM_SORT_RACE: 1,
    PREF_KINGDOM_SORT_LAND: 2,
    PREF_KINGDOM_SORT_NW: 3,
    PREF_KINGDOM_SORT_NWPA: 4,
    PREF_KINGDOM_SORT_RANK: 5,

    // whether the spell durations have been updated at least once
    genesisSpellDurationsFirstUpdate: true,

    // how often army return times are updated
    UPDATE_MS_ARMY_RETURN_TIMES: 10000,
    // when an are returns home, all other armies returning within this window are also
    // considered to have been returned
    UPDATE_MS_ARMY_RETURN_TIMES_WINDOW: 120000,
    // how often spell durations are updated
    UPDATE_MS_SPELL_DURATIONS: 55000,
    // how often data should be saved to file
    SAVE_ALL_SERVER_DATA_DURATIONS: 7200000,  // 2 hours => 7200 seconds => 7200000 milliseconds

    // path to file to use to save all non-preference persistent VUU data
    // DirIO.get("ProfD") returns the profile directory
    PATH_PERSISTENT_DATA: DirIO.get("ProfD").path + DirIO.sep + "extensions" + DirIO.sep
        + gVUU_GUID + DirIO.sep + "vuu_general.dat",


    /**
     * Called whenever ANY new Firefox window is opened (irregardless of whether
     * it is a browser window etc)
     * param:  aEvent - Event - Onload event obejct
     */

    onLoad: function(aEvent)
    {
        var        appContent = null;

        this.initialize();

        // if the window is a browser window
        if (window.getBrowser) {
            // set method to be called after DOM content has been loaded
            // (before images etc. are fetched)
            if ((appContent = window.document.getElementById("appcontent")) != null) {
                appContent.addEventListener("DOMContentLoaded",
                function(aEvent) { gVUU.testLocation(aEvent); }, true);
            }

            // listen for tab switches
            window.getBrowser().addEventListener("select",
                function(aEvent) { gVUU.tabSelect(aEvent); }, true);
        }
    },

    /**
     * Called whenever any Firefox window is closed
     * param:  aEvent - Event - Onunload event object
     */

    onUnload: function(aEvent)
    {
        // if the window is a browser window
        if (window.getBrowser) {
            // if the window is a browser window
            if (window.getBrowser) {
                window.getBrowser().removeEventListener("select",
                function(aEvent) { gVUU.tabSelect(aEvent); }, true);
            }

            // save all non-preference persistent data like army return times
            // and spell durations
            this.saveVUUPersistentDataToFile();
        }
    },

    /**
     * Initializes VUU preferences / properties / etc
     */

    initialize: function()
    {
        // only initialize if not already initialized
        if (!this.initialized) {
            // initialize preferences
            this.setupPreferences();

            // create a reference to and initialize (if necessary) singleton servers
            this.setupServers();

            // Create a reference to a GUID Generator
            this.guidGenerator = Components.classes["@mozilla.org/vuu/guid-generator-service;1"].
                                    getService(Components.interfaces.nsIVUUGUIDGeneratorService);

            // update army return times & spell durations
            this.updateArmyReturnTimesWithTimeout();
            this.updateSpellDurationsWithTimeout();
            this.saveAllServerDataToFileWithTimeout(0);

            // set up context menu item listener
            if (document.getElementById("contentAreaContextMenu")) {

                document.getElementById("contentAreaContextMenu").addEventListener(
                "popupshowing",
                function(aEvent) { gVUUBookmarks.onProvinceBookmarkPopup(aEvent); },
                false
                )
            }

            this.initialized = true;
        }
    },

    /**
     * Creates a references to and initializes (if neccessary) the gVUU.servers
     * singleton server information.
     */

    setupServers: function()
    {
        this.servers = Components.classes["@mozilla.org/vuu/servers-service;1"].
                            getService(Components.interfaces.nsIVUUServersService);

        if (!this.servers.initialized) {
            this.servers.addNewServer("World of Legends", "wol", "82.133.85.9", "section_wol");
            this.servers.addNewServer("Great Utopian War", "b", "206.104.8.71", "section_bf");
            this.servers.addNewServer("Genesis", "gen", "82.133.85.117", "section_gen");

            // load non-preference data from file (army return times/spell durations/etc)
            this.loadVUUPersistentDataFromFile();

            this.servers.initialized = true;
        }
    },

    /**
     * Function called when selected tab changes
     * param:  aEvent - Event - Select event object
     */

    tabSelect: function(aEvent)
    {
        // receives all select events on a page - find only tab select events:
        if (aEvent.originalTarget.tagName == "xul:tabs") {
            var        doc = gVUUDOM.getMainUtopiaDocument(window, "eTODO");

            if (doc != null && this.isSwirvePage(doc)) {
                // this may have changed if Throne room loaded in its own page
                //this.updateFreeIncomeHighlightSingle();

                var        server = this.servers.getServerByHref(doc.location.href);

                if (server != null)
                    gVUUBookmarks.updateBookmarkDisplay(doc, server.bookmarkManager);
            }
        }
    },

    /**
     * Initializes 'this.prefs' and loads users preferences
     */

    setupPreferences: function()
    {
        if (!this.prefs)
        {
            var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService);
            this.prefs = prefService.getBranch("extensions.vuu.");
        }
    },

    isSwirvePage: function(aDoc)
    {
        var swirvePage = false;
        var href = null;

        if (aDoc != null)
        {
        href = aDoc.location.href;

        // note: google adwords include swirve href & enter.cgi so it incorrectly
        // fires the enter.cgi method which sets Monarch message to null because
        // google adwords doesn't have a Monarch message. That's why we also
        // exclude "google" from the href in this IF test
        if ((href.indexOf(this.servers.SWIRVE_HREF) != -1
                || href.indexOf(this.servers.IP_ADDRESS_START) != -1)
            && href.indexOf("google") == -1)
        {
            swirvePage = true;
        }
        }

        return swirvePage;
    },

    /**
    * Tests whether 'aEvent.originalTarget' is a document that should be
    * modified by VUU. If not the document remains unchanged. If so the
    * document will be modified according to the modifications required for
    * that type of page.
    * param:  aEvent - Event - DOMContentLoaded event object
    */
    testLocation: function(aEvent)
    {
        var doc = aEvent.originalTarget; // doc is document that triggered event
        var href = doc.location.href;
        var pageType = this.PAGE_UNKNOWN;
        var pageTypeStr = "UnKnown";

        this.debug = this.prefs.getBoolPref("vuuGeneralDebug");

        // Checks that VUU is enabled and user is at a Swirve site
        if (this.prefs.getBoolPref("vuuGeneralEnabled") && this.isSwirvePage(doc)) {

            // initialize application integration
            // (this is safe to call multiple times)
            if (this.prefs.getBoolPref("vuuFormattingEnabled"))
                gVUUSocketData.initialize();

            // Any page from here on will ALWAYS be modified, even if only to add a
            // hidden element to indicate that the page has been modified
            if (href.indexOf("scores.cgi") != -1) {
                pageType = this.PAGE_KINGDOM;
                pageTypeStr = "PAGE_KINGDOM";
            } else if (href.indexOf("menu.cgi") != -1) {
                pageType = this.PAGE_THRONE;
                pageTypeStr = "PAGE_THRONE";
            } else if (href.indexOf("build.cgi") != -1 && href.indexOf("destroy") == -1) {
                pageType = this.PAGE_GROWTH;
                pageTypeStr = "PAGE_GROWTH";
            } else if (href.indexOf("science.cgi") != -1) {
                pageType = this.PAGE_SCIENCE;
                pageTypeStr = "PAGE_SCIENCE";
            } else if (href.indexOf("attack.cgi") != -1) {
                pageType = this.PAGE_WAR_ROOM;
                pageTypeStr = "PAGE_WAR_ROOM";
            } else if (href.indexOf("magic.cgi") != -1) {
                pageType = this.PAGE_MYSTICS;
                pageTypeStr = "PAGE_MYSTICS";
            } else if (href.indexOf("thievery.cgi") != -1) {
                pageType = this.PAGE_THIEVERY;
                pageTypeStr = "PAGE_THIEVERY";
            } else if (href.indexOf("msg.cgi") != -1) {
                // both send and receive messages screens
                if (href.indexOf("read") != -1) {
                    pageType = this.PAGE_READ_MESSAGES;
                    pageTypeStr = "PAGE_READ_MESSAGES";
                } else {
                    pageType = this.PAGE_SEND_MESSAGE;
                    pageTypeStr = "PAGE_SEND_MESSAGE";
                }
            } else if (href.indexOf("council") != -1) {
                // all council screens
                if (href.indexOf("elder=3") != -1) {
                    pageType = this.PAGE_COUNCIL_MILITARY;
                    pageTypeStr = "PAGE_COUNCIL_MILITARY";
                } else if (href.indexOf("elder=6") != -1) {
                    pageType = this.PAGE_COUNCIL_MYSTICS;
                    pageTypeStr = "PAGE_COUNCIL_MYSTICS";
                }
            } else if (href.indexOf("status.cgi") != -1) {
                pageType = this.PAGE_RELATIONS;
                pageTypeStr = "PAGE_RELATIONS";
            } else if (href.indexOf("leaders.cgi") != -1) {
                pageType = this.PAGE_WORLD;
                pageTypeStr = "PAGE_WORLD";
            } else if (href.indexOf("players/race2.htm") != -1) {
                pageType = this.PAGE_DEMOGRAPHICS;
                pageTypeStr = "PAGE_DEMOGRAPHICS";
            } else if (href.indexOf("aid.cgi") != -1) {
                pageType = this.PAGE_AID;
                pageTypeStr = "PAGE_AID";
            } else if (href.indexOf("growth.cgi") != -1) {
                pageType = this.PAGE_KINGDOM_GROWTH;
                pageTypeStr = "PAGE_KINGDOM_GROWTH";
            } else if (href.indexOf("links/top.htm") != -1) {
                pageType = this.PAGE_LINKS;
                pageTypeStr = "PAGE_LINKS";
            } else if (href.indexOf("enter.cgi") != -1) {
                // note: there is no ? in href
                pageType = this.PAGE_INTRO;
                pageTypeStr = "PAGE_INTRO";
            } else if (href.indexOf("a-link.cgi?ent=true&s=") != -1) {
                pageType = this.PAGE_FREE_INCOME;
                pageTypeStr = "PAGE_FREE_INCOME";
            } else if (href.indexOf("win.cgi?bonus=2") != -1) {
                pageType = this.PAGE_FREE_INCOME;
                pageTypeStr = "PAGE_FREE_INCOME";
            } else if (href.indexOf("swirve.com/boards/board.cgi") != -1) {
                pageType = this.PAGE_BOARDS;
                pageTypeStr = "PAGE_BOARDS";
            } else if (href.indexOf("news.cgi") != -1) {
                pageType = this.PAGE_NEWS;
                pageTypeStr = "PAGE_NEWS";
            } else if (href.indexOf("kingdoms") != -1 || href.indexOf("players") != -1 ) {
                pageType = this.PAGE_LEADERS;
                pageTypeStr = "PAGE_LEADERS";
            }

            this.modifyPage(doc, pageType, pageTypeStr);
        }
    },

    /**
    * Determines what page modifications are to be done and calls appropriate
    * modifiers
    * param:  aDoc - HTMLDocument - document to modify
    * param:  aPageType - integer - a VUU.PAGE_ constant
    * param:  aPageTypeStr - string - a VUU.PAGE_ string constant
    */
    modifyPage: function(aDoc, aPageType, aPageTypeStr)
    {
        var modified = aDoc.getElementById("vuu_modified");
        if (!modified) {
            MpDebug(true, "Trying to Modify Page of type [" + aPageTypeStr + "]");
            this.insertOriginalTextAndHtml(aDoc);
            MpDebug(true, "Original page saved successfully.");
        }

        if (!modified && aPageType != this.PAGE_UNKNOWN) {

            switch (aPageType) {
                // the .modify() methods check that the document has not previously been modified
                case this.PAGE_THRONE: new vuuPMThrone(aDoc).modify(); break;
                case this.PAGE_KINGDOM: new vuuPMKingdom(aDoc).modify(); break;
                case this.PAGE_GROWTH: new vuuPMGrowth(aDoc).modify(); break;
                case this.PAGE_SEND_MESSAGE: new vuuPMSendMessages(aDoc).modify(); break;
                case this.PAGE_READ_MESSAGES: new vuuPMReadMessages(aDoc).modify(); break;
                case this.PAGE_SCIENCE: new vuuPMScience(aDoc).modify(); break;
                case this.PAGE_INTRO: new vuuPMIntro(aDoc).modify(); break;
                case this.PAGE_WAR_ROOM: new vuuPMWarRoom(aDoc).modify(); break;
                case this.PAGE_MYSTICS: new vuuPMMystics(aDoc).modify(); break;
                case this.PAGE_THIEVERY: new vuuPMThievery(aDoc).modify(); break;
                case this.PAGE_COUNCIL_MILITARY: new vuuPMCouncilMilitary(aDoc).modify(); break;
                case this.PAGE_COUNCIL_MYSTICS: new vuuPMCouncilMystics(aDoc).modify(); break;
                case this.PAGE_RELATIONS: new vuuPMRelations(aDoc).modify(); break;
                case this.PAGE_WORLD: new vuuPMWorld(aDoc).modify(); break;
                case this.PAGE_DEMOGRAPHICS: new vuuPMDemographics(aDoc).modify(); break;
                case this.PAGE_AID: new vuuPMAid(aDoc).modify(); break;
                case this.PAGE_KINGDOM_GROWTH: new vuuPMKingdomGrowth(aDoc).modify(); break;
                case this.PAGE_LINKS: new vuuPMLinks(aDoc).modify(); break;

                // in links.js
                case this.PAGE_FREE_INCOME: new vuuPMFreeIncome(aDoc).modify(); break;

                // do nothing for these
                case this.PAGE_BOARDS: break;
                case this.PAGE_NEWS: break;
                case this.PAGE_LEADERS: break;
                default: gVUUReporter.vuuAlert(window, "Unknown Page Modification Requested",
                "Unknown page modification requested:" + aPageType); break;
            }
        }

        // as long as the document hasn't been previously modified
        if (!modified) {
            MpDebug(true, "Trying to convert Page Header");
            this.modifyPageHeader(aDoc);
            MpDebug(true, "Page Header conversion completed");

            if (this.prefs.getBoolPref("vuuGeneralLocationsToLinks")) {
                MpDebug(true, "Link insertion started");
                new vuuLocationConverter(aDoc, aPageType).convertProvinceLocationsToLinks();
                MpDebug(true, "Link insertion  completed successfully");
            }

            this.sendProcessDocumentCommand(aDoc);
            this.insertPageModified(aDoc);

            // kludge to force a redraw -
            //A rendering bug otherwise causes forum posts to overlap occasionally
            aDoc.body.style.height="95%";

            MpDebug(true, "Metatron Plus completed utopia page conversion successfully");
        }
    },

    /**
    * Modifies the page header of document to include current acres and removes
    * " Bushels" and " Runes" suffixes if preferences allow.
    * (Only performs modification if there is a page header)
    * param:  aDoc - HTMLDocument - Document of which the header will be modified
    */
    modifyPageHeader: function(aDoc)
    {
        var   debug = this.prefs.getBoolPref("vuuGeneralLocalDebug");
        var   server = null;
        var   tmpNode = null;
        var   tableBdy = null;
        var   tableRw = null;
        var   count = 1;

        // set the utopia 'header' bar to include the current acres of this province
        server = this.servers.getServerByHref(aDoc.location.href);
        // Header is of the TYPE:-
        // Money: 1000gc
        // Peasants: 200
        // Food: 60000 Bushels
        // Runes: 1500
        // NW: 100,005gc

        if (server != null) {
            // first HEADER
            if (gVUUDOM.getDescendentTextNode(aDoc, "NW: ", 1, "e00087") != null)
                tmpNode = gVUUDOM.getDescendentTextNode(aDoc, "Money: ", 1, "e00087");

            if (tmpNode != null) {
                MpDebug(debug, "Found First Header");
                tableRw = tmpNode.parentNode.parentNode;
                tableBdy = tableRw.parentNode;
                tmpNode = null;

                tableRw.setAttribute("bgcolor", gVUUColors.TITLE_BAR_RED) ;
            }

            if (tableBdy != null && this.prefs.getBoolPref("allCondenseHeader")) {
                // remove Bushels from Food for now.
                var     foodCol = null;
                var     foodCount = null;
                tmpNode = gVUUDOM.getDescendentTextNode(tableBdy, "Food: ", 1, "e00087");
                foodCol = tmpNode.parentNode;
                foodCount = foodCol.firstChild.nodeValue;
                foodCol.firstChild.nodeValue = foodCount.substring(0, foodCount.indexOf(" Bushels"));
                MpDebug(debug, "Modified Food Header successfully");
            }

            if (tableRw != null &&
                (server.cache.acres != null) &&
                this.prefs.getBoolPref("vuuGeneralHeaderAcres")) {

                tmpNode = aDoc.createElement("td");
                tmpNode.textContent = "*Acres: " + gVUUFormatter.fNum(server.cache.acres);
                tmpNode.setAttribute("id", "vuu_header_land");
                tableRw.appendChild(tmpNode);
                MpDebug(debug, "Added Acres header successfully");
            }

            // second HEADER
            tmpNode = tableRw = tableBdy = null;

            if (gVUUDOM.getDescendentTextNode(aDoc, "NW: ", 2, "e00087") != null)
                tmpNode = gVUUDOM.getDescendentTextNode(aDoc, "Money: ", 2, "e00087");

            if (tmpNode != null) {
                MpDebug(debug, "Found Second Header");
                tableRw = tmpNode.parentNode.parentNode;
                tableBdy = tableRw.parentNode;
                tmpNode = null;

                tableRw.setAttribute("bgcolor", gVUUColors.TITLE_BAR_RED) ;
            }

            if (tableBdy != null && this.prefs.getBoolPref("allCondenseHeader")) {
                // remove Bushels from Food for now.
                var     foodCol = null;
                var     foodCount = null;
                tmpNode = gVUUDOM.getDescendentTextNode(tableBdy, "Food: ", 1, "e00087");
                foodCol = tmpNode.parentNode;
                foodCount = foodCol.firstChild.nodeValue;
                foodCol.firstChild.nodeValue = foodCount.substring(0, foodCount.indexOf(" Bushels"));
                MpDebug(debug, "Modified IInd Food Header successfully");
            }

            if (tableRw != null &&
                (server.cache.acres != null) &&
                this.prefs.getBoolPref("vuuGeneralHeaderAcres")) {

                tmpNode = aDoc.createElement("td");
                tmpNode.textContent = "*Acres: " + gVUUFormatter.fNum(server.cache.acres);
                tmpNode.setAttribute("id", "vuu_header_land");
                tableRw.appendChild(tmpNode);
                MpDebug(debug, "Added IInd Acres header successfully");
            }
        }
    },

    /**
    * Inserts a hidden node into document identifying it as having been modified
    * param:  aDoc - HTMLDocument - document to identify as having been modified
    */
    insertPageModified: function(aDoc)
    {
        var tmpNode = null;

        // add a hidden node indicating we've modified this page
        if (aDoc.body)
        {
        tmpNode = aDoc.createElement("input");
        tmpNode.setAttribute("type", "hidden");
        tmpNode.setAttribute("id", "vuu_modified");
        tmpNode.value = "true";
        aDoc.body.appendChild(tmpNode, aDoc.body);
        }
    },

    /**
    * Inserts hidden nodes containing the original text and html soucre of the document
    * param:  aDoc - HTMLDocument - document into which to insert original text & html
    */
    insertOriginalTextAndHtml: function(aDoc)
    {
        var        nodeNew = null;
        var        text = null;
        var        html = null;

        if (aDoc.body) {
            text = gVUUDOM.getAllText(window, aDoc.body);
            html = gVUUDOM.getHtmlSource(aDoc);

            nodeNew = aDoc.createElement("input");
            nodeNew.setAttribute("type", "hidden");
            nodeNew.setAttribute("id", "vuu_original_text");
            nodeNew.value = text;
            aDoc.body.appendChild(nodeNew, aDoc.body);

            nodeNew = aDoc.createElement("input");
            nodeNew.setAttribute("type", "hidden");
            nodeNew.setAttribute("id", "vuu_original_html");
            nodeNew.value = html;
            aDoc.body.appendChild(nodeNew, aDoc.body);
        }
    },


    /****************************************************/
    /****************************************************/
    /********  Universal fuctions Start here. ***********/
    /****************************************************/
    /****************************************************/

    /*
    * Copies the current page's original text & html source to the clipboard.
    * If the page is from utopia then there will be an 'original text' node;
    * if so then its text & html source is copied to the clipboard
    * if not then the page's current text & html source is copied to the clipboard
    */

    copyPageToClipboard: function()
    {
        var      doc = gVUUDOM.getMainUtopiaDocument(window);
        var      tmpNode = null;

        if (doc != null) {
            // are the original text & html elements present?
            if ((tmpNode = doc.getElementById("vuu_original_text")) != null) {
                // get text from elements & copy to clipboard
                gVUUClipboard.setTextAndHtml(tmpNode.value, doc.getElementById("vuu_original_html").value);
            } else {
                // get text from page and copy to clipboard
                gVUUClipboard.setTextAndHtml(
                gVUUDOM.getAllText(window, doc.body), gVUUDOM.getHtmlSource(doc));
            }
        }
    },

    /*
     * Function to enable MetatronPlus.
     */
    enableMetatronPlus: function()
    {
        this.setupPreferences();
        this.prefs.setBoolPref('vuuGeneralEnabled', true);
    },

    /*
     * Function to disable MetatronPlus.
     */
    disableMetatronPlus: function()
    {
        this.setupPreferences();
        this.prefs.setBoolPref('vuuGeneralEnabled', false);
    },

    /*
     * Function to show preference window for MetatronPlus.
     */
    showPreferences: function()
    {
        window.open("chrome://vuu/content/vuuPreferences.xul", "vuuPrefWindow", "pane_general,centerscreen");
    },

    /*
     * Sends the current page's original text and server to utopiatemple's
     * all-in-one formatter with default options.
     */
    aioFormatPage: function()
    {
        var      doc = gVUUDOM.getMainUtopiaDocument(window);
        var      tmpNode = null;
        var      data = "";
        var      server = 0;
        var      networth = "";

        if (doc && doc.body) {
            // if this is a modified page there will be an 'original text' element
            // is the original text element present?
            if ((tmpNode = doc.getElementById("vuu_original_text")) != null)
                data = tmpNode.value;
            else
                data = gVUUDOM.getAllText(window, doc.body);

            // 0 = WoL, 1 = Gen, 2 = GuW
            if (doc.location.href.indexOf("wol.swirve.com") != -1)
                server = 0;
            else if (doc.location.href.indexOf("b.swirve.com") != -1)
                server = 2;
            else if (doc.location.href.indexOf("gen.swirve.com") != -1)
                server = 1;
        }

        var     newUrl = "chrome://vuu/skin/allinone_input.html";
        var     tBrowser = document.getElementById("content");
        var     tab = tBrowser.addTab(newUrl);

        tBrowser.selectedTab = tab;

        // give the page some time to load from hard drive
        setTimeout(gVUU.aioFormatPageHelper(tBrowser, tab, data, networth, server), 333);
    },

    /*
     * Fills in the All-in-one data in 'aTab's browser. 'aTab's browser's content
     * document should contain "chrome://vuu/skin/allinone_input.html"
     * param:  aBrowser - Browser - a browser object
     * param:  aTab - Tab - a tab whose browser's content document contains
     *         "chrome://vuu/skin/allinone_input.html"
     * param:  aData - String - data to be formatted
     * param:  aNW - String - networth of target being formatted
     * param:  aServer - index - 0 = WoL, 1 = Gen, 2 = Tour
     */
    aioFormatPageHelper: function(aBrowser, aTab, aData, aNW, aServer)
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
                browser.contentDocument.getElementById("aio_submit").click();
            }
        );
    },

    /*
     * Updates free income highlighting a single time if a links/top.htm document
     * is present.
     * param:  aDocLinks - HTMLDocument - the links/top.htm document or NULL
     *                     if NULL then attempts to find links/top.htm in current window
     */
    updateFreeIncomeHighlightSingle: function(aDocLinks)
    {
        var        docLinks = null;
        var        tmpNode = null;
        var        server = null;
        var        cache = null;

        // since free income has been removed from utopia.
        return;

        if (aDocLinks) {
            docLinks = aDocLinks;
        } else {
            docLinks = gVUUDOM.getLinksTopUtopiaDocument(window);
        }

        // set free income indication
        if (gVUU.prefs.getBoolPref("vuuGeneralFreeIncomeHighlight") &&
            gVUU.pageLoadedLinks && gVUU.pageLoadedThrone && docLinks) {

            server = this.servers.getServerByHref(docLinks.location.href);

            if (server) {
                cache = server.cache;

                tmpNode = docLinks.getElementById("vuu_free_income");

                if ((cache.dateMonth != cache.freeIncomeMonth) ||
                    (cache.dateYear != cache.freeIncomeYear)) {

                    docLinks.body.setAttribute("style", "background-color: "
                                               + gVUUColors.TITLE_BAR_BLUE + ";");

                    tmpNode.setAttribute("style", "color: " + gVUUColors.GOLD +
                                         "; font-weight: bold;");
                } else if (docLinks.body.hasAttribute("style") || tmpNode.hasAttribute("style")) {
                    docLinks.body.removeAttribute("style");
                    tmpNode.removeAttribute("style");
                }
            }
        }
    },

    /*
     * Sends a document to integrated application.
     * @param  aDoc - HTMLDocument - Document which is to be sent
     */
    sendProcessDocumentCommand: function(aDoc)
    {
        var     server = gVUU.servers.getServerByHref(aDoc.location.href)
        var     command = null;
        var     docType = this.determineDocType(aDoc);
        var     supports = null;
        var     cache = null;
        var     socket = null;

        if (docType != null)
            supports = gVUUSocketData.supportsDocument(docType);

        if (gVUU.prefs.getBoolPref("vuuFormattingEnabled")
            && server != null
            && docType != null
            && gVUUSocketData.isAlive
            && gVUUSocketData.supportsCommand(vuuSocketCommand.PROCESS_DOC)
            && supports)
        {

            var olOnDataAvailable = function (aRequest, aSocketContext, aInputStream, aSourceOffset, aCount)
                {
                    // nothing should be returned
                }

            cache = server.cache;
            socket = new vuuSocket();
            socket.init(gVUU.prefs.getIntPref("vuuFormattingPort"), olOnDataAvailable);

            command = "[" + vuuSocketCommand.PROCESS_DOC + "]["
                        + gVUUSocketData.getGUID() + "]["
                        + docType + "][" + server.hrefID + "][" + cache.provinceName + "]["
                        + cache.kingdom + "][" + cache.island + "][";

            if (supports.indexOf("text") != -1)
                command += aDoc.getElementById("vuu_original_text").value + "][";
            else
                command += "][";

            if (supports.indexOf("html") != -1)
                command += aDoc.getElementById("vuu_original_html").value + "][";
            else
                command += "][";

            command += ":]\n";

            socket.send(command);
            vuuSocket.closeSocket(socket);
        }
    },

    /*
     * Determines the vuuSocketCommand.DOC_ type of a document.
     * @param  aDoc - HTMLDocument - Document to determine type of
     * @return String - vuuSocketCommand.DOC_ type of a document OR NULL if not a valid type
     */
    determineDocType: function(aDoc)
    {
        var      docType = null;
        var      href = aDoc.location.href;

        if (href.indexOf("scores.cgi") != -1)
            docType = vuuSocketCommand.DOC_KINGDOM;
        else if (href.indexOf("menu.cgi") != -1)
            docType = vuuSocketCommand.DOC_THRONE;
        else if (href.indexOf("build.cgi") != -1 && href.indexOf("destroy") == -1)
            docType = vuuSocketCommand.DOC_GROWTH;
        else if (href.indexOf("science.cgi") != -1)
            docType = vuuSocketCommand.DOC_SCIENCE;
        else if (href.indexOf("magic.cgi") != -1)
            docType = vuuSocketCommand.DOC_MYSTICS;
        else if (href.indexOf("thievery.cgi") != -1)
            docType = vuuSocketCommand.DOC_THIEVERY;

        // all council screens
        else if (href.indexOf("council") != -1)
        {
            if (href.indexOf("elder=3") != -1)
                docType = vuuSocketCommand.DOC_C_MILITARY;
            else if (href.indexOf("elder=6") != -1)
                docType = vuuSocketCommand.DOC_C_MYSTICS;
            else if (href.indexOf("elder=4") != -1)
                docType = vuuSocketCommand.DOC_C_INTERNAL;
            else if (href.indexOf("elder=5") != -1)
                docType = vuuSocketCommand.DOC_C_SCIENCES;
        }

        else if (href.indexOf("status.cgi") != -1)
            docType = vuuSocketCommand.DOC_RELATIONS;
        else if (href.indexOf("news.cgi?yesterday=true") != -1)
            docType = vuuSocketCommand.DOC_PAPER_LAST;
        else if (href.indexOf("news.cgi") != -1)
            docType = vuuSocketCommand.DOC_PAPER;
        else if (href.indexOf("board.cgi?") != -1)
            docType = vuuSocketCommand.DOC_FORUMS;

        return docType;
    },

    /**
    * Returns a GUID.
    * @return long - a GUID
    */
    getGUID: function(aDoc)
    {
        return this.guidGenerator.getGUID();
    },


    /***************************************************/
    /***************************************************/
    /*********** Army return time section **************/
    /***************************************************/
    /***************************************************/

    /*
     * Updates all servers army return times a single time and sets a timeout
     * to call this method again. This function runs until Firefox closes.
     * (ie. there is currently no way to stop it, although one could be added)
     * Performs update whether sidebar is open or not.
     */
    updateArmyReturnTimesWithTimeout: function()
    {
        this.updateArmyReturnTimesSingle();

        setTimeout("gVUU.updateArmyReturnTimesWithTimeout()", this.UPDATE_MS_ARMY_RETURN_TIMES);
    },

    /**
    * Performs a single update of all servers army return times.
    */
    updateArmyReturnTimesSingle: function()
    {
        var server = null;

        // actual updating of army away time sections
        for (var i = 0; i < this.servers.numServers; i++) {
            server = this.servers.getServerByIndex(i);

            if (server.cache.numArmies != 0) {
                this.updateServerArmyReturnTimes(server);
            }
        }
    },

    /*
     * Updates a single server's army return times.
     * param:  aServer - nsIVUUServer - Server whose times are to be updated
     */
    updateServerArmyReturnTimes: function(aServer)
    {
        var      cache = aServer.cache;
        var      army = null;
        var      currentTime = new Date();
        var      timeRemaining = null;
        var      returned = false;
        var      i = 0;

        for (i = 0; i < cache.numArmies; i++) {
            army = cache.getArmyByIndex(i);
            if (army && army.returnTime) {
                // army exists and may be out
                if (army.returnTime <= currentTime.getTime()) {
                    // army has returned since last update
                    army.returnTime = null;
                    if (!army.confirmedHome) returned = true;
                    army.confirmedHome = true;
                }
            }
        }

        // update sidebar
        if (!document.getElementById("sidebar-box").hidden) {
            if ((tmpNode = document.getElementById("sidebar"))) {
                if (tmpNode.contentWindow.gVUUSidebar) 
                    tmpNode.contentWindow.gVUUSidebar.updateArmyReturnTimes();
            }
        }

        // if an army has returned then alert the user through a dialog
        // build the alert dialogs text from all armies, not just the ones that have returned
        if (returned) {
            var     alertText = "Armies Returned Home\n\n"
                                + "Current Time:  " + gVUUDateTime.getTimeHHMM(currentTime) + "\n"
                                + "Server:  " + aServer.name + "\n\n";

            for (i = 0; i < cache.numArmies; i++) {
                army = cache.getArmyByIndex(i);
                
                if (army && army.returnTime) {
                    timeRemaining = army.returnTime - currentTime.getTime();
                    // if returning within a certain window then army is considered returned
                    
                    if (timeRemaining < this.UPDATE_MS_ARMY_RETURN_TIMES_WINDOW)
                        army.confirmedHome = true;
                        alertText += "General #" + (i + 2) + ":  " 
                                     + gVUUDateTime.getTimeHHMM(new Date(army.returnTime)) + " ("
                                     + gVUUDateTime.milliToHHMMSS(timeRemaining) + " remaining)\n";
                } else {
                    alertText += "General #" + (i + 2) + ":  available\n";
                }
            }

            if (this.prefs.getBoolPref("vuuModifySidebarAlertArmyReturns")) {
                gVUUReporter.vuuAlert(window, "Generals Have Returned", alertText);
            }

            // alert box may not have been 'Ok'ed immediately; check again
            this.updateServerArmyReturnTimes(aServer);
        }
    },

    /***************************************************/
    /***************************************************/
    /************* Spell duration section **************/
    /***************************************************/
    /***************************************************/

    /*
     * Updates all servers spell durations a single time and sets a timeout
     * to call this method again. This function runs until Firefox closes.
     * (ie. there is currently no way to stop it, although one could be added)
     * Performs update whether sidebar is open or not.
     */
    updateSpellDurationsWithTimeout: function()
    {
        this.updateSpellDurationsSingle();

        setTimeout("gVUU.updateSpellDurationsWithTimeout()", this.UPDATE_MS_SPELL_DURATIONS);
    },

    /*
     * Performs a single update of all servers spell durations.
     */
    updateSpellDurationsSingle: function()
    {
        var      server = null;

        // actual updating of spell duration sections
        for (var i = 0; i < this.servers.numServers; i++) {
            server = this.servers.getServerByIndex(i);

            if (server.cache.numSpells != 0) {
                this.updateServerSpellDurations(server);
            }
        }
    },

    /*
     * Updates a single server's spell durations.
     * param:  aServer - nsIVUUServer - Server whose durations are to be updated
     */
    updateServerSpellDurations: function(aServer)
    {
        var      updateRequired = false;
        var      cache = aServer.cache;
        var      spell = null;
        var      currentTime = gVUUDateTime.getCurrentGMTDateNTime();
        var      expired = false;
        var      alertText = null;
        var      newArray = null;
        var      oldArray = null;
        var      i = 0;
        var      debug = this.prefs.getBoolPref("vuuGeneralLocalDebug");

        MpDebug(debug, "current Time wrt GMT:" +currentTime);

        // Genesis updates on the half hour
        if (aServer.hrefID != "gen") {
            if (currentTime.getHours() != cache.spellLastHourUpdate) {
                updateRequired = true;
                cache.spellLastHourUpdate = currentTime.getHours();
            }
        } else {
            // genesisSpellDurationsFirstUpdate alone isn't enough since we don't need to do this
            // special update if spell durations are already loaded

            if (this.genesisSpellDurationsFirstUpdate && !this.servers.initialized) {
                this.genesisSpellDurationsFirstUpdate = false;
                updateRequired = true;
                if (currentTime.getMinutes() >= 30)
                    cache.spellLastHourUpdate = currentTime.getHours();
                else
                    cache.spellLastHourUpdate = currentTime.getHours() - 1;
            } else if (currentTime.getHours() != cache.spellLastHourUpdate && currentTime.getMinutes() >= 30) {
                cache.spellLastHourUpdate = currentTime.getHours();
                updateRequired = true;
            }
        }

        // if spell durations haven't yet been updated this hour
        if (updateRequired) {
            for (i = 0; i < cache.numSpells; i++) {
                spell = cache.getSpellByIndex(i);

                // only update the spells duration if it is not 'permanent'
                if (spell.duration != 99) spell.duration--;

                // have any of the spells expired?
                if (spell.duration <= 0) expired = true;
            }
        }

        // if a spell has expired then create alert text for user and remove expired
        // spells from cache
        if (expired) {
            var alertText = "Self Spells Have Expired\n\n"
                            + "Current Time:  " + gVUUDateTime.getTimeHHMM(new Date()) + "\n"
                            + "Server:  " + aServer.name + "\n\n";

            for (i = 0; i < cache.numSpells; i++) {
                spell = cache.getSpellByIndex(i);

                if (spell.duration > 0) {
                    alertText += spell.duration + " : " + spell.name + "\n";
                } else {
                    alertText += "expired : " + spell.name + "\n";
                    cache.removeSpellByIndex(i);
                    i--;
                }
            }
        }

        // update sidebar
        if (!document.getElementById("sidebar-box").hidden) {
            if ((tmpNode = document.getElementById("sidebar"))) {
                if (tmpNode.contentWindow.gVUUSidebar)
                    tmpNode.contentWindow.gVUUSidebar.updateSpellDurations();
            }
        }

        // if a spell has expired then alert the user through a dialog
        if (expired) {
            if (this.prefs.getBoolPref("vuuModifySidebarAlertSpellExpirations")) {
                gVUUReporter.vuuAlert(window, "Self Spells Have Expired", alertText);
            }

            // alert box may not have been 'Ok'ed immediately; check again
            this.updateServerSpellDurations(aServer);
        }
    },


    //***************************************************
    //***************************************************
    // ** Saving and loading of persistent VUU data to file

    /*
     * Auto save all servers data after every this.SAVE_ALL_SERVER_DATA_DURATIONS
     */
    saveAllServerDataToFileWithTimeout: function( firstTimeFlag)
    {
        if (firstTimeFlag == 1) {
            this.saveVUUPersistentDataToFile();
        }

        setTimeout("gVUU.saveAllServerDataToFileWithTimeout(1)", this.SAVE_ALL_SERVER_DATA_DURATIONS);
    },

    /**
    * Example file:
    *
    * start
    * ArmyAwayTimes
    * wol:
    * wol:112151563643
    * wol:112151563643
    * wol:112151563643
    * wol:112151563643
    * wol:112151563643
    * b:
    * gen:
    * SpellDurations
    * current_time:112148352168
    * wol:y
    * wol:War Spoils:6
    * wol:Inspire Army:3
    * wol:Fertile Lands:7
    * wol:Protection:6
    * wol:Town Watch:5
    * wol:Love & Peace:1
    * wol:Animate Dead:9
    * b:n
    * gen:n
    * FreeIncome
    * wol:y
    * wol:month:April:year:3
    * b:n
    * gen:
    * MonarchMessages
    * wol:start:
    * Keep Army out
    * :end:
    * b:start:
    * Explore
    * :end:
    * gen:start:
    * write in forums
    * :end:
    * end
    *
    */


    /*
     * Saves all non-preference persistent VUU data to a file in the extensions
     * directory specified by 'PATH_PERSISTENT_DATA'.
     * currently saves:
     * - army return times
     * - spell durations
     */
    saveVUUPersistentDataToFile: function()
    {
        // get a reference to the file
        var      file = FileIO.open(this.PATH_PERSISTENT_DATA);

        // create the file if it doesn't exist
        if (!file.exists()) FileIO.create(file);

        // custom start of file tag
        FileIO.write(file, "start\n");

        // write army return times and spell durations to file
        this.writeArmyReturnTimesToFile(file);
        this.writeSpellDurationsToFile(file);
        this.writeFreeIncomeInfoToFile(file);
        this.writeLastMonarchMessage(file);

        // custom end of file tag
        FileIO.write(file, "end\n", "a");
    },

    /*
     * Writes (appends) army return time information to 'aFile'
     * param:  aFile - nsIFile (I think!) - file to write information to
     */
    writeArmyReturnTimesToFile: function(aFile)
    {
        var      i = null;
        var      j = null;
        var      server = null;
        var      army = null;

        // make sure they are updated
        this.updateArmyReturnTimesSingle();

        // army away times
        FileIO.write(aFile, "ArmyAwayTimes\n", "a");

        for (i = 0; i < this.servers.numServers; i++) {
            server = this.servers.getServerByIndex(i);

            // no army away times for this server
            if (server.cache.numArmies == 0) {
                FileIO.write(aFile, server.hrefID + ":n\n", "a");
            } else {
                // there are army away times for this server
                FileIO.write(aFile, server.hrefID + ":y\n", "a");
            
                for (j = 0; j < server.cache.numArmies; j++) {
                    army = server.cache.getArmyByIndex(j);

                    // no time - the army is available
                    if (!army.returnTime) {
                        FileIO.write(aFile, server.hrefID + ":n\n", "a");
                    } else {
                        // time - the army is still out
                        FileIO.write(aFile, server.hrefID + ":" + army.returnTime + "\n", "a");
                    }
                }
            }
        }
    },

    /*
     * Writes (appends) spell duration information to 'aFile'
     * param:  aFile - nsIFile (I think!) - file to write information to
     */
    writeSpellDurationsToFile: function(aFile)
    {
        var      i = null;
        var      j = null;
        var      server = null;
        var      spell = null;
        var      currentTime = gVUUDateTime.getCurrentGMTDateNTime();

        // make sure they are updated
        this.updateSpellDurationsSingle();

        // self spell durations
        FileIO.write(aFile, "SpellDurations\n", "a");
        FileIO.write(aFile, "current_time:" + currentTime.getTime() + "\n", "a");

        for (i = 0; i < this.servers.numServers; i++) {
            server = this.servers.getServerByIndex(i);

            // no spells for this server
            if (server.cache.numSpells == 0) {
                FileIO.write(aFile, server.hrefID + ":n\n", "a");
            } else {
                // there are spells for this server
                FileIO.write(aFile, server.hrefID + ":y\n", "a");

                for (j = 0; j < server.cache.numSpells; j++) {
                    spell = server.cache.getSpellByIndex(j);
                    FileIO.write(aFile, server.hrefID + ":" + spell.name + ":" + spell.duration + "\n", "a");
                }
            }
        }
    },

    /*
     * Writes (appends) free income information to 'aFile'
     * param:  aFile - nsIFile (I think!) - file to write information to
     */
    writeFreeIncomeInfoToFile: function(aFile)
    {
        var      i = null;
        var      j = null;
        var      server = null;
        var      currentTime = new Date();

        // free income information
        FileIO.write(aFile, "FreeIncome\n", "a");

        for (i = 0; i < this.servers.numServers; i++) {
            server = this.servers.getServerByIndex(i);

            // no free income information for this server
            if (!server.cache.freeIncomeMonth) {
                FileIO.write(aFile, server.hrefID + ":n\n", "a");
            } else {
                // there is free income information for this server
                FileIO.write(aFile, server.hrefID + ":y\n", "a");
                FileIO.write(aFile, server.hrefID + ":month:"
                                + server.cache.freeIncomeMonth
                                + ":year:" + server.cache.freeIncomeYear + "\n", "a");
            }
        }
    },

    /*
     * Writes (appends) last monarch message to 'aFile'
     * param:  aFile - nsIFile (I think!) - file to write information to
     */
    writeLastMonarchMessage: function(aFile)
    {
        var     i = null;
        var     server = null;

        // monarch message information
        FileIO.write(aFile, "MonarchMessages\n", "a");

        for (i = 0; i < this.servers.numServers; i++) {
            server = this.servers.getServerByIndex(i);

            if (server.cache.monarchMessage) {
                var  dumpStr = server.hrefID + ":start:" + server.cache.monarchMessage + ":end:\n";
                FileIO.write(aFile, dumpStr, "a");
            } else if (server.cache.lastMonarchMessage) {
                var  dumpStr = server.hrefID + ":start:" + server.cache.lastMonarchMessage + ":end:\n";
                FileIO.write(aFile, dumpStr, "a");
            } else {
                var  dumpStr = server.hrefID + ":start:\n:end:\n";
                FileIO.write(aFile, dumpStr, "a");
            }
        }

        return;
    },

    /*
     * Loads all non-preference persistent VUU data from a file in the extensions
     * directory specified by 'PATH_PERSISTENT_DATA'.
     * currently loads:
     * - army return times
     * - spell durations
     */
    loadVUUPersistentDataFromFile: function()
    {
        var      i;
        var      data;
        var      dataArray;
        var      file = FileIO.open(this.PATH_PERSISTENT_DATA);

        // only load the file if it exists
        if (file.exists()) {
            // load data into an array containing each line
            data = FileIO.read(file);
            dataArray = data.split(/^/m); // flag 'm' specifies '^' matches each line

            // just a simple check to make sure it's at least somewhat valid
            if (dataArray[0].trim() == "start" && dataArray[dataArray.length - 1].trim() =="end") {
                for (i = 0; i < dataArray.length; i++) {

                    if (dataArray[i].trim() == "ArmyAwayTimes") {
                        this.readArmyReturnTimesFromFile(dataArray, i);
                    } else if (dataArray[i].trim() == "SpellDurations") {
                        this.readSpellDurationsFromFile(dataArray, i);
                    } else if (dataArray[i].trim() == "FreeIncome") {
                        this.readFreeIncomeInfoFromFile(dataArray, i);
                    } else if (dataArray[i].trim() == "MonarchMessages") {
                        this.readMonarchMessageFromFile(dataArray, i);
                    }
                }
            }
        }

        // have to update here so spellLastHourUpdate is set correctly for Genesis
        // since it is on the half hour not the hour change
        this.updateServerSpellDurations(this.servers.getServerByHrefID("gen"));
    },

    /*
     * Loads army return time data from an array containing each line of
     * PATH_PERSISTENT_DATA.
     * param:  aData - Array - containing each line of data from PATH_PERSISTENT_DATA
     * param:  aStart - integer - starting index of army return time data in array 'aData'
     */
    readArmyReturnTimesFromFile: function(aData, aStart)
    {
        var      i = aStart + 1;
        var      curServerLine = null;
        var      curLine = null;
        var      cache = null;
        var      requiresInit = null;

        while (true) {
            if (aData[i].charAt(0) == "u" || aData[i].charAt(0) == "b") {
                curServerLine = aData[i].split(":");
                i++;
                curLine = aData[i].split(":");

                // 'y' if there is data for this server, 'n' if not
                if (curServerLine[1].charAt(0) == "y") {
                    // get the server's cache
                    cache = this.servers.getServerByHrefID(curServerLine[0]).cache;

                    // does the away times array need to be initialised?
                    requiresInit = (cache.numArmies == 0) ? true : null;
                    // only load if not yet initialised
                    if (requiresInit) {
                        while (curServerLine[0] == curLine[0]) {
                            if (curLine[1].charAt(0) == "n") {
                                cache.addNewArmy(null, true);
                            } else {
                                cache.addNewArmy(parseInt(curLine[1].trim()), false);
                            }
                            // increment our counter
                            i++;
                            curLine = aData[i].split(":");
                        }
                   }
                }
            } else {
                break;
            }
        }
    },

    /*
     * Loads spell duration data from an array containing each line of
     * PATH_PERSISTENT_DATA.
     * param:  aData - Array - containing each line of data from PATH_PERSISTENT_DATA
     * param:  aStart - integer - starting index of spell duration data in array 'aData'
     */
    readSpellDurationsFromFile: function(aData, aStart)
    {
        var i = aStart + 1;
        var curServerLine = null;
        var curLine = null;
        var server = null;
        var cache = null;
        var saveTimeMS = null;
        var requiresInit = null;
        var name = null;
        var tempDuration = null;
        var tempTimeExpiresMS = null;
        var currentTimeMS = null;

        curLine = aData[i].split(":");
        saveTimeMS = parseInt(curLine[1].trim());
        i++;

        while (true)
        {
            if (aData[i].charAt(0) == "u" || aData[i].charAt(0) == "b") {
                curServerLine = aData[i].split(":");
                i++;
                curLine = aData[i].split(":");

                // 'y' if there is data for this server, 'n' if not
                if (curServerLine[1].charAt(0) == "y") {
                    // get the server's cache
                    server = this.servers.getServerByHrefID(curServerLine[0]);
                    cache = server.cache;

                    // Do the spell durations need to be initialised?
                    requiresInit = (cache.numSpells == 0) ? true : null;

                    // only load if not yet initialised
                    if (requiresInit) {
                        cache.spellLastHourUpdate = gVUUDateTime.getCurrentGMTDateNTime().getHours() - 1;

                        while (curServerLine[0] == curLine[0]) {
                            // load the spell
                            name = curLine[1].trim();
                            tempDuration = parseInt(curLine[2].trim());

                            // 99 hours duration is used for 'permanent' spells
                            if (tempDuration != 99) {
                                if (server.hrefID != "gen") {
                                    currentTimeMS = gVUUDateTime.getCurrentGMTDateNTime();
                                    currentTimeMS.setMinutes(59);
                                    currentTimeMS.setSeconds(59);
                                    currentTimeMS.setMilliseconds(999);
                                } else {
                                    currentTimeMS = gVUUDateTime.getCurrentGMTDateNTime();
                                    if (currentTimeMS.getMinutes() > 30)
                                        currentTimeMS = new Date(currentTimeMS.getTime() + 3600000);
                                    currentTimeMS.setMinutes(29);
                                    currentTimeMS.setSeconds(59);
                                    currentTimeMS.setMilliseconds(999);
                                }

                                // 3600000 = 60minutes * 60seconds * 1000milliseconds
                                // = 1 hour (utopian day)
                                tempTimeExpiresMS = saveTimeMS + (tempDuration * 3600000);
                                // +1 because update immediately
                                tempDuration = Math.ceil((tempTimeExpiresMS - currentTimeMS) / 3600000) + 1;
                                // let them know that it has expired for another hour
                                if (tempDuration <= 0) tempDuration = 1;
                            }

                            cache.addNewSpell(name, tempDuration);

                            // increment our counter
                            i++;
                            curLine = aData[i].split(":");
                        }
                    }
                }
            }
            else
            {
                break;
            }
        }
    },

    /**
    * Loads free income data from an array containing each line of
    * PATH_PERSISTENT_DATA.
    * param:  aData - Array - containing each line of data from PATH_PERSISTENT_DATA
    * param:  aStart - integer - starting index of free income info data in array 'aData'
    */
    readFreeIncomeInfoFromFile: function(aData, aStart)
    {
        var i = aStart + 1;
        var curServerLine = null;
        var curLine = null;
        var cache = null;
        var requiresInit = null;

        while (true)
        {
        if (aData[i].charAt(0) == "u" || aData[i].charAt(0) == "b")
        {
            curServerLine = aData[i].split(":");
            i++;
            curLine = aData[i].split(":");

            // 'y' if there is data for this server, 'n' if not
            if (curServerLine[1].charAt(0) == "y")
            {
            // get the server's cache
            cache = this.servers.getServerByHrefID(curServerLine[0]).cache;
            // does free income information need to be initialised?
            requiresInit = (cache.freeIncomeMonth == null) ? true : null;
            // only load if not yet initialised
            if (requiresInit)
            {
                cache.freeIncomeMonth = curLine[2].trim();
                cache.freeIncomeYear = curLine[4].trim();
            }
            i++;
            }
        }
        else
        {
            break;
        }
        }
    },

    /**
    * Loads monarch's Message from an array containing each line of PATH_PERSISTENT_DATA.
    * param:  aData - Array - containing each line of data from PATH_PERSISTENT_DATA
    * param:  aStart - integer - starting index of monarch Message 
    */
    readMonarchMessageFromFile: function(aData, aStart)
    {
        var i = aStart + 1;
        var curServerLine = null;
        var curLine = null;
        var cache = null;
        var requiresInit = null;

        if (aData[i].trim() == "wol:start:") {
            var srv1Msg = "";
            ++i;
            while (true) {
                if (aData[i].trim() == ":end:") break;
                srv1Msg = srv1Msg + aData[i].trim();
                ++i;
            }

            if (srv1Msg != "") {
                var server = this.servers.getServerByIndex(0);
                server.cache.lastMonarchMessage = "\n" + srv1Msg + "\n";
            }
        }
        ++i;

        if (aData[i].trim() == "b:start:") {
            var srv2Msg = "";
            ++i;
            while (true) {
                if (aData[i].trim() == ":end:") break;
                srv2Msg = srv2Msg + aData[i].trim();
                ++i;
            }

            if (srv2Msg != "") {
                var server = this.servers.getServerByIndex(1);
                server.cache.lastMonarchMessage = "\n" + srv2Msg + "\n";
            }
        }
        ++i;

        if (aData[i].trim() == "gen:start:") {
            var srv3Msg = "";
            ++i;
            while (true) {
                if (aData[i].trim() == ":end:") break;
                srv3Msg = srv3Msg + aData[i].trim();
                ++i;
            }

            if (srv3Msg != "") {
                var server = this.servers.getServerByIndex(2);
                server.cache.lastMonarchMessage = "\n" + srv3Msg + "\n";
            }
        }
    }
};  // end gVUU declaration

/*
 * Function to disable one of the 2 menu's in Status Bar
 * i.e.    Either Enable Metatron or Disable Metatron should be there.
 */

function enableDisableButtonOnXUL()
{
    gVUU.setupPreferences();

    var    isEnabled = gVUU.prefs.getBoolPref("vuuGeneralEnabled");

    document.getElementById('vuu-enab-menu').collapsed = isEnabled;
    document.getElementById('vuu-disb-menu').collapsed = !isEnabled;
}

/** Add relevent load & unload listeners to window */
window.addEventListener("load", function(aEvent) { gVUU.onLoad(aEvent); }, false);
window.addEventListener("unload", function(aEvent) { gVUU.onUnload(aEvent); }, false);

