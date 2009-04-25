/**
 * Written by Anthony Gabel on 16 November 2004.
 *
 * Performs required modifications to the Throne page:
 *  - Adds the cached monarch message to the page
 *  - Adds various per acre values to the information table
 *  - Caches the current utopian date, kingdom and island numbers, acres
 *    and province name
 *  - Marks that this page has loaded and calls the free income
 *    highlighting routine which performs highlighting if necessary
 *
 * Requires:
 *  vuuOverlay.js
 *  vuuRules.js
 *  dom_manipulation.js
 *  formatter.js
 */


/**
 * Constructor for a 'vuuPMThrone' object. Used to modify the Throne page.
 * param:  aDoc - HTMLDocument - Throne page to modify
 */
function vuuPMThrone(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.rules = gVUURules.getRulesByHrefID(this.server.hrefID);
    this.debug = true;
    this.color = gVUUColors.TITLE_BAR_BLUE;

    this.info = new Object();
    this.info.acres = null;
    this.info.soldiers = null;
    this.info.offspecs = null;
    this.info.defspecs = null;
    this.info.elites = null;
    this.info.thieves = null;
    this.info.wizards = null;
    this.info.warhorses = null;
    this.info.prisoners = null;
    this.info.offpoints = null;
    this.info.defpoints = null;
	this.info.racesx = null;
}

/**
 * Performs any required modifications to the Throne page by directly
 * modifying its DOM.
 */
vuuPMThrone.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    // Search for this element because the 'security check' page has the same URL
    // as the Throne page and we only want to modify the Throne page.
    if ((tmpNode = gVUUDOM.getDescendentTextNode(
        this.body, "The Province of", 1, "e00002")) != null) {

        this.cacheData();

        // set up for free income highlighting which will only occur when both this page
        // and the links page have loaded
        gVUU.pageLoadedThrone = true;
        gVUU.updateFreeIncomeHighlightSingle();

        if (gVUU.prefs.getBoolPref("vuuModifyThronePerAcreValues")) {
            this.addPerAcreValues();
        }

        if (gVUU.prefs.getBoolPref("vuuModifyThroneMonarchMessage")) {
            this.addMonarchMessage();
        }
    }
}

/**
 * Modifies the throne table to include various per acre values.
 */
vuuPMThrone.prototype.addPerAcreValues = function ()
{
    var            tmpNode_1 = null;
    var            tmpNode_2 = null;
    var            tmpNode_3 = null;

    var            tmpNode = null;
    var            tmpNode1 = null;

    // Points to whole lowwest level throne page.
    tmpNode = gVUUDOM.getDescendentTextNode(this.body, "The Province of", 1, "e00006");

    // Points to whole lowest level throne page.
    tmpNode_1 = tmpNode.parentNode.parentNode.parentNode;

    // Make the Kingdomm header little more broader
    tmpNode_1.parentNode.setAttribute("width", "130%");

    // change column header to span new column
    // So that Name of province remains centrally alligned.
    gVUUDOM.getDescendentElement(tmpNode_1, "th", 1).setAttribute("colspan", "7");

    /* May this should work..*/
    tmpNode_2 = gVUUDOM.getChildElement(tmpNode_1, "tr", 2, "e00125");
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.appendChild(this.doc.createTextNode(""));
    tmpNode_2.appendChild(tmpNode1);

    tmpNode_2 = gVUUDOM.getChildElement(tmpNode_1, "tr", 3, "e00125");
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.appendChild(this.doc.createTextNode(" : "  +
                         (this.info.offspecs / this.info.acres).toFixed(2) + " oPA"));
    tmpNode_2.appendChild(tmpNode1);

    tmpNode_2 = gVUUDOM.getChildElement(tmpNode_1, "tr", 4, "e00125");
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.appendChild(this.doc.createTextNode(" : " +
                         (this.info.defspecs / this.info.acres).toFixed(2) + " dPA"));
    tmpNode_2.appendChild(tmpNode1);

    tmpNode_2 = gVUUDOM.getChildElement(tmpNode_1, "tr", 5, "e00125");
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.appendChild(this.doc.createTextNode(" : " +
                         (this.info.elites / this.info.acres).toFixed(2) + " EPA"));
    tmpNode_2.appendChild(tmpNode1);

    tmpNode_2 = gVUUDOM.getChildElement(tmpNode_1, "tr", 6, "e00125");
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.appendChild(this.doc.createTextNode(" : " +
                         this.rules.thievery.calcRawTPA(this.info).toFixed(2) + " TPA"));
    tmpNode_2.appendChild(tmpNode1);

    tmpNode_2 = gVUUDOM.getChildElement(tmpNode_1, "tr", 7, "e00125");
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.appendChild(this.doc.createTextNode(" : " +
                         (this.info.wizards / this.info.acres).toFixed(2) + " WPA"));
    tmpNode_2.appendChild(tmpNode1);

    tmpNode_2 = gVUUDOM.getChildElement(tmpNode_1, "tr", 8, "e00125");
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.appendChild(this.doc.createTextNode(""));
    tmpNode_2.appendChild(tmpNode1);

    tmpNode_2 = gVUUDOM.getChildElement(tmpNode_1, "tr", 9, "e00125");
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.appendChild(this.doc.createTextNode(""));
    tmpNode_2.appendChild(tmpNode1);

    tmpNode_2 = gVUUDOM.getChildElement(tmpNode_1, "tr", 10, "e00125");
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.appendChild(this.doc.createTextNode(" : " +
                         (this.info.offpoints / this.info.acres).toFixed(2) + " OPA"));
    tmpNode_2.appendChild(tmpNode1);

    tmpNode_2 = gVUUDOM.getChildElement(tmpNode_1, "tr", 11, "e00125");
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.appendChild(this.doc.createTextNode(" : " +
                         (this.info.defpoints / this.info.acres).toFixed(2) + " DPA"));
    tmpNode_2.appendChild(tmpNode1);

    // change the color of throne page to RED if there is war.
    tmpNode_2 = gVUUDOM.getDescendentTextNode(this.body, "Our Kingdom is at ", 1, "e00006");

    tmpNode_3 = gVUUDOM.getDescendentElement(tmpNode_1, "th", 1);
    tmpNode_3.removeAttribute("class");

    if (tmpNode_2) {
        MpDebug(this.debug, "Found War header");
        this.color = gVUUColors.TITLE_BAR_RED;
    } else {
        MpDebug(this.debug, "War Header not found");
    }

    tmpNode_3.setAttribute("bgcolor", this.color);
}

/**
 * Adds the monarch message to the throne page.
 */
vuuPMThrone.prototype.addMonarchMessage = function ()
{
    var            tmpNode = null;
    var            tmpNode1 = null;
    var            tblHdr = null;
    var            nodeTD = null;
    var            nodeMessageTable = null;
    var            nodeMessageInnerTable = null;

    nodeTD = gVUUDOM.getDescendentTextNode(this.body, "The Province of", 1, "e00017")
        .parentNode.parentNode.parentNode.parentNode
        .parentNode.parentNode.parentNode.parentNode;

    // create table
    nodeMessageTable = this.doc.createElement("table");
    nodeMessageTable.setAttribute("border", "1");
    nodeMessageTable.setAttribute("cellpadding", "0");
    nodeMessageTable.setAttribute("cellspacing", "0");
    nodeMessageTable.setAttribute("width", "550");

    tmpNode = this.doc.createElement("tr");
    nodeMessageTable.appendChild(tmpNode);
    tmpNode1 = this.doc.createElement("td");
    tmpNode.appendChild(tmpNode1);
    nodeMessageInnerTable = this.doc.createElement("table");
    nodeMessageInnerTable.setAttribute("width", "100%");
    tmpNode1.appendChild(nodeMessageInnerTable);

    // create table title - Message from Our Monarch...
    tmpNode = this.doc.createElement("tr");
    nodeMessageInnerTable.appendChild(tmpNode);
    tblHdr = this.doc.createElement("th");
    tblHdr.setAttribute("bgcolor", this.color);
    tblHdr.textContent = "Message from our Monarch";
    tmpNode.appendChild(tblHdr);

    // create table content - the actual message
    tmpNode = this.doc.createElement("tr");
    nodeMessageInnerTable.appendChild(tmpNode);
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.setAttribute("align", "center");
    tmpNode1.setAttribute("bgcolor", gVUUColors.DARK_GREY);

    if (this.server.cache.monarchMessage) {
        tmpNode1.textContent = this.server.cache.monarchMessage;
    } else if (this.server.cache.lastMonarchMessage) {
        tblHdr.textContent = tblHdr.textContent + " [Saved Message. Not Updated!!!]";
        tmpNode1.textContent = this.server.cache.lastMonarchMessage;
    } else {
        tmpNode1.textContent = "Monarch message not set, Logout and login again.";
    }

    tmpNode.appendChild(tmpNode1);

    // append the table to the throne page
    nodeTD.parentNode.insertBefore(nodeMessageTable, nodeTD);
    nodeTD.parentNode.insertBefore(this.doc.createElement("br"), nodeTD);
}

/**
 * Caches any required data from the page.
 */
vuuPMThrone.prototype.cacheData = function ()
{
    var            tmpNode = null;
    var            tmpNode1 = null;
    var            tmpNode2 = null;
    var            tmpNode3 = null;
    var            regex = null;
    var            regexResult = null
    var            tmpIndex1 = null;
    var            tmpIndex2 = null;

    tmpNode = gVUUDOM.getDescendentTextNode(this.body, "The Province of", 1, "e00002");

    // cache province name
    tmpNode1 = gVUUDOM.getChildElement(tmpNode.parentNode, "font", 1, "e00127");
    this.server.cache.provinceName = tmpNode1.textContent.substring(0, tmpNode1.textContent.indexOf(" ("));

    // cache the current date
    regex = / as of ([a-zA-Z]+) (\d{1,2})[a-z]{2}, YR(\d{1,2})/;
    regexResult = regex.exec(gVUUDOM.getChildTextNodeText(tmpNode.parentNode, 2, "e00003"));
    this.server.cache.dateMonth = regexResult[1];
    this.server.cache.dateDay = regexResult[2];
    this.server.cache.dateYear = regexResult[3];

    // cache kingdom & island num
    tmpNode1 = gVUUDOM.getDescendentTextNode(tmpNode.parentNode, " (", 1, "e00004").textContent;
    tmpIndex1 = tmpNode1.indexOf(" (");
    tmpIndex2 = tmpNode1.indexOf(":");
    this.server.cache.kingdom = tmpNode1.substring(tmpIndex1 + 2, tmpIndex2);
    tmpIndex1 = tmpNode1.indexOf(")");
    this.server.cache.island = tmpNode1.substring(tmpIndex2 + 1, tmpIndex1);
	
    // cache province specific values like acres, soldiers, offspecs, defspecs, elites etc

    tmpNode1 = tmpNode.parentNode.parentNode.parentNode;

    // soldiers.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 2, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 5, "e00125");
    this.info.soldiers = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);

    // offspecs.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 3, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 5, "e00125");
    this.info.offspecs = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);

    // acres.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 4, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 2, "e00125");
    var  acres = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);
    this.info.acres = acres.substring(0, acres.indexOf(" Acres"));
    this.server.cache.acres = this.info.acres;
	
    // defspecs.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 4, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 5, "e00125");
    this.info.defspecs = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);
    this.server.cache.defspecs = this.info.defspecs;

    // eleets.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 5, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 5, "e00125");
    this.info.elites = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);

    // theives.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 6, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 5, "e00125");
    var  thieves = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);
    this.info.thieves = thieves.substring(0, thieves.indexOf(" ("));

    // wizards.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 7, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 5, "e00125");
    var    wizards = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);
    this.info.wizards = wizards.substring(0, wizards.indexOf(" ("));

    // war horses.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 8, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 5, "e00125");
    this.info.warhorses = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);

    // prisoners.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 9, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 5, "e00125");
    this.info.prisoners = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);

    // off points.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 10, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 5, "e00125");
    this.info.offpoints = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);

    // def points.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 11, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 5, "e00125");
    this.info.defpoints = gVUUFormatter.removeCommas(tmpNode3.firstChild.nodeValue);

	// cache races.
    tmpNode2 = gVUUDOM.getChildElement(tmpNode1, "tr", 2, "e00125");
    tmpNode3 = gVUUDOM.getChildElement(tmpNode2, "td", 2, "e00125");
	this.info.racesx = tmpNode3.firstChild.nodeValue;
    this.server.cache.racesx = this.info.racesx;
	
    MpDebug(this.debug, "Acres : " + this.info.acres);
    MpDebug(this.debug, "Soldiers : " + this.info.soldiers);
    MpDebug(this.debug, "Off specs :  " + this.info.offspecs);
    MpDebug(this.debug, "Def specs : " + this.info.defspecs);
    MpDebug(this.debug, "Eleets :  " + this.info.elites);
    MpDebug(this.debug, "Theives : " + this.info.thieves);
    MpDebug(this.debug, "Wizards : " + this.info.wizards);
    MpDebug(this.debug, "War Horses  : " + this.info.warhorses);
    MpDebug(this.debug, "Prisoners : " + this.info.prisoners);
    MpDebug(this.debug, "Off points : " + this.info.offpoints);
    MpDebug(this.debug, "Def points : " + this.info.defpoints);
	MpDebug(this.debug, "Races : " + this.info.racesx);

    // cache current time
    tmpNode = gVUUDOM.getDescendentTextNode(this.body, "Game Time: ", 1, "e00005");

    if (tmpNode) {
        var  str = gVUUDOM.getAllText(window, tmpNode.parentNode, "e00006");
        MpDebug(this.debug, "str found:'" + str + "'");
        //Game Time: June 7th, YR3 - Clock Time: 6:50 AM
        regex = /Game Time:\s*([a-zA-Z0-9\s,]*)\s*-\s*Clock Time:\s*(\d+):(\d+)\s*([AP]M)\s*(.*)\s*/;
        regexResult = regex.exec(str);
        MpDebug(this.debug, "\nCurrent Day: '" + regexResult[1] + "'\nCurrent Time: '"
                + regexResult[2] + " : " + regexResult[3] + " " + regexResult[4] + "'");
        var  newStr = "Game Time: " + regexResult[1] + "- Clock Time: " + regexResult[2] + " : "
                      + regexResult[3] + " " + regexResult[4];
        MpDebug(this.debug, "New Date String :'" + newStr + "'");
        tmpNode.textContent = newStr;
    } else {
        MpDebug(this.debug, "Time string not found");
    }

    return;
}
