/**
 * Written by Anthony Gabel on 11 July 2005.
 *
 * Performs required modifications to the Relations page:
 * - Colour codes kingdom relations
 * - Converts kingdom relations into links to the appropriate kingdom
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMRelations' object. Used to modify the Relations page.
 * param:  aDoc - HTMLDocument - Relations page to modify
 */
function vuuPMRelations(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.debug = false;

    this.COLOR_UNFRIENDLY = gVUUColors.WHITE;
    this.COLOR_HOSTILE = gVUUColors.GOLD;
    this.COLOR_WAR = gVUUColors.LIGHT_RED;
    this.COLOR_CEASEFIRE = gVUUColors.LIGHT_GREEN;
    this.COLOR_YOU = gVUUColors.AQUA;
    this.COLOR_UNKNOWN = gVUUColors.WHITE;

    this.YOU = "X";
    this.UNFRIENDLY = "U";
    this.HOSTILE = "H";
    this.WAR = "W";
    this.CEASEFIRE = "C";
    this.relations = new Array();
}

/**
 * Performs any required modifications to the Relations page by directly
 * modifying its DOM.
 */
vuuPMRelations.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;
    MpDebug(this.debug, "Trying to modify relation table");

    /*
    // Not needed now since swirve is doing it currently.
    if (gVUU.prefs.getBoolPref("modRelationsFormatTable")) {
        this.getRelations();
        this.replaceRelationsTable();
    }
    */

    MpDebug(this.debug, "Modification of relation table completed successfully");
}

/**
 * Retrieves the current relations that a kingdom has with all other kingdoms
 * on the server.
 */
vuuPMRelations.prototype.getRelations = function ()
{
    var            numKingdoms = 0;
    var            kingdom = 1;
    var            island = 1;
    var            i = 0;
    var            oldText = null;
    var            curChar = null;
    var            kingdomData = null;
    var            tmpNode = null;
    var            nodeTBody = null;
    var            oldNode = null;
    var            nodeTR = null;

    nodeTBody = gVUUDOM.getDescendentTextNode(
                        this.doc, "Island", 1, "e00037").parentNode.parentNode.parentNode;

    nodeTBody = gVUUDOM.getChildElement(nodeTBody, "tr", 2, "e00038");
    nodeTBody = gVUUDOM.getChildElement(nodeTBody, "td", 2, "e00039");
    nodeTBody = gVUUDOM.getDescendentElement(nodeTBody, "tbody", 1, "e00040");

    // get the total number of kingdoms listed (2 TR's are header and footer)
    for (tmpNode = nodeTBody.firstChild; tmpNode != null; tmpNode = tmpNode.nextSibling) {

        // nodeType 1 = Node.ELEMENT
        if (tmpNode.nodeType == 1 && tmpNode.tagName.toLowerCase() == "tr") {
            numKingdoms++;
        }
    }

    numKingdoms -= 2;
    nodeTR = gVUUDOM.getChildElement(nodeTBody, "tr", 2, "e00044");

    // while a TR with kingdom data
    // Each row will be a single <pre> formatted string with all relations for
    // a certain kingdom number across all islands.
    // For Genesis there is an extra FONT tag
    while (kingdom <= numKingdoms) {
        oldNode = gVUUDOM.getDescendentElement(nodeTR, "pre", 1, "e00046");
        // Genesis only has an extra "font" element

        if (oldNode.firstChild.nodeType == 1 && oldNode.firstChild.tagName.toLowerCase() == "font") {
            oldNode = oldNode.firstChild;
        }

        oldText = oldNode.firstChild.nodeValue;
        island = 0;

        for (i = 0; i < oldText.length; i++) {
            curChar = oldText.charAt(i);

            if (curChar == this.UNFRIENDLY || curChar == this.HOSTILE
                || curChar == this.WAR ||  curChar == this.CEASEFIRE) {

                island++;
                kingdomData = new Object();
                kingdomData.relation = curChar;
                kingdomData.kingdom = kingdom;
                kingdomData.island = island;
                this.relations.push(kingdomData);
            } else if (curChar == "-" || curChar == "." || curChar == this.YOU) {
                island++;
            }
        }

        kingdom++;
        nodeTR = gVUUDOM.getChildElement(nodeTBody, "tr", kingdom + 1, "e00048");
    }
}

/**
 * Creates a new relations table and replaces the existing relations table.
 */
vuuPMRelations.prototype.replaceRelationsTable = function ()
{
    var            i = 0;

    var            unfriendly = 0;
    var            hostile = 0;
    var            ceasefire = 0;

    var            kingdomData = null;

    var            nodeTHUnfriendly = null;
    var            nodeFontUnfriendly = null;
    var            nodeTHHostile = null;
    var            nodeFontHostile = null;
    var            nodeTHCeasefire = null;
    var            nodeFontCeaseFire = null;

    var            nodeTable = null;
    var            nodeTBody = null;
    var            nodeTmp1 = null;
    var            nodeTmp2 = null;

    nodeTable = this.doc.createElement("table");
    nodeTable.setAttribute("style", "border-spacing: 50px 20px");
    nodeTBody = this.doc.createElement("tbody");
    nodeTable.appendChild(nodeTBody);

    if (this.relations.length == 1 && this.relations[0].relation == this.WAR) {
        kingdomData = this.relations[0];

        nodeTmp1 = this.doc.createElement("tr");
        nodeTmp2 = this.doc.createElement("th");
        //nodeTmp2.textContent = "War";
        nodeTmp2.appendChild(this.doc.createTextNode("War"));
        nodeTmp2.setAttribute("style", "color: "
                + this.relationToColor(this.WAR) + "; border-bottom: solid;");

        nodeTmp1.appendChild(nodeTmp2);
        nodeTBody.appendChild(nodeTmp1);

        nodeTmp1 = this.doc.createElement("tr");
        nodeTBody.appendChild(nodeTmp1);

        nodeTmp2 = this.doc.createElement("td");
        nodeTmp1.appendChild(nodeTmp2);

        nodeTmp1 = this.doc.createElement("font");
        nodeTmp1.setAttribute("color", this.relationToColor(this.WAR));
        //nodeTmp1.textContent = "(" + kingdomData.kingdom + ":" + kingdomData.island + ")";
        nodeTmp1.appendChild(this.doc.createTextNode("(" + kingdomData.kingdom + ":"
                + kingdomData.island + ")"));

        nodeTmp2.appendChild(nodeTmp1);
    } else {
        this.relations.sort(vuuRelationsCompareKingdoms);

        nodeTmp1 = this.doc.createElement("tr");
        nodeTHUnfriendly = this.doc.createElement("th");
        nodeTHUnfriendly.setAttribute("style", "color: "
            + this.relationToColor(this.UNFRIENDLY) + "; border-bottom: solid;");

        nodeTHUnfriendly.setAttribute("width", "33%");
        nodeTmp1.appendChild(nodeTHUnfriendly);
        nodeTHHostile = this.doc.createElement("th");
        nodeTHHostile.setAttribute("style", "color: "
            + this.relationToColor(this.HOSTILE) + "; border-bottom: solid;");

        nodeTHHostile.setAttribute("width", "34%");
        nodeTmp1.appendChild(nodeTHHostile);
        nodeTHCeasefire = this.doc.createElement("th");
        nodeTHCeasefire.setAttribute("style", "color: "
            + this.relationToColor(this.CEASEFIRE) + "; border-bottom: solid;");

        nodeTHCeasefire.setAttribute("width", "33%");
        nodeTmp1.appendChild(nodeTHCeasefire);

        nodeTBody.appendChild(nodeTmp1);

        nodeTmp1 = this.doc.createElement("tr");

        nodeTmp2 = this.doc.createElement("td");
        nodeFontUnfriendly = this.doc.createElement("font");
        nodeFontUnfriendly.setAttribute("color", this.relationToColor(this.UNFRIENDLY));
        nodeTmp1.appendChild(nodeTmp2);
        nodeTmp2.appendChild(nodeFontUnfriendly);

        nodeTmp2 = this.doc.createElement("td");
        nodeFontHostile = this.doc.createElement("font");
        nodeFontHostile.setAttribute("color", this.relationToColor(this.HOSTILE));
        nodeTmp1.appendChild(nodeTmp2);
        nodeTmp2.appendChild(nodeFontHostile);

        nodeTmp2 = this.doc.createElement("td");
        nodeFontCeaseFire = this.doc.createElement("font");
        nodeFontCeaseFire.setAttribute("color", this.relationToColor(this.CEASEFIRE));
        nodeTmp1.appendChild(nodeTmp2);
        nodeTmp2.appendChild(nodeFontCeaseFire);

        nodeTBody.appendChild(nodeTmp1);

        for (i = 0; i < this.relations.length; i++) {
            kingdomData = this.relations[i];

            if (kingdomData.relation == this.UNFRIENDLY) {
                nodeTmp1 = nodeFontUnfriendly;
                unfriendly++;
            } else if (kingdomData.relation == this.HOSTILE) {
                nodeTmp1 = nodeFontHostile;
                hostile++;
            } else if (kingdomData.relation == this.CEASEFIRE) {
                nodeTmp1 = nodeFontCeaseFire;
                ceasefire++;
            }

            if (nodeTmp1.firstChild != null) {
                nodeTmp1.firstChild.nodeValue += " (" + kingdomData.kingdom + ":"
                                + kingdomData.island + ")";
            } else {
                nodeTmp1.appendChild(this.doc.createTextNode(" (" + kingdomData.kingdom + ":"
                                + kingdomData.island + ")"));
            }
        }

        //nodeTHUnfriendly.textContent = "Unfriendly (" + unfriendly + ")";
        //nodeTHHostile.textContent = "Hostile (" + hostile + ")";
        //nodeTHCeasefire.textContent = "Ceasefire (" + ceasefire + ")";

        nodeTHUnfriendly.appendChild(this.doc.createTextNode("Unfriendly (" + unfriendly + ")"));
        nodeTHHostile.appendChild(this.doc.createTextNode("Hostile (" + hostile + ")"));
        nodeTHCeasefire.appendChild(this.doc.createTextNode("Ceasefire (" + ceasefire + ")"));
    }

    nodeTmp1 = gVUUDOM.getDescendentTextNode(this.body,
        "Island", 1, "e00135").parentNode.parentNode.parentNode.parentNode.parentNode;

    nodeTmp2 = this.doc.createElement("p");
    nodeTmp1.parentNode.replaceChild(nodeTmp2, nodeTmp1);

    nodeTmp1 = gVUUDOM.getDescendentTextNode(this.body,
        "- = No Relations", 1, "e00136").parentNode.parentNode.parentNode.parentNode.parentNode;

    nodeTmp1.parentNode.replaceChild(nodeTable, nodeTmp1);
}

/**
 * Returns the colour code that applies to the given relations character
 * Current relations characters: U, H, W, C, X
 * param:  aChar - character - Relations character to convert to a colour code
 * return: String - colour code derived from relations character
 */
vuuPMRelations.prototype.relationToColor = function(aChar)
{
    var            retVal = null;

    if (aChar == this.UNFRIENDLY) {
        retVal = this.COLOR_UNFRIENDLY;
    } else if (aChar == this.HOSTILE) {
        retVal = this.COLOR_HOSTILE;
    } else if (aChar == this.WAR) {
        retVal = this.COLOR_WAR;
    } else if (aChar == this.CEASEFIRE) {
        retVal = this.COLOR_CEASEFIRE;
    } else if (aChar == this.YOU) {
        retVal = this.COLOR_YOU;
    } else {
        retVal = this.COLOR_UNKNOWN;
    }

    return retVal;
}

/**
 * Compares two kingdom bookmarks. Sorts in ascending order.
 */
function vuuRelationsCompareKingdoms(a, b)
{
    if (a.island == b.island) {
        return a.kingdom - b.kingdom;
    } else if (a.island > b.island) {
        return 1;
    } else {
        return -1;
    }
}
