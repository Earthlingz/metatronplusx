/**
 * Written by Anthony Gabel on 16 November 2004.
 *
 * Contains vuuPMKingdom and vuuKingdomSortingHelper objects.
 * Also contains several separate province comparison functions.
 *
 * Performs required modifications to the 'The Kingdom' page:
 *  - Adds previous / random / next kingdom buttons
 *  - Add relations change confirmation dialog
 *  - Add kingdom summary to top of kingdom table
 *  - Add NWPA column to kingdom table
 *  - Add at war indication to kingdom table
 *  - Add province sorting to kingdom table
 *  - Add intel information to kingdom table
 *
 * Requires:
 *  vuuOverlay.js
 *  vuuRules.js
 *  socket.js
 *  dom_manipulation.js
 *  formatter.js
 */

function vuuGetFunctionName(theFunction)
{
    if (theFunction.name)
        return theFunction.name;

    // try to parse the function name from the defintion
    var definition = theFunction.toString();
    var name = definition.substring(definition.indexOf('function') + 8,definition.indexOf('('));
    if (name) return name;

    // sometimes there won't be a function name
    // like for dynamic functions
    return "anonymous";
}

function vuuGetSignature(theFunction)
{
    var signature = vuuGetFunctionName(theFunction);

    signature += "(";

    for (var x=0; x < theFunction.arguments.length; x++) {

        // trim long arguments
        var nextArgument = theFunction.arguments[x];

        if (nextArgument.length > 30)
            nextArgument = nextArgument.substring(0, 30) + "...";

        signature += "'" + nextArgument + "'";

        if (x < theFunction.arguments.length - 1)
            signature += ", ";
    }

    signature += ")";

    return signature;
}

function vuuStackTrace(startingPoint)
{
    var stackTraceMessage = "--> STACK-TRACE <-- \n";
    var nextCaller = startingPoint;

    stackTraceMessage += "=======================================================================\n";
    while (nextCaller) {
        stackTraceMessage += "    " + vuuGetSignature(nextCaller) + "\n";
        nextCaller = nextCaller.caller;
    }
    stackTraceMessage += "=======================================================================\n\n";

    // display message
    //document.getElementById("output").innerHTML = stackTraceMessage + document.getElementById("output").innerHTML;
    dump (stackTraceMessage);

    return;
}


/**
 * Constructor for a 'vuuPMKingdom' object. Used to modify the 'The Kingdom' page.
 * param:  aDoc - HTMLDocument - 'The Kingdom' page to modify
 */
function vuuPMKingdom(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.rules = gVUURules.getRulesByHrefID(this.server.hrefID);
    this.bookmarks = this.server.bookmarkManager;
    this.debug = gVUU.prefs.getBoolPref("vuuKingdomPageDebug");

    this.maxKingdomNum = 0;
    this.maxIslandNum = 0;

    /** kingdom information */
    this.info = new Object();
    this.info.kingdomName = null;
    this.info.kingdomFame = null;
    this.info.kingdomNum = null;
    this.info.islandNum = null;
    this.info.numProvinces = null;
    this.info.land = null;
    this.info.landRank = null;
    this.info.landTotalRank = null;
    this.info.avgLand = null;
    this.info.networth = null;
    this.info.networthRank = null;
    this.info.networthTotalRank = null;
    this.info.avgNetworth = null;
    this.info.avgNWPA = null;
    this.info.dragonCost = null;
    this.info.dragonKill = null;
    this.info.dragonSendLower = null;
    this.info.dragonSendUpper = null;
    this.info.honorMin = 0;
    this.info.honorMax = 0;
    this.info.atWar = false;

    /** race information */
    this.raceNames = this.rules.races.getRaceNames();
    this.raceNamesPlural = this.rules.races.getPluralRaceNames();
    this.raceSummary = null;

    /**
    * Province information
    * this.provinces is the array of provinces in the kingdom
    * The following are added to each object in this.provinces
    * this.provinces[x].id
    * this.provinces[x].fullName
    * this.provinces[x].name
    * this.provinces[x].color
    * this.provinces[x].race
    * this.provinces[x].acres
    * this.provinces[x].networth
    * this.provinces[x].rank
    * this.provinces[x].rankNum
    * this.provinces[x].nwpa
    * this.provinces[x].cb
    */
    this.provinces = null;

    /** intel information */
    this.intelFinished = [false];  // an array so it can be passed by reference
    this.haveIntel = new Array();

    // set default values
    this.raceSummary = new Array(this.raceNames.length);
    for (var i = 0; i < this.raceNames.length; i++) {
        this.raceSummary[i] = 0;
    }
}

/**
 * Performs any required modifications to the 'The Kingdom' page by directly
 * modifying its DOM.
 */
vuuPMKingdom.prototype.modify = function()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    MpDebug(this.debug, "Formatting Kingdom page");

    // set max kingdom and island numbers
    if (this.server.hrefID == "wol") {
        this.maxKingdomNum = gVUU.prefs.getIntPref("vuuModifyKingdomRandomKingdomMax");
        this.maxIslandNum = gVUU.prefs.getIntPref("vuuModifyKingdomRandomIslandMax");
    } else if (this.server.hrefID == "b") {
        this.maxKingdomNum = gVUU.prefs.getIntPref("modKingdomServer2KingdomMax");
        this.maxIslandNum = gVUU.prefs.getIntPref("modKingdomServer2IslandMax");
    } else if (this.server.hrefID == "u3") {
        this.maxKingdomNum = gVUU.prefs.getIntPref("modKingdomGenesisKingdomMax");
        this.maxIslandNum = gVUU.prefs.getIntPref("modKingdomGenesisIslandMax");
    }

    // header data always available & needed
    this.fillKingdomHeaderData();

    // special - this only occurs at the start of the age when you may not yet
    // have access to all islands. In this case only add navigation buttons
    // then return.
    if ((gVUUDOM.getDescendentTextNode(this.body,
              "Your island has not discovered this island yet.", 1, "ERROR@ kingdom_page.js:129"))
            != null) {

        /*
        // Not Needed Now.
        if (gVUU.prefs.getBoolPref("vuuModifyKingdomPrevNext"))
        this.addPreviousNext();
        */
        MpDebug(this.debug, "Unexplored Kingdom page detected aborted Page formatting");
        return;
    }

    this.calcValues();
    this.addHiddenKingdomIsland();
    this.setAtWar();

    /*
    // Not Needed Now.
    if (gVUU.prefs.getBoolPref("vuuModifyKingdomPrevNext"))
        this.addPreviousNext();
    */

    if (gVUU.prefs.getBoolPref("vuuModifyKingdomRelationsConfirmation"))
        this.addRelationsConfirmation();
    if (gVUU.prefs.getBoolPref("vuuModifyKingdomSummary"))
        this.addKingdomSummary();

    /*
     // This stuff is done by swirve now. No need
       if (gVUU.prefs.getBoolPref("vuuModifyKingdomNWPAColumn"))
       this.addNWPAColumn();
     */

    if (gVUU.prefs.getBoolPref("vuuModifyKingdomWarIndication"))
        this.addAtWarIndication();

    // determines whether the user sees sorting interface or whether it is just
    // behind the scenes
    if (gVUU.prefs.getBoolPref("vuuModifyKingdomSorting"))
        this.addKingdomSorting(true);
    else
        this.addKingdomSorting(false);

    if (gVUU.prefs.getBoolPref("allBookmarkingEnabled"))
        this.addBookmarkSections();

    if (gVUU.prefs.getBoolPref("vuuFormattingEnabled")
        && gVUU.prefs.getBoolPref("vuuModifyKingdomIntelIndication")
        && gVUUSocketData.isAlive
        && gVUUSocketData.supportsCommand(vuuSocketCommand.HAVE_CB)
        && gVUUSocketData.supportsCommand(vuuSocketCommand.GET_CB))
    {
        this.addIntelIndication();
        /* NOT YET READY - WORK IN PROGRESS */
        // add event listener for custom event. Allows communication between
        // the webpage and this extension
        //this.doc.addEventListener("IntelRequestEvent",
        //  this.intelClickListener, false);
    }

    MpDebug(this.debug, "Formatting Kingdom page completed");
}

/**
 * Fills in the fields of this.info that relate to the header data of the kingdom.
 * These are:
 * kingdom name, number of provinces, kingdom and island number
 * and total kingdom networth
 */
vuuPMKingdom.prototype.fillKingdomHeaderData = function()
{
    var            node = gVUUDOM.getDescendentTextNode(this.body, " Kingdom of ", 1, "ERROR@ kingdom_page.js:195");
    var            headerNode = null;

    if (node) {
        // Header is 4th parent of Node.
        headerNode = node.parentNode;
        headerNode = headerNode.parentNode;
        headerNode = headerNode.parentNode;
        headerNode = headerNode.parentNode;
    }

    var            regex = /The\s*([a-zA-Z0-9\s\-]*)\s*Kingdom\s*of\s*([a-zA-Z0-9\s\-]*)\s*\(#*(\d+):(\d+)\)\s*Total\s*Provinces:\s*(\d+)\s*Total\s*Networth:\s*([0-9,]*\d+)\s*gc\s*\(\s*avg:\s*([0-9,]*\d+)\s*gc\s*\)\s*Total\s*Land:\s*([0-9,]*\d+)\s*acres\s*\(\s*avg:\s*([0-9,]*\d+)\s*acres\s*\)\s*(.*)\s*(.*)\s*/g;

    /*
     * Sample Header Text.
     *         The   Special-name_here  Kingdom  of  arb-it  string 123 number in it   (12:32)
     *         Total  Provinces:  25
     *         Total   Networth:   123,1234,234423,4324,234,234,234   gc  (  avg:  12321,123,123  gc  )
     *         Total     Land:  123,234,54,123,23 acres   (  avg:  123,3431,3434   acres   )
     *         Networth Rank: 262 of 1000
     *         Land Rank: 160 of 1000
     * Header End Here.
     */

    var            headerStr = gVUUDOM.getAllText(window, headerNode, "ERROR@ kingdom_page.js:219");
    var            regexResult = null;
    var            count = 0;

    while (regexResult == null && count <= 100) {
        regexResult = regex.exec(headerStr);
        count++;
    }

    if (regexResult) {
        this.info.numProvinces = parseInt(regexResult[5]);
        this.info.kingdomFame = regexResult[1].trim();
        this.info.kingdomName = regexResult[2].trim();
        this.info.kingdomNum = parseInt(regexResult[3]);
        this.info.islandNum = parseInt(regexResult[4]);
        this.info.networth = parseInt(gVUUFormatter.removeCommas(regexResult[6]));
        this.info.land = parseInt(regexResult[8]);

        if (regexResult[10] != null && regexResult[10] != "") {
            // found Nw Rank
            var  regexNw = /Networth\s*Rank\s*:\s*(\d+)\s*of\s*(\d+)\s*/g;
            var  regexNwRes = regexNw.exec(regexResult[10]);

            if (regexNwRes == null) {
                regexNwRes = regexNw.exec(regexResult[10]);
            }

            if (regexNwRes && regexNwRes[1] && regexNwRes[2]) {
                this.info.networthRank = regexNwRes[1];
                this.info.networthTotalRank = regexNwRes[2];
            }
        }

        if (regexResult[11] != null && regexResult[11] != "") {
            // found Land Rank;
            var  regexLnd = /Land\s*Rank\s*:\s*(\d+)\s*of\s*(\d+)\s*/g;
            var  regexLndRes = regexLnd.exec(regexResult[11]);

            if (regexLndRes == null) {
                regexLndRes = regexLnd.exec(regexResult[11]);
            }

            if (regexLndRes && regexLndRes[1] && regexLndRes[2]) {
                this.info.landRank = regexLndRes[1];
                this.info.landTotalRank = regexLndRes[2];
            }
        }

        var size =  regexResult.length;
        var i = 0;
        while (i < size - 1) {
            ++i;
            //dump( i + " : " + regexResult[i] + "\n");
            // to enable dump function set browser.dom.window.dump.enabled to true in 'about:config'
        }

        MpDebug(this.debug, headerStr);
    } else {
        gVUUReporter.vuuPrintToJSConsole("Could Not Load Kingdom Header " + "ERROR@ kingdom_page.js:277");
        gVUUReporter.vuuPrintToJSConsole("Kingdom Header Predicted :'" + headerStr  + "'");
        this.info.numProvinces = regexResult[4];
        this.info.kingdomFame = null;
        this.info.kingdomName = null;
        this.info.kingdomNum = null;
        this.info.islandNum = null;
        this.info.networth = null;
        this.info.land = null;
    }
}

/**
 * Fills in the fields of this.provinces from the kingdom pages data.
 * param:  aNode - HTMLElement - tableKingomData node
 */
vuuPMKingdom.prototype.fillKingdomData = function(aNode)
{
    var            nodeTBody = gVUUDOM.getDescendentElement(aNode, "tbody", 1, "ERROR@ kingdom_page.js:295");
    var            nodeTR = gVUUDOM.getChildElement(nodeTBody, "tr", 2, "ERROR@ kingdom_page.js:296");
    var            nodeTD = null;
    var            i = null;
    var            tmpArray = new Array(this.info.numProvinces);
    var            tmpArray2 = new Array(this.info.numProvinces);

    MpDebug(this.debug, "Reading province Information Now");
    // province names
    nodeTD = gVUUDOM.getChildElement(nodeTR, "td", 1, "ERROR@ kingdom_page.js:304");

    this.getKingdomTableChildText(nodeTD, tmpArray, tmpArray2);

    MpDebug(this.debug, "Provinces read are:'" +  tmpArray + "'");

    for (i = 0; i < this.info.numProvinces; i++) {
        this.provinces[i] = new Object();
        this.provinces[i].id = i + 1;
        this.provinces[i].cb = null;
        this.provinces[i].fullName = tmpArray[i];

        // unclaimed and awaiting activation don't have a location
        if (tmpArray[i].indexOf(" (") != -1) {
            this.provinces[i].name =
            tmpArray[i].substring(0, tmpArray[i].indexOf(" (")).trim();
        } else {
            this.provinces[i].name = this.provinces[i].fullName;
        }

        this.provinces[i].color = tmpArray2[i];
    }

    // races
    tmpArray = new Array(this.info.numProvinces);
    nodeTD = gVUUDOM.getChildElement(nodeTR, "td", 2, "ERROR@ kingdom_page.js:329");
    this.getKingdomTableChildText(nodeTD, tmpArray);

    for (i = 0; i < this.info.numProvinces; i++) {
        this.provinces[i].race = tmpArray[i];
    }

    // acres
    tmpArray = new Array(this.info.numProvinces);
    nodeTD = gVUUDOM.getChildElement(nodeTR, "td", 3, "ERROR@ kingdom_page.js:338");
    this.getKingdomTableChildText(nodeTD, tmpArray);

    for (i = 0; i < this.info.numProvinces; i++) {
        this.provinces[i].acres = gVUUFormatter.removeCommas(tmpArray[i]).trim();
    }

    // networth
    tmpArray = new Array(this.info.numProvinces);
    nodeTD = gVUUDOM.getChildElement(nodeTR, "td", 4, "ERROR@ kingdom_page.js:347");
    this.getKingdomTableChildText(nodeTD, tmpArray);

    // only remove commas from numbers
    for (i = 0; i < this.info.numProvinces; i++) {
        if (tmpArray[i].indexOf("Small") == -1 && tmpArray[i].indexOf("-") == -1
            && tmpArray[i].indexOf("DEAD") == -1) {

            this.provinces[i].networth = gVUUFormatter.removeCommas(
                    tmpArray[i].substring(0, tmpArray[i].indexOf("gc")));
        } else {
            this.provinces[i].networth = tmpArray[i];
        }
    }

    // calculate nwpa
    for (i = 0; i < this.info.numProvinces; i++) {

        if (this.provinces[i].networth.indexOf("Small") == -1
            && this.provinces[i].networth.indexOf("-") == -1
            && this.provinces[i].networth.indexOf("DEAD") == -1
            && this.provinces[i].acres != "0") {

            this.provinces[i].nwpa =
                    Math.round(this.provinces[i].networth / this.provinces[i].acres);
        } else {
            if (this.provinces[i].networth.indexOf("Small") != -1) {
                this.provinces[i].nwpa = "unknown";
            } else {
                // set nwpa = non-numeric networth (could be '-' or 'Small' etc.)
                this.provinces[i].nwpa = this.provinces[i].networth;
            }
        }
    }

    // rank
    tmpArray = new Array(this.info.numProvinces);
    nodeTD = gVUUDOM.getChildElement(nodeTR, "td", 6, "ERROR@ kingdom_page.js:384");
    this.getKingdomTableChildText(nodeTD, tmpArray);

    for (i = 0; i < this.info.numProvinces; i++) {
        this.provinces[i].rank = tmpArray[i];
        this.provinces[i].rankNum = this.rules.honor.rankToInt(tmpArray[i]);
    }

    // add province information to the document scope for later use in sorting and
    // in adding intel indication
    this.doc.vuuProvinces = this.provinces;
    this.doc.vuuNumProvinces = this.info.numProvinces;
    if (this.doc.wrappedJSObject) {
        this.doc.wrappedJSObject.vuuProvinces = this.provinces;
        this.doc.wrappedJSObject.vuuNumProvinces = this.info.numProvinces;
    }
}

/**
 * Fills the given array with the text of each row from a column of the kingdom table.
 * An additional array may also be given which will have each element set as
 * the colour of the row.
 *
 * param:  aNode - HTMLElement - kingdom table column to retrieve
 *         text (and optionally colour) from
 * param:  aTextArray - Array - an array with length set to the number of
 *         provinces in the kingdom.
 *         This array will be filled with the text from the column.
 * param:  aColorArray (Optional) - Array - an array with length set to the
 *         number of provinces in the kingdom. This array will be filled with
 *         the colour of the text from the given column (or white if there is no colour)
 */
vuuPMKingdom.prototype.getKingdomTableChildText =
    function(aNode, aTextArray, aColorArray)
{
    // Edited.
    var            arrayCount = 0;
    var            tmpNode = null;

    for (var m = aNode.firstChild; m != null; m = m.nextSibling) {
        if (m.nodeType == 3) {
            // Node.TEXT
            if (m.nodeValue != "\n") {
                arrayCount++;
                aTextArray[arrayCount - 1] = m.nodeValue.trim();
                if (aColorArray) aColorArray[arrayCount - 1] = gVUUColors.WHITE;
            }
            // some names may be in different font (monarch, protection, you)
            // so check for the 'other' tags
        } else if (m.nodeType == 1) {
            // Node.ELEMENT
            if (m.tagName.toLowerCase() == "br") {
                // ignore this TAG.
            } else if(m.tagName.toLowerCase() == "font") {
                if (m.firstChild.nodeValue != "\n") {
                    arrayCount++;
                    aTextArray[arrayCount - 1] = m.firstChild.nodeValue.trim();
                    if (aColorArray) aColorArray[arrayCount - 1] = m.getAttribute("color");
                }
            } else if(m.tagName.toLowerCase() == "b") {
                if (m.firstChild.nodeValue != "\n") {
                    var    fChild = m.firstChild;
                    if (fChild.nodeType == 3) {
                        arrayCount++;
                        aTextArray[arrayCount - 1] = fChild.nodeValue.trim();
                        if (aColorArray) aColorArray[arrayCount - 1] = gVUUColors.GOLD;
                    } else if (fChild.nodeType == 1 &&
                               fChild.tagName.toLowerCase() == "font" &&
                               fChild.firstChild.nodeValue != "\n") {
                        arrayCount++;
                        aTextArray[arrayCount - 1] = fChild.firstChild.nodeValue.trim();
                        if (aColorArray) aColorArray[arrayCount - 1] = gVUUColors.GOLD;
                    }
                }
            } else {
                gVUUReporter.vuuPrintToJSConsole("Unrecognised type of Tag in Kingdom Name " + "ERROR@ kingdom_page.js:455");
            }

        }
    }
}

/**
 * Calculates values required for modifying kingdom page. Calculates (this.info.):
 * land, avgLand, avgNWPA, avgNetworth, dragonCost, dragonKill, dragonSendLower,
 * dragonSendUpper, honorMin, honorMax
 * Also populates this.raceSummary and this.provinces arrays
 * For correct results this.fillKingdomHeaderData() must be called prior
 * to calling this function
 */
vuuPMKingdom.prototype.calcValues = function()
{
    // Edited somewhat.
    var            tmpNode = null;
    var            i = null;
    var            j = null;

    // get all needed data out of the kingdom table
    // getting the actual table node
    this.provinces = new Array(this.info.numProvinces);

    tmpNode = gVUUDOM.getDescendentTextNode(this.body, "Rank", 3, "ERROR@ kingdom_page.js:481")

    if (!tmpNode) {
        tmpNode = gVUUDOM.getDescendentTextNode(this.body, "Rank", 1, "ERROR@ kingdom_page.js:484");
    }

    if (tmpNode) {
        var        headerNode = tmpNode.parentNode;

        headerNode = headerNode.parentNode;
        headerNode = headerNode.parentNode;
        headerNode = headerNode.parentNode;
        tmpNode = headerNode;
    } else {
        gVUUReporter.vuuPrintToJSConsole("Rank Tag not found in the html page " + "ERROR@ kingdom_page.js:495");
    }

    // tmpNode should point to table containning the all Kingdom information.
    tmpNode.setAttribute("id", "tableKingdomData");
    this.fillKingdomData(tmpNode);
    this.info.land = 0;

    for (i = 0; i < this.info.numProvinces; i++) {

        if (this.provinces[i].acres.indexOf("-") == -1 && this.provinces[i].acres.indexOf("DEAD") == -1) {
            this.info.land += parseInt(this.provinces[i].acres);
        }
    }

    // we've already accounted for this.info.numProvinces being 0 (special case)
    this.info.avgLand = Math.round(this.info.land / this.info.numProvinces);

    if (this.info.land > 0) {
        this.info.avgNWPA = Math.round(this.info.networth / this.info.land);
    } else {
        this.info.avgNWPA = 0;
    }

    // we've already accounted for this.info.numProvinces being 0 (special case)
    MpDebug(this.debug, "Calculating Information for Kingdom");
    this.info.avgNetworth = Math.round(this.info.networth / this.info.numProvinces);
    this.info.dragonCost = this.rules.dragons.getCost(this.info);
    this.info.dragonKill = this.rules.dragons.getSoldiersToKillOnePercent(this.info);
    this.info.dragonSendLower = this.rules.dragons.getSendRangeLower(this.info);
    this.info.dragonSendUpper = this.rules.dragons.getSendRangeUpper(this.info);

    var            monarch = 0;

    for (i = 0; i < this.info.numProvinces; i++) {
        this.info.honorMin += this.rules.honor.getMinHonor(this.provinces[i].rank);
        this.info.honorMax += this.rules.honor.getMaxHonor(this.provinces[i].rank);
        if (this.rules.honor.isMonarch(this.provinces[i].rank)) monarch++;
    }

    // monarchs are alocated honor according to the average of all provinces
    // note that there can be more than one province listed as monarch at one time
    if (monarch > 0) {
        this.info.honorMin +=
            Math.floor(this.info.honorMin / (this.info.numProvinces - monarch)) * monarch;
        this.info.honorMax +=
            Math.floor(this.info.honorMax / (this.info.numProvinces - monarch)) * monarch;
    }

    // summarise races
    for (i = 0; i < this.info.numProvinces; i++) {

        for (j = 0; j < this.raceNames.length; j++) {

            if (this.provinces[i].race.indexOf(this.raceNames[j]) != -1) {
                this.raceSummary[j]++;
                break;
            }
        }
    }
}

/**
 * Add hidden input fields with this kingdom's kingdom number and island number
 * because the 'select kingdom' textboxes may not contain the correct info
 */
vuuPMKingdom.prototype.addHiddenKingdomIsland = function()
{
    //edited.
    var            nodeTemp1 = null;
    var            nodeTemp2 = null;

    nodeTemp1 = this.doc.forms[0].elements.namedItem("ks");
    nodeTemp2 = this.doc.createElement("input");
    nodeTemp2.setAttribute("type", "hidden");
    nodeTemp2.setAttribute("name", "vuuHiddenKingdomNum");
    nodeTemp2.value = this.info.kingdomNum;
    nodeTemp1.parentNode.insertBefore(nodeTemp2, nodeTemp1);

    nodeTemp1 = this.doc.forms[0].elements.namedItem("is");
    nodeTemp2 = this.doc.createElement("input");
    nodeTemp2.setAttribute("type", "hidden");
    nodeTemp2.setAttribute("name", "vuuHiddenIslandNum");
    nodeTemp2.value = this.info.islandNum;
    nodeTemp1.parentNode.insertBefore(nodeTemp2, nodeTemp1);
},

/**
 * Calculates values required for modifying kingdom page. Calculates (this.info.):
 * land, avgLand, avgNWPA, avgNetworth, dragonCost, dragonKill, dragonSendLower,
 * dragonSendUpper, honorMin, honorMax
 * Also populates this.raceSummary and this.provinces arrays
 * For correct results this.fillKingdomHeaderData() must be called prior
 * to calling this function
 */
vuuPMKingdom.prototype.addPreviousNext = function()
{
    var            nodeTemp1 = null;
    var            nodeTemp2 = null;
    var            nodeTD = null;
    var            nodeSelect = null;
    var            nodeTBody = null;

    // assign 'Select Kingdom' button an id for easy retrieval later
    nodeTBody =
        gVUUDOM.getDescendentTextNode(this.doc.forms[0], "Kingdom:", 1, "ERROR@ kingdom_page.js:600")
        .parentNode.parentNode.parentNode;

    nodeTD = gVUUDOM.getChildElement(nodeTBody, "tr", 2, "ERROR@ kingdom_page.js:603");
    nodeTD = gVUUDOM.getChildElement(nodeTD, "td", 1, "ERROR@ kingdom_page.js:604");
    nodeSelect = gVUUDOM.getDescendentElement(nodeTD, "input", 1, "ERROR@ kingdom_page.js:605");
    nodeSelect.setAttribute("id", "btnSelectKingdom");

    nodeTemp1 = gVUUDOM.getChildElement(nodeTBody, "tr", 1, "ERROR@ kingdom_page.js:608");
    var            nodeTemp2 = this.doc.createElement("td");
    nodeTemp2.appendChild(nodeSelect);
    nodeTemp1.appendChild(nodeTemp2);
    nodeTD.setAttribute("colspan", "5");

    var            newTable = this.doc.createElement("table");
    newTable.setAttribute("align", "center");
    nodeTD.appendChild(newTable);

    var            newTR= this.doc.createElement("tr");
    newTable.appendChild(newTR);

    // create prev kingdom / random kingdom / next kingdom buttons
    var            newTD = this.doc.createElement("td");
    var            newInput = this.doc.createElement("input");
    newInput.setAttribute("type", "button");
    newInput.setAttribute("value", "Prev Kingdom");
    newInput.setAttribute("accesskey", "p");
    newInput.setAttribute("onclick",
        " var kingdom = document.forms[0].elements.namedItem('KingdomNum');"
        + " var island = document.forms[0].elements.namedItem('IslandNum');"
        + " var origKingdom = document.forms[0].elements.namedItem('vuuHiddenKingdomNum');"
        + " var origIsland = document.forms[0].elements.namedItem('vuuHiddenIslandNum');"
        + " if (parseInt(origKingdom.value) > 1) {"
        + "   kingdom.value = parseInt(origKingdom.value) - 1;"
        + " } else {"
        + "   if (parseInt(origIsland.value) > 1) {"
        + "     island.value = parseInt(origIsland.value) - 1;"
        + "     kingdom.value = " + this.maxKingdomNum + ";"
        + "   } else {"
        + "     island.value = " + this.maxIslandNum + ";"
        + "     kingdom.value = " + this.maxKingdomNum + ";"
        + "   }"
        + " }"
        + " document.getElementById('btnSelectKingdom').click();");
    newTD.appendChild(newInput);
    newTR.appendChild(newTD);

    newTD = this.doc.createElement("td");
    newInput = this.doc.createElement("input");
    newInput.setAttribute("type", "button");
    newInput.setAttribute("value", "Random Kingdom");
    newInput.setAttribute("accesskey", "r");
    newInput.setAttribute("onclick",
        " var kingdom = document.forms[0].elements.namedItem('KingdomNum');"
        + " var island = document.forms[0].elements.namedItem('IslandNum');"
        + " kingdom.value = Math.floor(Math.random() * " + this.maxKingdomNum + " + 1);"
        + " island.value = Math.floor(Math.random() * " + this.maxIslandNum + " + 1);"
        + " document.getElementById('btnSelectKingdom').click();"
    );
    newTD.appendChild(newInput);
    newTR.appendChild(newTD);

    newTD = this.doc.createElement("td");
    newInput = this.doc.createElement("input");
    newInput.setAttribute("type", "button");
    newInput.setAttribute("value", "Next Kingdom");
    newInput.setAttribute("accesskey", "n");
    newInput.setAttribute("onclick",
        " var kingdom = document.forms[0].elements.namedItem('KingdomNum');"
        + " var island = document.forms[0].elements.namedItem('IslandNum');"
        + " var origKingdom = document.forms[0].elements.namedItem('vuuHiddenKingdomNum');"
        + " var origIsland = document.forms[0].elements.namedItem('vuuHiddenIslandNum');"
        + " if (parseInt(origKingdom.value) + 1 <= " + this.maxKingdomNum + ") {"
        + "   kingdom.value = parseInt(origKingdom.value) + 1;"
        + " } else {"
        + "   if (parseInt(origIsland.value) + 1 <= " + this.maxIslandNum + ") {"
        + "     island.value = parseInt(origIsland.value) + 1;"
        + "     kingdom.value = 1;"
        + "   } else {"
        + "     island.value = 1;"
        + "     kingdom.value = 1;"
        + "   }"
        + " }"
        + " document.getElementById('btnSelectKingdom').click();");
    newTD.appendChild(newInput);
    newTR.appendChild(newTD);
}

/**
 * Adds a confirmation dialog to any input button that changes relations
 * if one exists.
 * (Propose CeaseFire, Break CeaseFire, Cancel CeaseFire Proposal)
 */
vuuPMKingdom.prototype.addRelationsConfirmation = function()
{
    var            tmpNode = null;

    MpDebug(this.debug, "Adding Relations Confirmation Now");

    if (this.doc.forms[1] != null) {
        // When warring kingdom B the second form is still present, just filled with
        // hidden elements. But there won't be the third input element unless you are
        // a Monarch
        tmpNode = gVUUDOM.getDescendentElement(this.doc.forms[1], "input", 3, "ERROR@ kingdom_page.js:703");

        if (tmpNode != null) {
            tmpNode.setAttribute("id", "vuuRelationsChange1");
            tmpNode.setAttribute("onclick", "return vuuConfirmRelationsChange('" + tmpNode.value + "');");

            tmpNode = this.doc.createElement("script");
            tmpNode.setAttribute("language", "javascript");
            tmpNode.textContent =
                " function vuuConfirmRelationsChange(aRelation) {"
                + "   var confirmText = null;"
                + "   confirmText = 'Please confirm relations change:  ';"
                + "   confirmText += aRelation;"
                + "   return confirm(confirmText);"
                + " }";
            this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);
        }

        // there may be a second relations button in the form
        tmpNode = gVUUDOM.getDescendentElement(this.doc.forms[1], "input", 4, "ERROR@ kingdom_page.js:722");

        if (tmpNode != null) {
            tmpNode.setAttribute("id", "vuuRelationsChange2");
            tmpNode.setAttribute("onclick", "return vuuConfirmRelationsChange('" + tmpNode.value + "');");
        }
    }
}

/**
 * Sets this.info.atWar and if preferences allow converts the war kingdom
 * location to a link to that kingdom.
 */
vuuPMKingdom.prototype.setAtWar = function()
{
    var            tmpNode = null;
    var            tmpNode1 = null;
    var            oldText = null;
    var            index = null;
    var            kingdom = null;
    var            island = null;
    var            color = null;
    var            i = null;

    // 3 possibilities
    // 1: Our kingdom is at war - 'Our kingdom is currently at war with'
    // 2: Kingdom our kingdom is warring - 'Their Attitude Towards Us:' -> 'War'
    // 3: random kingdom at war - 'This kingdom is currently at war with'

    tmpNode = gVUUDOM.getDescendentTextNode(this.body, "This kingdom is currently at war with", 1, "ERROR@ kingdom_page.js::751");

    if (!tmpNode) {
        tmpNode = gVUUDOM.getDescendentTextNode(
        this.body, "Our kingdom is currently at war with", 1, "ERROR@ kingdom_page.js:755");
    }

    // there is no kingdom location to convert for this one
    if (!tmpNode) {
        tmpNode = gVUUDOM.getDescendentTextNode(
        this.body, "Their Attitude Towards Us:", 1, "ERROR@ kingdom_page.js:761");

        if (tmpNode) {
            tmpNode = tmpNode.parentNode;

            // we are looking for the node that is just 'War' by itself
            // unfortunately there can also be
            // 'War History - Wars: 1 - Wins: 0 - Losses: 1' which
            // also contain 'War' so ignore them if they are present
            tmpNode1 = gVUUDOM.getDescendentTextNode(tmpNode, "War", 1, "ERROR@ kingdom_page.js:770");

            for (i = 2; tmpNode1 != null; i++) {

                if (tmpNode1.nodeValue.indexOf("Wars") == -1
                    && tmpNode1.nodeValue.indexOf("History") == -1) {
                    break;
                }

                tmpNode1 = gVUUDOM.getDescendentTextNode(tmpNode, "War", i, "ERROR@ kingdom_page.js:779");
            }

            if (tmpNode1) {
                tmpNode = tmpNode1;
            } else {
                tmpNode = null;
            }
        }
    }

    // if the kingdom is at war
    if (tmpNode) {
        this.info.atWar = true;

        /*
        // This is currently done by swirve.
        if (gVUU.prefs.getBoolPref("vuuGeneralLocationsToLinks")) {
            oldText = tmpNode.parentNode.textContent;
            // if so then there is a province location which should be converted
            // (if you are in war with kingdom X they won't have locations)

            if ((index = oldText.indexOf("(")) != -1) {
                color = tmpNode.parentNode.parentNode.getAttribute("color");

                // get the kingdom and island numbers
                index = oldText.indexOf("(");
                kingdom = oldText.substring(index + 1, oldText.indexOf(":"));
                index = oldText.indexOf(":");
                island = oldText.substring(index + 1, oldText.indexOf(")"));

                // create and append relations link
                tmpNode1 = this.doc.createElement("a");

                tmpNode1.setAttribute("href",
                    "scores.cgi?kingdomnum=" + kingdom + "&islandnum=" + island);

                tmpNode1.textContent = "(" + kingdom + ":" + island + ")";

                if (color) tmpNode1.setAttribute("style", "color: " + color + ";");

                tmpNode.nodeValue = oldText.substring(0, oldText.indexOf("("));
                tmpNode.parentNode.appendChild(tmpNode1);
            }
        }
        */
    }
}

/**
 * Replaces the current kingdom page province colour descriptions with
 * a summary of the kingdom.
 */
vuuPMKingdom.prototype.addKingdomSummary = function()
{
    var            tmpNode1 = null;
    var            tmpNode2 = null;
    var            tmpText = null;
    var            colorTitle = gVUUColors.TITLE_BAR_BLUE;

    MpDebug(this.debug, "Adding Kingdom Summary Information");

    if (this.info.atWar && gVUU.prefs.getBoolPref("vuuModifyKingdomWarIndication")) {
        MpDebug(this.debug, "Setting At War Color on Summary Header");
        colorTitle = gVUUColors.TITLE_BAR_RED;
    }

    var            nodeTD = null;  // node whose child is to be replaced

    // remove the stuff about colors of provinces (monarch, protection, you)
    nodeTD = this.doc.forms[0].parentNode;
    tmpNode2 = gVUUDOM.getChildElement(nodeTD, "table", 2, "ERROR@ kingdom_page.js:850");
    tmpNode1 = tmpNode2.parentNode;
    tmpNode1.removeChild(tmpNode2);

    // to replace nodeP1
    var            nodeP1 = gVUUDOM.getChildElement(nodeTD, "table", 1);
    var            nodePNew = this.doc.createElement("TABLE");

    // this is the new table that will replace the old one
    var            newTable = this.doc.createElement("table");
    newTable.setAttribute("align", "center");
    newTable.setAttribute("class", "small");
    nodePNew.appendChild(newTable);

    // 1st row of new table - table headings
    tmpNode1 = this.doc.createElement("tr");
    tmpNode1.setAttribute("bgcolor", colorTitle);
    newTable.appendChild(tmpNode1);

    // 1st table heading - kingdom name
    tmpText = "The";
    if (this.info.kingdomFame != null & this.info.kingdomFame != "" && this.info.kingdomFame != " ") {
        tmpText += " '" + this.info.kingdomFame + "'";
    }

    tmpText += " Kingdom of : '";

    tmpText += this.info.kingdomName + "' (" + this.info.kingdomNum + ":" + this.info.islandNum + ")";
    tmpNode2 = this.doc.createElement("th");
    tmpNode2.textContent = tmpText;
    tmpNode1.appendChild(tmpNode2);

    // 2nd table heading - blank space
    tmpNode2 = this.doc.createElement("th");
    tmpNode2.setAttribute("width", "20");
    tmpNode1.appendChild(tmpNode2);

    // 3rd table heading - race summary
    tmpNode2 = this.doc.createElement("th");
    tmpNode2.textContent = "Race Summary";
    tmpNode1.appendChild(tmpNode2);

    // 2nd row of new table - NumProvinces & 1st race
    tmpNode1 = this.doc.createElement("tr");
    newTable.appendChild(tmpNode1);

    // number of provinces in kingdom
    tmpNode2 = this.doc.createElement("td");
    tmpNode2.appendChild(this.doc.createTextNode("Number of Provinces: "));

    tmpNode2.appendChild(gVUUDOM.createColoredSpan(
      this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.numProvinces)));

    tmpNode1.appendChild(tmpNode2);

    // blank
    tmpNode2 = this.doc.createElement("td");
    tmpNode1.appendChild(tmpNode2);

    // 1st race summary
    tmpNode2 = this.doc.createElement("td");
    // only add this first race if the kingdom isn't empty

    if (this.info.numProvinces != "0" && this.raceSummary.length >= 1) {

        tmpNode2.appendChild(this.doc.createTextNode(this.raceNamesPlural[0] + ": "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.raceSummary[0])));

        tmpNode2.appendChild(this.doc.createTextNode(" ("));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(this.doc, gVUUColors.GOLD,
            gVUUFormatter.fNum(Math.round(this.raceSummary[0] / this.info.numProvinces * 100))));

        tmpNode2.appendChild(this.doc.createTextNode("%)"));
    }

    tmpNode1.appendChild(tmpNode2);

    // only do the rest if the kingdom isn't empty
    if (this.info.numProvinces != "0") {
        // 3rd row of new table - Networth + avg & 2nd race
        tmpNode1 = this.doc.createElement("tr");
        newTable.appendChild(tmpNode1);

        // total networth & avg networth of kingdom
        tmpNode2 = this.doc.createElement("td");
        tmpNode2.appendChild(this.doc.createTextNode("Total Networth: "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.networth)));

        tmpNode2.appendChild(this.doc.createTextNode("gc (avg: "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.avgNetworth)));

        tmpNode2.appendChild(this.doc.createTextNode("gc)"));
        tmpNode1.appendChild(tmpNode2);

        // blank
        tmpNode2 = this.doc.createElement("td");
        tmpNode1.appendChild(tmpNode2);

        // 2nd race summary
        tmpNode2 = this.doc.createElement("td");

        if (this.raceSummary.length >= 2) {
            tmpNode2.appendChild(this.doc.createTextNode(this.raceNamesPlural[1] + ": "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.raceSummary[1])));
            tmpNode2.appendChild(this.doc.createTextNode(" ("));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(this.doc, gVUUColors.GOLD,
            gVUUFormatter.fNum(
                Math.round(this.raceSummary[1] / this.info.numProvinces * 100))));
            tmpNode2.appendChild(this.doc.createTextNode("%)"));
        }

        tmpNode1.appendChild(tmpNode2);

        // 4th row of new table - Average NWPA & 3rd race
        tmpNode1 = this.doc.createElement("tr");
        newTable.appendChild(tmpNode1);

        // average NWPA of kingdom
        tmpNode2 = this.doc.createElement("td");
        tmpNode2.appendChild(this.doc.createTextNode("Average Networth per Acre: "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.avgNWPA)));

        tmpNode2.appendChild(this.doc.createTextNode("gc"));
        tmpNode1.appendChild(tmpNode2);

        // blank
        tmpNode2 = this.doc.createElement("td");
        tmpNode1.appendChild(tmpNode2);

        // 3rd race summary
        tmpNode2 = this.doc.createElement("td");
        if (this.raceSummary.length >= 3) {
            tmpNode2.appendChild(this.doc.createTextNode(this.raceNamesPlural[2] + ": "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.raceSummary[2])));
            tmpNode2.appendChild(this.doc.createTextNode(" ("));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(this.doc, gVUUColors.GOLD,
            gVUUFormatter.fNum(
                Math.round(this.raceSummary[2] / this.info.numProvinces * 100))));
            tmpNode2.appendChild(this.doc.createTextNode("%)"));
        }

        tmpNode1.appendChild(tmpNode2);

        // 5th row of new table - total + avg land & 4th race
        tmpNode1 = this.doc.createElement("tr");
        newTable.appendChild(tmpNode1);

        // total land & avg land of kingdom
        tmpNode2 = this.doc.createElement("td");
        tmpNode2.appendChild(this.doc.createTextNode("Total Land: "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.land)));

        tmpNode2.appendChild(this.doc.createTextNode(" acres (avg: "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.avgLand)));

        tmpNode2.appendChild(this.doc.createTextNode(" acres)"));
        tmpNode1.appendChild(tmpNode2);

        // blank
        tmpNode2 = this.doc.createElement("td");
        tmpNode1.appendChild(tmpNode2);

        // 4th race summary
        tmpNode2 = this.doc.createElement("td");
        if (this.raceSummary.length >= 4) {
            tmpNode2.appendChild(this.doc.createTextNode(this.raceNamesPlural[3] + ": "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.raceSummary[3])));
            tmpNode2.appendChild(this.doc.createTextNode(" ("));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(this.doc, gVUUColors.GOLD,
            gVUUFormatter.fNum(
                Math.round(this.raceSummary[3] / this.info.numProvinces * 100))));

            tmpNode2.appendChild(this.doc.createTextNode("%)"));
        }

        tmpNode1.appendChild(tmpNode2);

        // 6th row of new table - dragon cost + soldiers to kill 1% & 5th race
        tmpNode1 = this.doc.createElement("tr");
        newTable.appendChild(tmpNode1);

        // dragon cost + soldiers to kill 1%
        tmpNode2 = this.doc.createElement("td");
        tmpNode2.appendChild(this.doc.createTextNode("Dragon Cost: "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.dragonCost)));

        tmpNode2.appendChild(this.doc.createTextNode("gc ("));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.dragonKill)));

        tmpNode2.appendChild(this.doc.createTextNode(" soldiers for 1%)"));
        tmpNode1.appendChild(tmpNode2);

        // blank
        tmpNode2 = this.doc.createElement("td");
        tmpNode1.appendChild(tmpNode2);

        // 5th race summary
        tmpNode2 = this.doc.createElement("td");

        if (this.raceSummary.length >= 5) {
            tmpNode2.appendChild(this.doc.createTextNode(this.raceNamesPlural[4] + ": "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.raceSummary[4])));
            tmpNode2.appendChild(this.doc.createTextNode(" ("));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(this.doc, gVUUColors.GOLD,
            gVUUFormatter.fNum(
                Math.round(this.raceSummary[4] / this.info.numProvinces * 100))));

            tmpNode2.appendChild(this.doc.createTextNode("%)"));
        }

        tmpNode1.appendChild(tmpNode2);

        // 7th row of new table - dragon lower send + upper send range & 6th race
        tmpNode1 = this.doc.createElement("tr");
        newTable.appendChild(tmpNode1);

        // dragon lower and upper send range
        tmpNode2 = this.doc.createElement("td");
        tmpNode2.appendChild(this.doc.createTextNode("Dragon Send Range: "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.dragonSendLower)));

        tmpNode2.appendChild(this.doc.createTextNode("gc to "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.dragonSendUpper)));

        tmpNode2.appendChild(this.doc.createTextNode("gc"));
        tmpNode1.appendChild(tmpNode2);

        // blank
        tmpNode2 = this.doc.createElement("td");
        tmpNode1.appendChild(tmpNode2);

        // 6th race summary
        tmpNode2 = this.doc.createElement("td");
        if (this.raceSummary.length >= 6) {
            tmpNode2.appendChild(this.doc.createTextNode(this.raceNamesPlural[5] + ": "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.raceSummary[5])));
            tmpNode2.appendChild(this.doc.createTextNode(" ("));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(this.doc, gVUUColors.GOLD,
            gVUUFormatter.fNum(
                Math.round(this.raceSummary[5] / this.info.numProvinces * 100))));

            tmpNode2.appendChild(this.doc.createTextNode("%)"));
        }

        tmpNode1.appendChild(tmpNode2);

        // 8th row of new table -  minimum possible honor + acres & 7th race
        tmpNode1 = this.doc.createElement("tr");
        newTable.appendChild(tmpNode1);

        // minimum possible kingdom honor
        tmpNode2 = this.doc.createElement("td");
        tmpNode2.appendChild(this.doc.createTextNode("Minimum Possible Honor: "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.honorMin)));

        tmpNode2.appendChild(this.doc.createTextNode(" honor"));
        tmpNode1.appendChild(tmpNode2);

        // blank
        tmpNode2 = this.doc.createElement("td");
        tmpNode1.appendChild(tmpNode2);

        // 7th race summary
        tmpNode2 = this.doc.createElement("td");
        if (this.raceSummary.length >= 7) {
            tmpNode2.appendChild(this.doc.createTextNode(this.raceNamesPlural[6] + ": "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.raceSummary[6])));
            tmpNode2.appendChild(this.doc.createTextNode(" ("));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(
                Math.round(this.raceSummary[6] / this.info.numProvinces * 100))));

            tmpNode2.appendChild(this.doc.createTextNode("%)"));
        }
        tmpNode1.appendChild(tmpNode2);

        // 9th row of new table -  maximum possible honor + acres & 8th race
        tmpNode1 = this.doc.createElement("tr");
        newTable.appendChild(tmpNode1);

        // maximum possible kingdom honor
        tmpNode2 = this.doc.createElement("td");
        tmpNode2.appendChild(this.doc.createTextNode("Maximum Possible Honor: "));
        tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.honorMax)));

        tmpNode2.appendChild(this.doc.createTextNode(" honor"));
        tmpNode1.appendChild(tmpNode2);

        // blank
        tmpNode2 = this.doc.createElement("td");
        tmpNode1.appendChild(tmpNode2);

        // 8th race summary
        tmpNode2 = this.doc.createElement("td");
        if (this.raceSummary.length >= 8) {
            tmpNode2.appendChild(this.doc.createTextNode(this.raceNamesPlural[7] + ": "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.raceSummary[7])));
            tmpNode2.appendChild(this.doc.createTextNode(" ("));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
            this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(
                Math.round(this.raceSummary[7] / this.info.numProvinces * 100))));

            tmpNode2.appendChild(this.doc.createTextNode("%)"));
        }
        tmpNode1.appendChild(tmpNode2);

        if (this.info.networthRank != null) {
            // 10th row of new table -  Nw Rank
            tmpNode1 = this.doc.createElement("tr");
            newTable.appendChild(tmpNode1);

            // maximum possible kingdom honor
            tmpNode2 = this.doc.createElement("td");
            tmpNode2.appendChild(this.doc.createTextNode("Networth Rank : "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
                        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.networthRank)));
            tmpNode2.appendChild(this.doc.createTextNode(" of "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
                        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.networthTotalRank)));
            tmpNode1.appendChild(tmpNode2);

            // blank
            tmpNode2 = this.doc.createElement("td");
            tmpNode1.appendChild(tmpNode2);

            // blank
            tmpNode2 = this.doc.createElement("td");
            tmpNode1.appendChild(tmpNode2);
        }

        if (this.info.landRank != null) {
            // 10th row of new table -  Land Rank
            tmpNode1 = this.doc.createElement("tr");
            newTable.appendChild(tmpNode1);

            // maximum possible kingdom honor
            tmpNode2 = this.doc.createElement("td");
            tmpNode2.appendChild(this.doc.createTextNode("Land Rank : "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
                        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.landRank)));
            tmpNode2.appendChild(this.doc.createTextNode(" of "));
            tmpNode2.appendChild(gVUUDOM.createColoredSpan(
                        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.landTotalRank)));
            tmpNode1.appendChild(tmpNode2);

            // blank
            tmpNode2 = this.doc.createElement("td");
            tmpNode1.appendChild(tmpNode2);

            // blank
            tmpNode2 = this.doc.createElement("td");
            tmpNode1.appendChild(tmpNode2);
        }
    }

    // finally, replace the original P with the newly constructed P
    nodeTD.replaceChild(nodePNew, nodeP1);
}

/**
* Adds a NWPA column to the kingdom table.
*/
vuuPMKingdom.prototype.addNWPAColumn = function()
{
    // modify kingdom data to include NWPA
    var            node = this.doc.getElementById("tableKingdomData");
    var            tmpNode1 = null;
    var            tmpNode2 = null;

    tmpNode1 = gVUUDOM.getDescendentElement(node, "tr", 1, "ERROR@ kingdom_page.js:1238");
    tmpNode2 = this.doc.createElement("th");
    tmpNode2.setAttribute("bgcolor", gVUUColors.TITLE_BAR_BLUE);
    tmpNode2.textContent = ("NW / Acre");
    tmpNode1.insertBefore(
        tmpNode2, gVUUDOM.getChildElement(tmpNode1, "th", 5, "ERROR@ kingdom_page.js::1243"));

    tmpNode1 = gVUUDOM.getChildElement(tmpNode1.parentNode, "tr", 2, "ERROR@ kingdom_page.js:1245");
    tmpNode2 = this.doc.createElement("td");
    tmpNode1.insertBefore(
        tmpNode2, gVUUDOM.getChildElement(tmpNode1, "td", 6, "ERROR@ kingdom_page.js:1248"));

    // change background color of last column - needs to be grey now
    tmpNode1 = gVUUDOM.getChildElement(tmpNode1, "td", 6, "ERROR@ kingdom_page.js:1251");
    tmpNode1.setAttribute("bgcolor", gVUUColors.DARK_GREY);

    // continue with setting up nwpa column
    tmpNode1 = this.doc.createTextNode("");
    tmpNode2.appendChild(tmpNode1);

    for (var i = 0; i < this.info.numProvinces; i++) {

        if (this.provinces[i].networth.indexOf("Small") == -1
            && this.provinces[i].networth.indexOf("-") == -1
            && this.provinces[i].networth.indexOf("DEAD") == -1
            && this.provinces[i].acres != "0") {

            tmpNode2.appendChild(this.doc.createElement("br"));
            tmpNode1 = this.doc.createTextNode(
                gVUUFormatter.fNum(this.provinces[i].nwpa) + "gc");

            tmpNode2.appendChild(tmpNode1);
        } else {
            tmpNode2.appendChild(this.doc.createElement("br"));
            tmpNode1 = this.doc.createTextNode(this.provinces[i].nwpa);
            tmpNode2.appendChild(tmpNode1);
        }
    }

}

/**
 * If the kingdom is at war then adds 'at war indication'.
 */
vuuPMKingdom.prototype.addAtWarIndication = function()
{
    if (this.info.atWar) {
        var        tmpNode1 = null;
        var        tmpNode = this.doc.getElementById("tableKingdomData");

        tmpNode = gVUUDOM.getDescendentElement(tmpNode, "tr", 1, "ERROR@ kingdom_page.js:1288");

        for (var i = 1; ; i++) {
            tmpNode1 = gVUUDOM.getChildElement(tmpNode, "th", i, "ERROR@ kingdom_page.js:1291");

            if (tmpNode1 != null) {
                tmpNode1.setAttribute("bgcolor", gVUUColors.TITLE_BAR_RED);
            } else {
                break;
            }
        }
    }
}

/**
 * Adds the ability to sort kingdoms by kingdom table column.
 */
vuuPMKingdom.prototype.addKingdomSorting = function(aUserEnabled)
{
    var             tmpNode = null;
    var             nodeTR = null;
    var             i = 0;

    MpDebug(this.debug, "Writing script for sorting the provinces in HTML");

    // only add sorting if there are any provinces
    if (this.info.numProvinces != "0") {
        // add a dummy node to store the last sorting method.
        var         element = document.createElement('input');

        element.setAttribute('id', 'vuu_comms_sorting');
        element.setAttribute('type', 'hidden');
        this.body.appendChild(element);

        // add needed script element for kingdom sorting click
        tmpNode = this.doc.createElement("script");
        tmpNode.setAttribute("language", "javascript");

        tmpNode.textContent = "" 
            /*+ " var element = document.createElement('input');"*/
            /*+ " element.setAttribute('id', 'vuu_comms_sorting');"*/
            /*+ " element.setAttribute('type', 'hidden');"*/
            /*+ " document.body.appendChild(element);"*/
            + " function fire_sorting_event(type) {"
            + " var element = document.getElementById('vuu_comms_sorting');"
            + " element.setAttribute('value', type);"
            + " var event = document.createEvent('Events');"
            + " event.initEvent('KingdomSortingEvent', true, false);"
            + " element.dispatchEvent(event);"
            + " }";

        this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);

        // if the user wishes to be able to sort then add user interface elements
        // (we need to be able to sort regardless of whether the user wishes to
        //  be able to)

        if (aUserEnabled) {
            // add event firing to kingdom table column headers
            nodeTR = this.doc.getElementById("tableKingdomData");
            nodeTR = gVUUDOM.getDescendentElement(nodeTR, "tbody", 1);
            nodeTR = gVUUDOM.getChildElement(nodeTR, "tr", 1);

            for (i = 1; ; i++) {

                if ((tmpNode = gVUUDOM.getChildElement(nodeTR, "th", i)) != null) {
                    tmpNode.setAttribute("onclick", "fire_sorting_event('" + tmpNode.textContent + "');");
                    tmpNode.setAttribute("onmouseover",
                        "this.style.textDecoration='underline'; this.style.cursor='pointer'");

                    tmpNode.setAttribute("onmouseout", "this.style.textDecoration='none';");
                } else {
                    break;
                }
            }
        }

        // add event listener for custom event. Allows communication between
        // the webpage and this extension
        this.doc.addEventListener("KingdomSortingEvent", this.kingdomSortListener, false);

        // if user preference is to sort the screen on load then sort it now
        if (gVUU.prefs.getBoolPref("vuuModifyKingdomSorting")
            && gVUU.prefs.getBoolPref("vuuModifyKingdomAlwaysSort")) {

            var        sortBy = null;
            var        event = null;

            if (gVUU.prefs.getIntPref("vuuModifyKingdomAlwaysSortBy") == gVUU.PREF_KINGDOM_SORT_PROVINCE) {
                sortBy = "Province";
            } else if (gVUU.prefs.getIntPref("vuuModifyKingdomAlwaysSortBy")==gVUU.PREF_KINGDOM_SORT_RACE) {
                sortBy = "Race";
            } else if (gVUU.prefs.getIntPref("vuuModifyKingdomAlwaysSortBy")==gVUU.PREF_KINGDOM_SORT_LAND) {
                // Land Acres
                sortBy = "Land";
            } else if (gVUU.prefs.getIntPref("vuuModifyKingdomAlwaysSortBy") == gVUU.PREF_KINGDOM_SORT_NW) {
                // Net Worth
                sortBy = "Net";
            } else if (gVUU.prefs.getIntPref("vuuModifyKingdomAlwaysSortBy")==gVUU.PREF_KINGDOM_SORT_NWPA) {
                // NW / Acre
                sortBy = "NW";
            } else if (gVUU.prefs.getIntPref("vuuModifyKingdomAlwaysSortBy")==gVUU.PREF_KINGDOM_SORT_RANK) {
                sortBy = "Rank";
            }
        } else {
            sortBy = "Current";
        }

        if ((tmpNode = this.doc.getElementById("vuu_comms_sorting")) != null) {
            tmpNode.setAttribute('value', sortBy);
            event = this.doc.createEvent("Events");
            event.initEvent("KingdomSortingEvent", true, false);
            tmpNode.dispatchEvent(event);
        }
    }
}

/**
 * Listens for kingdom sorting events fired by the 'The Kingdom' document
 * and sorts the kingdom appropriately.
 */
vuuPMKingdom.prototype.kingdomSortListener = function(aEvent)
{
    var            doc = aEvent.target.ownerDocument;
    var            node = doc.getElementById("tableKingdomData");

    node = gVUUDOM.getDescendentElement(node, "tbody", 1);

    var            nodeToReplace = gVUUDOM.getChildElement(node, "tr", 2);
    var            newNode = null;
    var            value = aEvent.target.getAttribute("value");
    var            helper = new vuuKingdomSortingHelper(doc);
    var            sortNode = null;

    if (value.indexOf("Province") != -1) {
        newNode = helper.createProvincesRow(helper.PROVINCE);
    } else if (value.indexOf("Race") != -1) {
        newNode = helper.createProvincesRow(helper.RACE);
    } else if (value.indexOf("Land") != -1) {
        // Land Acres
        newNode = helper.createProvincesRow(helper.LAND);
    } else if (value.indexOf("Net") != -1) {
        // Net Worth
        newNode = helper.createProvincesRow(helper.NETWORTH);
    } else if (value.indexOf("NW") != -1) {
        // NW / Acre
        newNode = helper.createProvincesRow(helper.NWPA);
    } else if (value.indexOf("Rank") != -1) {
        newNode = helper.createProvincesRow(helper.RANK);
    } else if (value.indexOf("Current") != -1) {
        newNode = helper.createProvincesRow(helper.CURRENT);
    }

    node.replaceChild(newNode, nodeToReplace);
}

/**
 * Adds "add bookmark" / "tag kingdom" section to the kingdom page
 */
vuuPMKingdom.prototype.addBookmarkSections = function()
{
    var            tmpNode = null;

    MpDebug(this.debug, "Writing script for addition/deletion of bookmarks in HTML");

    // add needed script element for bookmarking / tagging click
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");

    tmpNode.textContent =
        " var element = document.createElement('input');"
            + " element.setAttribute('id', 'vuu_comms_bookmarking');"
            + " element.setAttribute('type', 'hidden');"
            + " document.body.appendChild(element);"
            + " function fire_bookmarking_event(aType) {"
            + " var element = document.getElementById('vuu_comms_bookmarking');"
            + " element.setAttribute('value', aType);"
            + " var event = document.createEvent('Events');"
            + " event.initEvent('BookmarkingEvent', true, false);"
            + " element.dispatchEvent(event);"
            + " }";

    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);

    // add event listener for custom event. Allows communication between
    // the webpage and this extension
    this.doc.addEventListener("BookmarkingEvent", this.bookmarkingListener, false);

    var            tmpNode1 = null;
    var            tmpNode2 = null;
    var            bookmark = null;
    var            nodeTable = this.doc.createElement("table");

    nodeTable.setAttribute("id", "vuu_bookmark_actions");
    nodeTable.setAttribute("class", "small");

    var            nodeTBody = this.doc.createElement("tbody");
    var            nodeTR = this.doc.createElement("tr");
    var            nodeTDBookmark = this.doc.createElement("td");

    nodeTDBookmark.setAttribute("align", "center");
    nodeTDBookmark.setAttribute("width", "50%");

    var            nodeLink = null;
    var            nodeTDTag = this.doc.createElement("td");

    nodeTDTag.setAttribute("align", "center");
    nodeTDTag.setAttribute("width", "50%");

    var            nodeTag = null;

    if ((bookmark = this.bookmarks.getKingdomBookmark(this.info.kingdomNum, this.info.islandNum)) == null) {
        // add "Add Bookmark" link
        nodeLink = this.doc.createElement("a");
        nodeLink.setAttribute("id", gVUUBookmarks.linkBookmark);
        nodeLink.setAttribute("onclick", "fire_bookmarking_event('add'); return false;");
        nodeLink.setAttribute("href", "#");
        nodeLink.textContent = "Bookmark Kingdom";
    } else {
        // add "Remove bookmark" link
        nodeLink = this.doc.createElement("a");
        nodeLink.setAttribute("id", gVUUBookmarks.linkBookmark);
        nodeLink.setAttribute("onclick", "fire_bookmarking_event('remove'); return false;");
        nodeLink.setAttribute("href", "#");
        nodeLink.textContent = "Delete Bookmark";
    }

    nodeTag = this.doc.createElement("a");
    nodeTag.setAttribute("id", gVUUBookmarks.linkTag);
    nodeTag.setAttribute("onclick", "fire_bookmarking_event('tag'); return false;");
    nodeTag.setAttribute("href", "#");
    nodeTag.textContent = "Tag Kingdom";

    nodeTable.appendChild(nodeTBody);
    nodeTBody.appendChild(nodeTR);
    nodeTR.appendChild(nodeTDBookmark);
    nodeTDBookmark.appendChild(nodeLink);
    nodeTR.appendChild(nodeTDTag);
    nodeTDTag.appendChild(nodeTag);

    var            nodeToInsertBefore = this.doc.forms[0].parentNode;

    nodeToInsertBefore = gVUUDOM.getChildElement(nodeToInsertBefore, "span", 1, "ERROR@ kingdom_page.js:1530");
    nodeToInsertBefore.parentNode.insertBefore(nodeTable, nodeToInsertBefore);

    // display menu of bookmarks
    gVUUBookmarks.updateBookmarkDisplay(this.doc, this.bookmarks, "scores.cgi?ks=$k&is=$i");
}

/**
 * Listens for bookmarking events fired by the 'The Kingdom' document
 * and acts appropriately.
 */
vuuPMKingdom.prototype.bookmarkingListener = function(aEvent)
{
    var            doc = aEvent.target.ownerDocument;

    var            server = gVUU.servers.getServerByHref(doc.location.href);
    var            bookmarkManager = server.bookmarkManager;

    var            value = aEvent.target.getAttribute("value");
    var            link = doc.getElementById(gVUUBookmarks.linkBookmark);
    var            bookmark = null;

    var            kingdom = parseInt(doc.forms[0].elements.namedItem("vuuHiddenKingdomNum").value);
    var            island = parseInt(doc.forms[0].elements.namedItem("vuuHiddenIslandNum").value);

    if (value == "add") {

        if (gVUUBookmarks.addKingdomBookmark(kingdom, island, server.hrefID)) {
            bookmark = bookmarkManager.getKingdomBookmark(kingdom, island);

            if (bookmark != null) {
                var          tmpNode = link.parentNode.parentNode.parentNode.parentNode;

                link.setAttribute("onclick", "fire_bookmarking_event('remove'); return false;");
                link.textContent = "Delete Bookmark";
                tmpNode.setAttribute("style", "border-bottom: solid " +
                                        bookmarkManager.getColorFromType(bookmark.type) + ";");
            }
        }
    } else if (value == "remove") {
        bookmark = bookmarkManager.getKingdomBookmark(kingdom, island);
        bookmarkManager.removeKingdomBookmark(kingdom, island, bookmark.type);
        link.setAttribute("onclick", "fire_bookmarking_event('add'); return false;");
        link.textContent = "Bookmark Kingdom";
        link.parentNode.parentNode.parentNode.parentNode.removeAttribute("style");
        bookmarkManager.saveKingdomBookmarks();
    } else if (value == "tag") {
        bookmarkManager.setTaggedKingdom(kingdom, island);
    }

    gVUUBookmarks.updateBookmarkDisplay(doc, bookmarkManager);
}

vuuPMKingdom.prototype.addIntelIndication = function()
{
    var            tmpNode1 = null;
    var            i = 0;

    // only if there are any provinces
    if (this.info.numProvinces != 0) {
        /* This is for actually loading a CB
            // Add needed script element for intel click
            tmpNode1 = this.doc.createElement("script");
            tmpNode1.setAttribute("language", "javascript");
            tmpNode1.textContent =
                ' var element = document.createElement("input");'
            + ' element.setAttribute("id", "vuu_comms_intel");'
            + ' element.setAttribute("type", "hidden");'
            + ' document.documentElement.appendChild(element);'
            + ' function vuuFireIntelEvent(provNo) {'
                + ' var element = document.getElementById("vuu_comms_intel");'
                + ' var province = document.getElementById("vuu_prov_" + provNo);'
                + ' province = province.textContent;'
                + ' element.setAttribute("value", "loadCB.Past Glories (6:50)." + province);'
                + ' var event = document.createEvent("Events");'
                + ' event.initEvent("IntelRequestEvent", true, false);'
                + ' element.dispatchEvent(event);'
            + ' }';
            this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode1);
        */

        // Add needed script element for CB tooltip
        tmpNode1 = this.doc.createElement("script");
        tmpNode1.setAttribute("language", "javascript");
        tmpNode1.textContent =
            ' function vuuShowTooltip(aElement, aEvent, aText)'
            + ' {'
            + ' var tooltip = document.getElementById("vuu_tooltip");'
            + ' var inner = document.createElement("layer");'
            + ' var para = document.createElement("p");'
            + ' para.setAttribute("style", "padding: 3px; border:1px solid black;'
            + ' font-size:10px; color: #000000; background-color: #FFFFE7");'
            + ' para.innerHTML = aText;'
            + ' inner.appendChild(para);'
            + ' if (tooltip.firstChild)'
            + ' tooltip.replaceChild(inner, tooltip.firstChild);'
            + ' else'
            + ' tooltip.appendChild(inner);'
            + ' tooltip.style.left = aEvent.pageX + 10;'
            + ' tooltip.style.top = aEvent.pageY - 350;'
            + ' tooltip.style.visibility="visible"'
            + ' }'
            + '\n'
            + ' function vuuHideTooltip()'
            + ' {'
            + ' var tooltip = document.getElementById("vuu_tooltip");'
            + ' tooltip.style.visibility="hidden";'
            + ' if (tooltip.firstChild)'
            + ' tooltip.removeChild(tooltip.firstChild);'
            + ' }'

        this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode1);

        // insert the DIV used for tooltips
        tmpNode1 = this.doc.createElement("div");
        tmpNode1.setAttribute("id", "vuu_tooltip");
        tmpNode1.setAttribute("style", "position:absolute; visibility:hidden");
        this.doc.getElementsByTagName("body").item(0).appendChild(tmpNode1);

        // Insert INTEL images - get from socket
        var        socket = null;
        var        cache = null;
        var        command = null;
        var        commandMap = new Object();    // cmdNo -> province id hash map
        var        tmpDoc = this.doc;
        var        tmpHaveIntel = this.haveIntel;
        var        tmpIntelFinished = this.intelFinished;
        //var tmpNumProvs = this.info.numProvinces;

        // we only want provinces that have a proper name: no unclaimed or awaiting activation
        var        tmpNumProvs = 0;

        for (i = 0; i < this.info.numProvinces; i++) {

            if (this.provinces[i].name.indexOf("-") == -1) {
                tmpNumProvs++;
                this.provinces[i].cmdNo = gVUUSocketData.getGUID();
                commandMap["" + this.provinces[i].cmdNo] = this.provinces[i].id;
            }
        }

        var kpOnDataAvailable = function (aRequest, aSocketContext, aInputStream, aSourceOffset, aCount)
        {
            if (!this.numProcessed) {
                this.numProcessed = 0;
                this.totalToProcess = tmpNumProvs;
                this.doc = tmpDoc;
                this.data = "";
            }

            this.data += this.inStream.read(aCount);
            var    commands = vuuSocket.getCommands(this.data);
            this.data = commands[0];

            var    nodeImg = null;
            var    nodeProvName = null;
            var    command = null;
            var    provinceID = null;

            // [haveCB][cmdNo][response][:]
            for (var i = 1; i < commands.length; i++) {

                command = new vuuSocketCommand(commands[i]);

                if (command.isType(vuuSocketCommand.HAVE_CB)
                    && command.response && command.response == "yes") {

                    // add province id to the array of provs that have intel
                    provinceID = commandMap["" + command.cmdNo];
                    tmpHaveIntel.push(provinceID);

                    nodeImg = this.doc.createElement("img");
                    nodeImg.setAttribute("src", "chrome://vuu/skin/intel.png");
                    //nodeImg.setAttribute("alt", "intel"); <-- shows up when copying text
                    nodeImg.setAttribute("style", "margin-right: 5px; cursor: help;");
                    nodeImg.setAttribute("id", "vuu_intel_" + provinceID);
                    //nodeImg.setAttribute("onclick", "vuuFireIntelEvent(" + this.id + ");");
                    nodeProvName = this.doc.getElementById("vuu_prov_" + provinceID);
                    nodeProvName.parentNode.insertBefore(nodeImg, nodeProvName);

                    // LOAD_CB event stuff
                    //tmpNode = gVUUDOM.getChildElement(this.node, "span", this.id);
                    //tmpNode1.setAttribute("style", tmpNode.getAttribute("style") + " cursor: pointer;");
                    //tmpNode1.setAttribute("onmouseover", "this.style.textDecoration='underline';");
                    //tmpNode1.setAttribute("onmouseout", "this.style.textDecoration='none';");
                    //tmpNode1.setAttribute("onclick", "vuuFireIntelEvent(' + this.id + ');");
                }

                this.numProcessed++;
            }

            if (this.numProcessed == this.totalToProcess) {
                vuuSocket.closeSocket(socket);
                tmpIntelFinished[0] = true;
            }
        }

        cache = this.server.cache;
        socket = new vuuSocket();
        socket.init(gVUU.prefs.getIntPref("vuuFormattingPort"), kpOnDataAvailable);

        for (i = 0; i < this.info.numProvinces; i++) {

            if (this.provinces[i].cmdNo != null) {
                // [haveCB][cmdNo][server][province][kingdom][island][*province][*kingdom][*island][:]
                command = "[haveCB][" + this.provinces[i].cmdNo + "][" + this.server.hrefID + "]["
                    + cache.provinceName + "][" + cache.kingdom + "][" + cache.island + "]["
                    + this.provinces[i].name + "][" + this.info.kingdomNum + "]["
                    + this.info.islandNum + "][:]\n";

                socket.send(command);
            }
        }

        setTimeout(kp_intelTooltip(this.server, this.doc, this.intelFinished,
                        this.haveIntel, this.info), 50);
    }
}


/**
vuuPMKingdom.prototype.intelClickListener = function(e)
{
    var            socket = null;
    var kpOnDataAvailable = function (aRequest, aSocketContext, aInputStream, aSourceOffset, aCount)
    {
        this.data += this.inStream.read(aCount);

        var        commands = vuuSocket.getCommands(this.data);

        this.data = commands[0];

        for (var i = 1; i < commands.length; i++) {

            if (!commands[i] == "true") {
                alert("Error: When trying to load intel - Formatting program reports no intel available");
            } else {
                alert("Formatting program loads intel now :-)");
            }
        }

        vuuSocket.closeSocket(socket);
    }

    socket = new vuuSocket();
    socket.init(gVUU.prefs.getIntPref("vuuFormattingPort"), kpOnDataAvailable);
    socket.send(e.target.getAttribute("value") + "\n");
}
*/


// not an object function. Issues with referencing members from within a function
// within a function.
function kp_intelTooltip(aServer, aDoc, aIntelFinished, aHaveIntel, aKingdomInfo)
{
    // use closure to pass parameters to setTimeout
    return (function()
    {
        // insert CB tooltips if intel images are displayed
        // only start requesting CB's once all 'haveCB' requests are complete
        if (aIntelFinished[0]) {
            if (aHaveIntel.length > 0) {
                var         i = 0;
                var         commandMap = new Object();
                var         cache = null;
                var         socket = null;

                var         kpOnDataAvailableCB = function (aRequest, aSocketContext, aInputStream, aSourceOffset, aCount)
                {
                    if (!this.numProcessed) {
                        this.numProcessed = 0;
                        this.totalToProcess = aHaveIntel.length;
                        this.doc = aDoc;
                        this.data = "";
                    }

                    this.data += this.inStream.read(aCount);
                    var        commands = vuuSocket.getCommands(this.data);

                    this.data = commands[0];

                    var        nodeImg = null;
                    var        command = null;
                    var        provinceID = null;

                    // [getCB][cmdNo][response]
                    for (var i = 1; i < commands.length; i++) {
                        command = new vuuSocketCommand(commands[i]);

                        if (command.isType(vuuSocketCommand.GET_CB) && command.response) {
                            provinceID = commandMap["" + command.cmdNo];

                            if ((nodeImg = this.doc.getElementById("vuu_intel_" + provinceID)) != null) {

                                for (var j = 0; j < this.doc.vuuNumProvinces; j++) {

                                    if (this.doc.vuuProvinces[j].id == provinceID) {
                                        this.doc.vuuProvinces[j].cb = command.response.
                                                            replace(/\n/g, "<br />");

                                        nodeImg.setAttribute("onmouseover",
                                            "vuuShowTooltip(this, event, '" +
                                            this.doc.vuuProvinces[j].cb + "');");

                                    nodeImg.setAttribute("onmouseout", "vuuHideTooltip();");
                                    break;
                                    }
                                }
                            }
                        }
                        this.numProcessed++;
                    }

                    if (this.numProcessed == this.totalToProcess) {
                        vuuSocket.closeSocket(socket);
                    }
                }

                socket = new vuuSocket();
                socket.init(gVUU.prefs.getIntPref("vuuFormattingPort"), kpOnDataAvailableCB);
                cache = aServer.cache;

                for (i = 0; i < aKingdomInfo.numProvinces; i++) {
                    aDoc.vuuProvinces[i].cmdNo = null;

                    if (aDoc.getElementById("vuu_intel_" + aDoc.vuuProvinces[i].id) != null) {
                        aDoc.vuuProvinces[i].cmdNo = gVUUSocketData.getGUID();
                        commandMap["" + aDoc.vuuProvinces[i].cmdNo] = aDoc.vuuProvinces[i].id;

                        var        command = "[getCB][" + aDoc.vuuProvinces[i].cmdNo + "]["
                        + aServer.hrefID + "][" + cache.provinceName + "][" + cache.kingdom + "]["
                        + cache.island + "][" + aDoc.vuuProvinces[i].name + "]["
                        + aKingdomInfo.kingdomNum + "][" + aKingdomInfo.islandNum + "][:]\n";

                        socket.send(command);
                    }
                }
            }
        } else {
            // intel images haven't been displayed yet
            setTimeout(kp_intelTooltip(aServer, aDoc, aIntelFinished, aHaveIntel, aKingdomInfo), 50);
        }
    });
}

/****************************************************
*****************************************************
***** vuuKingdomSortingHelper
*****************************************************
****************************************************/

/**
 * Constructor for a 'vuuKingdomSortingHelper' object. Used to help sort the
 * kingdom table on the 'The Kingdom' page.
 * Requires aDoc to have .vuuProvinces & .vuuNumProvinces declared
 * in the document scope
 *
 * param:  aDoc - HTMLDocument - 'The Kingdom' page to modify
 */
function vuuKingdomSortingHelper(aDoc)
{
    this.doc = aDoc;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.bookmarks = this.server.bookmarkManager;

    this.provinces = this.doc.vuuProvinces;
    this.numProvinces = this.doc.vuuNumProvinces;
    this.sortBy = null;
    this.actualSortBy = null;

    this.PROVINCE = 0;
    this.RACE = 1;
    this.LAND = 2;
    this.NETWORTH = 3;
    this.NWPA = 4;
    this.RANK = 5;
    this.CURRENT = 6;       // current order
}

/**
 * Should only be called by this.createProvincesRow().
 * Creates the visual identifier for the column being sorted. Lets the
 * user know which column the kingdom table is being sorted by.
 */
vuuKingdomSortingHelper.prototype.createSortImage = function(aColumn)
{
    var            tmpNode = null;
    var            nodeImg = null;
    var            img = null;

    if (aColumn == this.actualSortBy) {
        img = "chrome://vuu/skin/kingdom_sort.png";
    } else {
        img = "chrome://vuu/skin/kingdom_sort_filler.png";
    }

    // set up sorting image node
    tmpNode = this.doc.createElement("div");
    tmpNode.setAttribute("align", "center");
    nodeImg = this.doc.createElement("img");
    nodeImg.setAttribute("src", img);
    tmpNode.appendChild(nodeImg);

    return tmpNode;
}

/**
 * Returns a single newly created <tr> node which contains the relevent kingdom
 * table data in <td> columns. Used to replace the current <tr> node.
 */
vuuKingdomSortingHelper.prototype.createProvincesRow = function(aSortBy)
{
    var            nwpa = false;  // should there be a nwpa column
    var            nodeTR = this.doc.createElement("tr");
    var            tmpNode = null;
    var            tmpNode1 = null;
    var            i = 0;
    var            nodeImg = null;
    var            bookmark = null;
    var            kingdom = null;
    var            island = null;
    var            regex = /(\w|\s){1,20}\s\((\d{1,2}):(\d{1,2})\)/;
    var            regexResult = null;
    var            value = null;

    // set our sorting type and sort the provinces array by that type
    this.sortBy = aSortBy;

    // changing bookmarks can cause rebuilding to occur (for highlighting provinces).
    // However, the image should remain above the currently sorted column IF THERE
    // IS ONE, even if sorting by this.CURRENT
    if (gVUU.prefs.getBoolPref("vuuModifyKingdomSorting")) {

        value = this.doc.getElementById("vuu_comms_sorting").getAttribute("value");

        if (value.indexOf("Province") != -1)
            this.actualSortBy = this.PROVINCE;
        else if (value.indexOf("Race") != -1)
            this.actualSortBy = this.RACE;
        else if (value.indexOf("Land") != -1) // Land Acres
            this.actualSortBy = this.LAND;
        else if (value.indexOf("Net") != -1) // Net Worth
            this.actualSortBy = this.NETWORTH;
        else if (value.indexOf("NW") != -1) // NW / Acre
            this.actualSortBy = this.NWPA;
        else if (value.indexOf("Rank") != -1)
            this.actualSortBy = this.RANK;
    } else {
        this.actualSortBy = this.sortBy;
    }

    switch (aSortBy)
    {
        case this.PROVINCE: this.provinces.sort(vuuCompareProvinceNames); break;
        case this.RACE: this.provinces.sort(vuuCompareProvinceRaces); break;
        case this.LAND: this.provinces.sort(vuuCompareProvinceAcres); break;
        case this.NETWORTH: this.provinces.sort(vuuCompareProvinceNetworths); break;
        case this.NWPA: this.provinces.sort(vuuCompareProvinceNWPAs); break;
        case this.RANK: this.provinces.sort(vuuCompareProvinceRanks); break;
        case this.CURRENT: break;
    }

    // province name column
    tmpNode = this.doc.createElement("td");
    tmpNode.setAttribute("align", "Left");
    tmpNode.appendChild(this.doc.createTextNode(" "));
    tmpNode.appendChild(this.createSortImage(this.PROVINCE));

    for (i = 0; i < this.numProvinces; i++) {

        if (i != 0) {
            tmpNode.appendChild(this.doc.createElement("br"));
        }

        // if user preference for intel indication enabled then if any intel
        // is available then add the intel icon
        if (gVUU.prefs.getBoolPref("vuuModifyKingdomIntelIndication")) {

            if (this.provinces[i].cb) {
                nodeImg = this.doc.createElement("img");
                nodeImg.setAttribute("src", "chrome://vuu/skin/intel.png");
                nodeImg.setAttribute("style", "margin-right: 5px; cursor: help;");
                nodeImg.setAttribute("id", "vuu_intel_" + this.provinces[i].id);
                nodeImg.setAttribute("onmouseover",
                "vuuShowTooltip(this, event, '" + this.provinces[i].cb + "');");
                nodeImg.setAttribute("onmouseout", "vuuHideTooltip();");
                tmpNode.appendChild(nodeImg);
            }
        }

        // highlight bookmarked provinces
        if (gVUU.prefs.getBoolPref("allBookmarkingEnabled")) {
            regexResult = regex.exec(this.provinces[i].fullName);

            if (regexResult != null) {
                kingdom = parseInt(regexResult[2]);
                island = parseInt(regexResult[3]);
                bookmark = this.bookmarks.getProvinceBookmark(this.provinces[i].name, kingdom, island);

                if (bookmark != null) {
                    tmpNode1 = gVUUDOM.createColoredSpan(
                        this.doc, this.bookmarks.getColorFromType(bookmark.type), "*");
                    tmpNode.appendChild(tmpNode1);
                }
            }
        }

        tmpNode1 = gVUUDOM.createColoredSpan(this.doc, this.provinces[i].color, this.provinces[i].fullName);
        tmpNode1.setAttribute("id", "vuu_prov_" + this.provinces[i].id);
        tmpNode.appendChild(tmpNode1);
    }

    nodeTR.appendChild(tmpNode);

    // race column
    tmpNode = this.doc.createElement("td");
    tmpNode.setAttribute("align", "right");
    tmpNode.setAttribute("bgcolor", gVUUColors.DARK_GREY);
    tmpNode.appendChild(this.doc.createTextNode(" "));
    tmpNode.appendChild(this.createSortImage(this.RACE));

    for (i = 0; i < this.numProvinces; i++) {
        if (i != 0) {
            tmpNode.appendChild(this.doc.createElement("br"));
        }

        tmpNode.appendChild(this.doc.createTextNode(this.provinces[i].race));
    }
    nodeTR.appendChild(tmpNode);

    // acres column
    tmpNode = this.doc.createElement("td");
    tmpNode.setAttribute("align", "right");
    tmpNode.appendChild(this.doc.createTextNode(" "));
    tmpNode.appendChild(this.createSortImage(this.LAND));

    for (i = 0; i < this.numProvinces; i++) {
        if (i != 0) {
            tmpNode.appendChild(this.doc.createElement("br"));
        }

        if (parseInt(this.provinces[i].acres) > 0) {
            tmpNode.appendChild(this.doc.createTextNode(gVUUFormatter.fNum(this.provinces[i].acres)));
        } else {
            tmpNode.appendChild(this.doc.createTextNode(this.provinces[i].acres));
        }
    }

    nodeTR.appendChild(tmpNode);

    // networth column
    tmpNode = this.doc.createElement("td");
    tmpNode.setAttribute("align", "right");
    tmpNode.setAttribute("bgcolor", gVUUColors.DARK_GREY);
    tmpNode.appendChild(this.doc.createTextNode(" "));
    tmpNode.appendChild(this.createSortImage(this.NETWORTH));

    for (i = 0; i < this.numProvinces; i++) {
        if (i != 0) {
            tmpNode.appendChild(this.doc.createElement("br"));
        }

        if (parseInt(this.provinces[i].networth) > 0) {
            tmpNode.appendChild(this.doc.createTextNode(
                    gVUUFormatter.fNum(this.provinces[i].networth) + "gc"));
        } else {
            tmpNode.appendChild(this.doc.createTextNode(this.provinces[i].networth));
        }
    }

    nodeTR.appendChild(tmpNode);

    // nwpa column
    if (1 || gVUU.prefs.getBoolPref("vuuModifyKingdomNWPAColumn")) {
        nwpa = true;
        tmpNode = this.doc.createElement("td");
        tmpNode.setAttribute("align", "LEFT");
        tmpNode.appendChild(this.doc.createTextNode(" "));
        tmpNode.appendChild(this.createSortImage(this.NWPA));

        for (i = 0; i < this.numProvinces; i++) {

            if (i != 0) {
                tmpNode.appendChild(this.doc.createElement("br"));
            }

            if (parseInt(this.provinces[i].networth) > 0) {
                tmpNode.appendChild(this.doc.createTextNode(
                gVUUFormatter.fNum(this.provinces[i].nwpa) + "gc"));
            } else {
                tmpNode.appendChild(this.doc.createTextNode(this.provinces[i].nwpa));
            }
        }

        nodeTR.appendChild(tmpNode);
    }

    // rank column
    tmpNode = this.doc.createElement("td");
    tmpNode.setAttribute("align", "LEFT");

    if (nwpa) {
        tmpNode.setAttribute("bgcolor", gVUUColors.DARK_GREY);
    }

    tmpNode.appendChild(this.doc.createTextNode(" "));
    tmpNode.appendChild(this.createSortImage(this.RANK));

    for (i = 0; i < this.numProvinces; i++) {
        if (i != 0) {
            tmpNode.appendChild(this.doc.createElement("br"));
        }

        tmpNode.appendChild(this.doc.createTextNode(this.provinces[i].rank));
    }

    nodeTR.appendChild(tmpNode);
    this.doc.vuuProvinces = this.provinces;

    return nodeTR;
}


/****************************************************
*****************************************************
***** Province comparison functions
***** They can't be placed as part of the above objects or they won't work
***** properly as 'this.' will refer to the function, not the object
*****************************************************
****************************************************/

/**
 * Each of these functions take two province objects as arguments.
 *
 * The following are the properties of each province object
 * province.id
 * province.fullName
 * province.name
 * province.color
 * province.race
 * province.acres
 * province.networth
 * province.rank
 * province.rankNum
 * province.nwpa
 * province.cb
 */

/**
 * Compares two province object's acres. Sorts in descending order.
 * Order: highest acres -> '-' -> 'DEAD'
 */
function vuuCompareProvinceAcres(a, b)
{
    if (a.acres.indexOf("DEAD") != -1 && b.acres.indexOf("DEAD") != -1) {
        return vuuCompareProvinceNetworths(a, b);
    }

    if (a.acres.indexOf("DEAD") != -1) return 1;
    if (b.acres.indexOf("DEAD") != -1) return -1;

    if (a.acres.indexOf("-") != -1 && b.acres.indexOf("-") != -1) {
        return vuuCompareProvinceNetworths(a, b);
    }

    if (a.acres.indexOf("-") != -1) return 1;
    if (b.acres.indexOf("-") != -1) return -1;

    var            tmp = parseInt(b.acres) - parseInt(a.acres);

    if (tmp != 0) return tmp;

    return vuuCompareProvinceNetworths(a, b);
}

/**
 * Compares two province object's networths. Sorts in descending order.
 * Order: highest networth -> 'Small -> '-' -> 'DEAD'
 */
function vuuCompareProvinceNetworths(a, b)
{
    if (a.networth.indexOf("DEAD") != -1 && b.networth.indexOf("DEAD") != -1) {
        return vuuCompareProvinceNames(a, b);
    }

    if (a.networth.indexOf("DEAD") != -1) return 1;
    if (b.networth.indexOf("DEAD") != -1) return -1;

    if (a.networth.indexOf("-") != -1 && b.networth.indexOf("-") != -1) {
        return vuuCompareProvinceNames(a, b);
    }

    if (a.networth.indexOf("-") != -1) return 1;
    if (b.networth.indexOf("-") != -1) return -1;

    if (a.networth.indexOf("Small") != -1 && b.networth.indexOf("Small") != -1) {
        return vuuCompareProvinceNames(a, b);
    }

    if (a.networth.indexOf("Small") != -1) return 1;
    if (b.networth.indexOf("Small") != -1) return -1;

    var tmp = parseInt(b.networth) - parseInt(a.networth);

    if (tmp != 0) return tmp;

    return vuuCompareProvinceNames(a, b);
}

/**
 * Compares two province object's nwpas. Sorts in descending order.
 * Order: highest nwpa -> 'unknown' -> '-' -> 'DEAD'
 */
function vuuCompareProvinceNWPAs(a, b)
{
    var            nwpaA = "" + a.nwpa;
    var            nwpaB = "" + b.nwpa;

    if (nwpaA.indexOf("DEAD") != -1 && nwpaB.indexOf("DEAD") != -1) {
        return vuuCompareProvinceNetworths(a, b);
    }

    if (nwpaA.indexOf("DEAD") != -1) return 1;
    if (nwpaB.indexOf("DEAD") != -1) return -1;

    if (nwpaA.indexOf("-") != -1 && nwpaB.indexOf("-") != -1) {
        return vuuCompareProvinceNetworths(a, b);
    }

    if (nwpaA.indexOf("-") != -1) return 1;
    if (nwpaB.indexOf("-") != -1) return -1;

    if (nwpaA.indexOf("unknown") != -1 && nwpaB.indexOf("unknown") != -1) {
        return vuuCompareProvinceNetworths(a, b);
    }

    if (nwpaA.indexOf("unknown") != -1) return 1;
    if (nwpaB.indexOf("unknown") != -1) return -1;

    var            tmp = b.nwpa - a.nwpa;

    if (tmp != 0) return tmp;

    return vuuCompareProvinceNetworths(a, b);
}

/**
 * Compares two province objects races. Sorts in descending order.
 * Order ignores online and inactivity indicators (* and +)
 */
function vuuCompareProvinceRaces(a, b)
{
    var            tmp1 = a.race;
    var            tmp2 = b.race;

    if (tmp1.indexOf("*") != -1) tmp1 = tmp1.substring(1);
    if (tmp2.indexOf("*") != -1) tmp2 = tmp2.substring(1);
    if (tmp1.indexOf("+") != -1) tmp1 = tmp1.substring(1);
    if (tmp2.indexOf("+") != -1) tmp2 = tmp2.substring(1);

    if (tmp1 < tmp2) {
        return -1;
    } else if (tmp2 < tmp1) {
        return 1;
    } else {
        return vuuCompareProvinceNetworths(a, b);
    }
}

/**
 * Compares two province objects names. Sorts in ascending order.
 * Order: activated provinces -> awaiting activation -> unclaimed
 */
function vuuCompareProvinceNames(a, b)
{
    // unclaimed
    if (a.name.indexOf("- U") != -1) return 1;
    if (b.name.indexOf("- U") != -1) return -1;

    // awaiting activation
    if (a.name.indexOf("- A") != -1) return 1;
    if (b.name.indexOf("- A") != -1) return -1;

    var    ignorecase = gVUU.prefs.getBoolPref("vuuModifyKingdomSortIG");

    if (ignorecase == false ) {
        if (a.name < b.name) {
            return -1;
        } else if (b.name < a.name) {
            return 1;
        } else {
            return 0;
        }
    } else {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;
        } else if (b.name.toLowerCase() < a.name.toLowerCase()) {
            return 1;
        } else {
            return 0;
        }
    }
}

/**
 * Compares two province objects acres. Sorts in descending order.
 * Order: highest rank (female higher than equivelent male) -> 'DEAD'
 */
function vuuCompareProvinceRanks(a, b)
{
    if (a.rank.indexOf("DEAD") != -1 && b.rank.indexOf("DEAD") != -1) {
        return vuuCompareProvinceNetworths(a, b);
    }

    if (a.rank.indexOf("DEAD") != -1) return 1;
    if (b.rank.indexOf("DEAD") != -1) return -1;

    var            tmp = b.rankNum - a.rankNum;

    if (tmp != 0) return tmp;

    return vuuCompareProvinceNetworths(a, b);
}
