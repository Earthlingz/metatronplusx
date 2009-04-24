/**
 * Written by Anthony Gabel on 12 November 2004.
 *
 * Performs required modifications to the Growth page:
 *  - Adds a growth summary to the top of the growth table
 *  - Adds a 'total' column (with %'s) to the growth table
 *  - Caches current acres
 *
 * Requires:
 *  vuuOverlay.js
 *  vuuRules.js
 *  dom_manipulation.js
 *  formatter.js
 */


/**
 * Constructor for a 'vuuPMGrowth' object. Used to modify the Growth page.
 * param:  aDoc - HTMLDocument - Growth page to modify
 */
function vuuPMGrowth(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.rules = gVUURules.getRulesByHrefID(this.server.hrefID);

    this.info = new Object();
    this.info.money = null;
    this.info.buildTime = null;
    this.info.buildCost = null;
    this.info.buildCredits = "0";
    this.info.acres = null;                   // Total Number of acres.
    this.info.availableAcres = null;          // Total Number of free available land barren Land.
    this.info.canBuild = null;                // Total Number pf acres can be built.
    this.info.canAccelBuild = null;           // Total accelerated constructed acres.
    this.info.razeCost = null;
    this.info.canRaze = null;                 // Number of acres can be destroyed.
    this.info.canRazeBuild = null;            // Number of acres can be destroyed and rebuilt.
    this.info.canRazeAccelBuild = null;       // Number of acres can be destroyed and acc. rebuilt.
}

/**
 * Performs any required modifications to the Growth page by directly
 * modifying its DOM.
 */
vuuPMGrowth.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    this.calcValues();

    // cache current acres
    this.server.cache.acres = this.info.acres;

    if (gVUU.prefs.getBoolPref("vuuModifyGrowthSummary")) {
        this.modifyHeaderSummary();
    }

    if (gVUU.prefs.getBoolPref("vuuModifyGrowthTablePercents")) {
        this.modifyTablePercents();
    }
}

/**
 * Calculates values required for modifying growth page. Calculates (this.info.):
 * money, buildTime, buildCost, buildCredits, acres, canBuild, availAcres,
 * canAccelBuild, razeCost, canRaze, canRazeBuild, canRazeAccelBuild
 */
vuuPMGrowth.prototype.calcValues = function ()
{
    var            headerNode = null;
    var            tmpNode = null;

    // get current money - if user has just built then we want the second 'Money: ' node
    // otherwise we want the first (and only) one
    tmpNode = gVUUDOM.getDescendentTextNode(this.body, "Money: ", 2, "e00071");

    if (tmpNode == null) {
        tmpNode = gVUUDOM.getDescendentTextNode(this.body, "Money: ", 1, "e00072");
    }

    this.info.money = tmpNode.parentNode.textContent;
    this.info.money = this.info.money.substring(
        this.info.money.indexOf("Money: ") + 7, this.info.money.indexOf("gc"));
    this.info.money = parseInt(gVUUFormatter.removeCommas(this.info.money));

    // get header node
    headerNode = gVUUDOM.getDescendentTextNode(this.body, "Construction Time:", 1, "e00073");
    headerNode = headerNode.parentNode.parentNode.parentNode;

    // get build time
    tmpNode = gVUUDOM.getDescendentElement(headerNode, "font", 1, "e00074");
    this.info.buildTime = tmpNode.textContent;
    this.info.buildTime = parseInt(gVUUFormatter.removeCommas(this.info.buildTime));

    // get build cost
    tmpNode = gVUUDOM.getDescendentElement(headerNode, "font", 2, "e00075");
    this.info.buildCost = tmpNode.textContent.substring(0, tmpNode.textContent.indexOf("gc"));
    this.info.buildCost = parseInt(gVUUFormatter.removeCommas(this.info.buildCost));

    // get acres and available acres (caching current acres)
    tmpNode = gVUUDOM.getDescendentElement(headerNode, "font", 3, "e00076");
    this.info.acres = tmpNode.textContent;
    this.info.acres = parseInt(gVUUFormatter.removeCommas(this.info.acres));

    // get can Un built buildings count
    tmpNode = gVUUDOM.getDescendentElement(headerNode, "font", 4, "e00077");
    this.info.availableAcres = tmpNode.textContent;
    this.info.availableAcres = parseInt(gVUUFormatter.removeCommas(this.info.availableAcres));

    // if there are any credits, get credits
    tmpNode = gVUUDOM.getDescendentElement(headerNode, "font", 5, "e00078");
    this.info.buildCredits = tmpNode.textContent;
    this.info.buildCredits = parseInt(gVUUFormatter.removeCommas(this.info.buildCredits));

    // can built X buildings count from utopia.
 //   tmpNode = gVUUDOM.getDescendentElement(headerNode, "font", 6, "e00079");
 //   this.info.canBuild = tmpNode.textContent;
    this.info.canBuild = Math.floor(this.info.money / (this.info.buildCost)) +
                         Math.floor(this.info.buildCredits);

    if (this.info.canBuild > this.info.availableAcres) {
        this.info.canBuild = this.info.availableAcres;
    }
//    this.info.canBuild = parseInt(gVUUFormatter.removeCommas(this.info.canBuild));

    // calculate other costs
    // accelerated build should have a maximum of available acres
    // (and include building credits)
    this.info.canAccelBuild = Math.floor(this.info.money / (2 * this.info.buildCost))
        + Math.floor(this.info.buildCredits / 2);
    if (this.info.canAccelBuild > this.info.availableAcres)
        this.info.canAccelBuild = this.info.availableAcres;

    this.info.razeCost = this.rules.growth.getRazeCost(this.info);
    this.info.canRaze = Math.floor(this.info.money / this.info.razeCost);

    if (this.info.canRaze > (parseInt(this.info.acres) - parseInt(this.info.availableAcres))) {
        this.info.canRaze = (parseInt(this.info.acres) - parseInt(this.info.availableAcres));
    }

    // don't include credits in this.info.canRazeBuild and this.info.canRazeAccelBuild
    this.info.canRazeBuild = Math.floor(this.info.money/(this.info.buildCost + this.info.razeCost));

    if (this.info.canRazeBuild > this.info.canRaze) {
        this.info.canRazeBuild = this.info.canRaze;
    }

    this.info.canRazeAccelBuild = Math.floor(this.info.money/((2*this.info.buildCost) + this.info.razeCost));

    if (this.info.canRazeAccelBuild > this.info.canRaze) {
        this.info.canRazeAccelBuild = this.info.canRaze;
    }

    return;
}

/**
 * Calculates values FOR GENESIS ONLY required for modifying growth page.
 */
vuuPMGrowth.prototype.calcValuesGenesis = function ()
{
    var        nodeHeader = null;
    var        tmpNode = null;

    // get current money - if user has just built then we want the second 'Money: ' node
    // otherwise we want the first (and only) one
    tmpNode = gVUUDOM.getDescendentTextNode(this.body, "Money: ", 2, "e00081");

    if (tmpNode == null) {
        tmpNode = gVUUDOM.getDescendentTextNode(this.body, "Money: ", 1, "e00082");
    }

    this.info.money = tmpNode.parentNode.textContent;
    this.info.money = this.info.money.substring(
        this.info.money.indexOf("Money: ") + 7, this.info.money.indexOf("gc"));
    this.info.money = parseInt(gVUUFormatter.removeCommas(this.info.money));

    // get header node
    var        nodeHeader = null;
    nodeHeader = gVUUDOM.getDescendentTextNode(this.body,
        "As you well know,", 1, "e00083").parentNode;

    // get build time
    tmpNode = gVUUDOM.getChildElement(nodeHeader, "font", 1);
    this.info.buildTime = tmpNode.textContent;
    this.info.buildTime = parseInt(gVUUFormatter.removeCommas(this.info.buildTime));

    // get build cost
    tmpNode = gVUUDOM.getChildElement(nodeHeader, "font", 2);
    this.info.buildCost =
        tmpNode.textContent.substring(0, tmpNode.textContent.indexOf("gc"));
    this.info.buildCost = parseInt(gVUUFormatter.removeCommas(this.info.buildCost));

    // if there are any credits, get credits
    if ((tmpNode = gVUUDOM.getChildElement(nodeHeader, "b", 1))) {
        tmpNode = gVUUDOM.getChildElement(tmpNode, "font", 1);
        this.info.buildCredits = tmpNode.textContent;
        this.info.buildCredits =
        parseInt(gVUUFormatter.removeCommas(this.info.buildCredits));
    }

    // get can build x buildings
    tmpNode = gVUUDOM.getChildElement(nodeHeader, "p", 1);
    tmpNode = gVUUDOM.getChildElement(tmpNode, "font", 1);
    this.info.canBuild = tmpNode.textContent;
    this.info.canBuild = parseInt(gVUUFormatter.removeCommas(this.info.canBuild));

    // get acres and available acres (caching current acres)
    tmpNode = gVUUDOM.getChildElement(nodeHeader, "p", 2);
    this.info.acres = tmpNode.textContent.substring(
        tmpNode.textContent.indexOf("have ") + 5, tmpNode.textContent.indexOf(" total"));
    this.info.acres = parseInt(gVUUFormatter.removeCommas(this.info.acres));
    this.info.availableAcres = tmpNode.textContent.substring(
        tmpNode.textContent.indexOf("and ") + 4, tmpNode.textContent.indexOf(" avail"));
    this.info.availableAcres =
        parseInt(gVUUFormatter.removeCommas(this.info.availableAcres));

    // calculate other costs
    // accelerated build should have a maximum of available acres
    // (and include building credits)
    this.info.canAccelBuild = Math.floor(this.info.money / (2 * this.info.buildCost))
        + Math.floor(this.info.buildCredits / 2);
    if (this.info.canAccelBuild > parseInt(this.info.availableAcres))
        this.info.canAccelBuild = this.info.availableAcres;
    this.info.razeCost = this.rules.growth.getRazeCost(this.info);
    this.info.canRaze = Math.floor(this.info.money / this.info.razeCost);

    // don't include credits in this.info.canRazeBuild and this.info.canRazeAccelBuild
    this.info.canRazeBuild =
        Math.floor(this.info.money / (this.info.buildCost + this.info.razeCost));
    this.info.canRazeAccelBuild =
        Math.floor(this.info.money / ((2 * this.info.buildCost) + this.info.razeCost));
}

/**
 * Modifies the header of the growth page to instead display a summary of growth
 * information.
 */
vuuPMGrowth.prototype.modifyHeaderSummary = function ()
{
    var        nodeHeader = null;
    var        tmpNode = null;
    var        tmpNodeTable = null;
    var        tmpNodeTR = null;
    var        tmpNodeTD = null;

    // get header node
    nodeHeader = gVUUDOM.getDescendentTextNode(this.body, "As you well know,", 1, "e00084").parentNode;
    nodeHeader.parentNode.removeChild(nodeHeader);

    nodeHeader = gVUUDOM.getDescendentTextNode(this.body, "Construction Time:", 1, "e00084");
    nodeHeader = nodeHeader.parentNode.parentNode.parentNode;
    nodeHeader = nodeHeader.parentNode.parentNode.parentNode;

    // create a table
    tmpNode = this.doc.createElement("td");
    tmpNodeTable = this.doc.createElement("table");
    tmpNodeTable.setAttribute("align", "left");
    tmpNode.appendChild(tmpNodeTable);

    // first row
    tmpNodeTR = this.doc.createElement("tr");
    tmpNodeTable.appendChild(tmpNodeTR);

    tmpNodeTD = this.doc.createElement("td");
    tmpNodeTD.setAttribute("colspan", "3");
    tmpNodeTD.setAttribute("align", "left");
    tmpNodeTR.appendChild(tmpNodeTD);

    // add acres
    tmpNodeTD.appendChild(this.doc.createTextNode("Total Acres: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.acres)));
    tmpNodeTD.appendChild(this.doc.createTextNode(" acres"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // add available acres
    tmpNodeTD.appendChild(this.doc.createTextNode("Available Acres: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.availableAcres)));
    tmpNodeTD.appendChild(this.doc.createTextNode(" acres"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // second row
    tmpNodeTR = this.doc.createElement("tr");
    tmpNodeTable.appendChild(tmpNodeTR);

    // first column
    tmpNodeTD = this.doc.createElement("td");
    tmpNodeTD.setAttribute("align", "left");
    tmpNodeTR.appendChild(tmpNodeTD);

    // add build time
    tmpNodeTD.appendChild(this.doc.createTextNode("Construction Time: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.buildTime)));
    tmpNodeTD.appendChild(this.doc.createTextNode(" days"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // add build cost
    tmpNodeTD.appendChild(this.doc.createTextNode("Construction Cost: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.buildCost)));
    tmpNodeTD.appendChild(this.doc.createTextNode("gc"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // add build credits
    tmpNodeTD.appendChild(this.doc.createTextNode("Construction Credits: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.buildCredits)));
    tmpNodeTD.appendChild(this.doc.createTextNode(" credits"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // add can build
    tmpNodeTD.appendChild(this.doc.createTextNode("Can Construct: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.canBuild)));
    tmpNodeTD.appendChild(this.doc.createTextNode(" buildings"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // add can accelerated build
    tmpNodeTD.appendChild(this.doc.createTextNode("Can Accelerated Construct: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.canAccelBuild)));
    tmpNodeTD.appendChild(this.doc.createTextNode(" buildings"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // second column
    tmpNodeTD = this.doc.createElement("td");
    tmpNodeTD.setAttribute("width", "50");
    tmpNodeTR.appendChild(tmpNodeTD);

    // third column
    tmpNodeTD = this.doc.createElement("td");
    tmpNodeTD.setAttribute("align", "left");
    tmpNodeTD.setAttribute("valign", "top");
    tmpNodeTR.appendChild(tmpNodeTD);

    // add raze cost
    tmpNodeTD.appendChild(this.doc.createTextNode("Raze Cost: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.razeCost)));
    tmpNodeTD.appendChild(this.doc.createTextNode("gc"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // add can raze
    tmpNodeTD.appendChild(this.doc.createTextNode("Can Raze: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.canRaze)));
    tmpNodeTD.appendChild(this.doc.createTextNode(" buildings"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // add can raze / build
    tmpNodeTD.appendChild(this.doc.createTextNode("Can Raze / Construct: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.canRazeBuild)));
    tmpNodeTD.appendChild(this.doc.createTextNode(" buildings"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // add can raze / double build
    tmpNodeTD.appendChild(this.doc.createTextNode("Can Raze / Accelerated Construct: "));
    tmpNodeTD.appendChild(gVUUDOM.createColoredSpan(
        this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(this.info.canRazeAccelBuild)));
    tmpNodeTD.appendChild(this.doc.createTextNode(" buildings"));
    tmpNodeTD.appendChild(this.doc.createElement("br"));

    // replace the current header with the new header
    nodeHeader.parentNode.replaceChild(tmpNodeTable, nodeHeader);
}

/**
 * Modifies the growth page table to include total (current + in progress)
 * numbers and %.
 */
vuuPMGrowth.prototype.modifyTablePercents = function ()
{
    var        nodeTable = null;
    var        tmpNode = null;
    var        tmpNodeTR = null;
    var        tmpNodeTD = null;
    var        total = null;

    // get table
    nodeTable = gVUUDOM.getDescendentElement(this.doc.forms[0], "tbody", 1);

    // extend the top table header
    tmpNodeTR = gVUUDOM.getChildElement(nodeTable, "tr", 1);
    tmpNode = gVUUDOM.getChildElement(tmpNodeTR, "th", 1);
    tmpNode.setAttribute("colspan", "11");

    // create new column headers for the total (do it in reverse so its easier to count)
    tmpNodeTR = gVUUDOM.getChildElement(nodeTable, "tr", 2);
    tmpNode = this.doc.createElement("th");
    tmpNode.textContent = "Total";
    tmpNodeTR.insertBefore(tmpNode, gVUUDOM.getChildElement(tmpNodeTR, "th", 9));
    tmpNode = this.doc.createElement("th");
    tmpNode.textContent = "Total";
    tmpNodeTR.insertBefore(tmpNode, gVUUDOM.getChildElement(tmpNodeTR, "th", 4));

    // for each of the buildings calculate its total and add it to the row
    for (var i = 3; i < 12; i++) {

        tmpNodeTR = gVUUDOM.getChildElement(nodeTable, "tr", i);

        if (tmpNodeTR != null) {
            total = 0;

            if (gVUUDOM.getChildElement(tmpNodeTR, "td", 7)) {
                tmpNodeTD = this.doc.createElement("td");
                total += parseInt(gVUUFormatter.removeCommas(
                gVUUDOM.getChildElement(tmpNodeTR, "td", 7).textContent));
                total += parseInt(gVUUFormatter.removeCommas(
                gVUUDOM.getChildElement(tmpNodeTR, "td", 8).textContent));

                tmpNodeTD.textContent = (total == 0) ? total : gVUUFormatter.fNum(total)
                    + " (" + (total / this.info.acres * 100).toFixed(2) + "%)";

                tmpNodeTR.insertBefore(tmpNodeTD, gVUUDOM.getChildElement(tmpNodeTR, "td", 9));
            }

            total = 0;
            tmpNodeTD = this.doc.createElement("td");
            total += parseInt(gVUUDOM.getChildElement(tmpNodeTR, "td", 2).textContent);
            total += parseInt(gVUUDOM.getChildElement(tmpNodeTR, "td", 3).textContent);

            tmpNodeTD.textContent = (total == 0) ? total :
                    total + " (" + (total / this.info.acres * 100).toFixed(2) + "%)";

            tmpNodeTR.insertBefore(tmpNodeTD, gVUUDOM.getChildElement(tmpNodeTR, "td", 4));
        }
    }

    // extend the bottom two rows
    tmpNodeTR = gVUUDOM.getChildElement(nodeTable, "tr", 12);
    tmpNode = gVUUDOM.getChildElement(tmpNodeTR, "td", 1);
    tmpNode.setAttribute("colspan", "11");

    tmpNodeTR = gVUUDOM.getChildElement(nodeTable, "tr", 13);
    tmpNode = gVUUDOM.getChildElement(tmpNodeTR, "td", 1);
    tmpNode.setAttribute("colspan", "11");
}
