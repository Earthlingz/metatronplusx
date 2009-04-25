/**
 * Written by Anthony Gabel on 09 December 2004.
 *
 * Performs required modifications to the Science page:
 *  - Adds a science summary to the top of the science table
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 *  formatter.js
 */


/**
 * Constructor for a 'vuuPMScience' object. Used to modify the
 * Science page.
 * param:  aDoc - HTMLDocument - Science page to modify
 */
function vuuPMScience(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.acres = null;
	this.racesx = null;
    this.debug = false;
}

/**
 * Performs any required modifications to the Science
 * page by directly modifying its DOM.
 */
vuuPMScience.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    this.debug = gVUU.prefs.getBoolPref("vuuScienceDebug");

    MpDebug(this.debug, "Trying to modify science page");

    /*
    if (gVUU.prefs.getBoolPref("vuuModifyScienceSummary")) {
        this.addSciencesSummary();
    }
    */

    if (gVUU.prefs.getBoolPref("vuuAddScienceGraph")) {
        this.insertScienceCalulations();
    }

    MpDebug(this.debug, "Science page modification completed successfully");
}

vuuPMScience.prototype.insertScienceCalulations = function ()
{
    var      tmpNode   = null;
    var      table     = null;
    var      tHeader   = null;
    var      td        = null;
    var      knownPer  = null;
    var      bagPer    = null;
    var      knownCnt  = null;
    var      progCnt   = null;

    MpDebug(this.debug, "Inside new function");

    if (this.server.cache.acres != null) {
        this.acres = this.server.cache.acres;
        MpDebug(this.debug, "Found acres:'" + this.acres + "'");
    } else {
        MpDebug(this.debug, "Acres Missing, Skipping science graph addition");
        return;
        this.acres = 2000;
        MpDebug(this.debug, "Acres Missing, Assuming 2000 for science calculations");
    }
    if (this.server.cache.racesx != null) {
        this.racesx = this.server.cache.racesx;
        MpDebug(this.debug, "Found race:'" + this.racesx + "'");
    } else {
        MpDebug(this.debug, "Race Missing, Skipping science graph addition");
        return;
        this.racesx = Elf;
        MpDebug(this.debug, "Race Missing, Assuming Elf as Race");
    }

    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");

    tmpNode.textContent =
                   "function Update(index, modifier, perBag, booksLearned) " +
                   " { var imgNew=document.getElementById('New'+index);" +
                   " var perStr = 'You will learn ';" +
                   " var imgExisting=document.getElementById('Existing'+index); " +
                   " var imgProgress=document.getElementById('Progress'+index); " +
                   " var value=parseInt(document.forms[0].elements.namedItem('Tech' +index).value);" +
                   " var acres=" + this.acres + "; " +
				   //" var racesx=" + this.racesx + "; " +
                   " var totalBooks=(parseInt(value) + parseInt(booksLearned));" +
                   " var booksPerAcre = totalBooks/acres;" +
                   " var sqrt=Math.sqrt(booksPerAcre); " +
                   " var nWidth = Math.round(sqrt * modifier * 100) / 50 ;" +
                   " var nPer = Math.round(nWidth * 100 / 2) / 100;" +
                   " if (nWidth > 200) { " +
                   "   nWidth = 200;" +
                   "   perStr += (Math.round(100 * (nPer - perBag)) / 100) + " +
                   "     ' % more and kit will contain more than 100%'; " +
                   " } else { " +
                   "   perStr += (Math.round(100 * (nPer - perBag)) / 100) + " +
                   "     ' % more and kit will contain ' + nPer + ' %';" +
                   " } " +
                   " imgNew.setAttribute('title', perStr); " +
                   " imgNew.width=(nWidth-imgExisting.width-imgProgress.width); " +
                   " } ";

    table = gVUUDOM.getDescendentElement(this.body, "table", 1);

    if (table != null ) {
        table.appendChild(tmpNode);
    } else {
        MpDebug(this.debug, "Addition of script to table failed");
        return;
    }

    table = gVUUDOM.getDescendentTextNode(this.body, "The Arts & Sciences", 1, "");

    if (table == null) {
        MpDebug(this.debug, "Arts and Science Table not Found");
        return;
    }
    table = table.parentNode.parentNode.parentNode;

    var  str = gVUUDOM.getAllText(window, table, "e00090");

    // change column span to 7
    tHeader = gVUUDOM.getDescendentElement(table, "th", 1);
    tHeader.setAttribute("colspan", "7");
    tHeader.parentNode.setAttribute("bgcolor", gVUUColors.TITLE_BAR_RED);

    // insert new column for graph.
    tHeader = tmpNode = null;
    tHeader = gVUUDOM.getDescendentElement(table, "th", 6);
    tHeader.parentNode.setAttribute("bgcolor", gVUUColors.TITLE_BAR_RED);
    tmpNode = this.doc.createElement("th");
    tmpNode.setAttribute("width", "200px");
    tmpNode.appendChild(this.doc.createTextNode("Graph"));
    tHeader.parentNode.insertBefore(tmpNode, tHeader);

    // alchemy.
    td = gVUUDOM.getDescendentElement(table, "td", 5);
    knownCnt = td.previousSibling.previousSibling.previousSibling.firstChild.nodeValue;
    progCnt = td.previousSibling.firstChild.nodeValue;
    knownCnt = gVUUFormatter.removeCommas(knownCnt);
    progCnt = gVUUFormatter.removeCommas(progCnt);
    td.setAttribute("id", "Tech1");
    knownPer = knownCnt ? this.calculateSciencePercent(knownCnt, 1) : 0;
    bagPer = progCnt ? this.calculateSciencePercent(parseInt(progCnt) + parseInt(knownCnt), 1) : knownPer;
    td.setAttribute("OnChange", "Update(1, 1.4," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    td.setAttribute("onKeyUp", "Update(1, 1.4," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    tmpNode = this.createImageNode(1, knownPer, bagPer);
    // insert the node.
    td.parentNode.insertBefore(tmpNode, td);

    // Tools.
    td = gVUUDOM.getDescendentElement(table, "td", 11);
    knownCnt = td.previousSibling.previousSibling.previousSibling.firstChild.nodeValue;
    progCnt = td.previousSibling.firstChild.nodeValue;
    knownCnt = gVUUFormatter.removeCommas(knownCnt);
    progCnt = gVUUFormatter.removeCommas(progCnt);
    td.setAttribute("id", "Tech2");
    knownPer = knownCnt ? this.calculateSciencePercent(knownCnt, 2) : 0;
    bagPer = progCnt ? this.calculateSciencePercent(parseInt(progCnt) + parseInt(knownCnt), 2) : knownPer;
    td.setAttribute("OnChange", "Update(2, 1," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")" );
    td.setAttribute("onKeyUp", "Update(2, 1," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")" );
    tmpNode = this.createImageNode(2, knownPer, bagPer);
    // insert the node.
    td.parentNode.insertBefore(tmpNode, td);

    // Housing.
    td = gVUUDOM.getDescendentElement(table, "td", 17);
    knownCnt = td.previousSibling.previousSibling.previousSibling.firstChild.nodeValue;
    progCnt = td.previousSibling.firstChild.nodeValue;
    knownCnt = gVUUFormatter.removeCommas(knownCnt);
    progCnt = gVUUFormatter.removeCommas(progCnt);
    td.setAttribute("id", "Tech3");
    knownPer = knownCnt ? this.calculateSciencePercent(knownCnt, 3) : 0;
    bagPer = progCnt ? this.calculateSciencePercent(parseInt(progCnt) + parseInt(knownCnt), 3) : knownPer;
    td.setAttribute("OnChange", "Update(3, 0.65," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    td.setAttribute("onKeyUp", "Update(3, 0.65," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    tmpNode = this.createImageNode(3, knownPer, bagPer);
    // insert the node.
    td.parentNode.insertBefore(tmpNode, td);

    // Food
    td = gVUUDOM.getDescendentElement(table, "td", 23);
    knownCnt = td.previousSibling.previousSibling.previousSibling.firstChild.nodeValue;
    progCnt = td.previousSibling.firstChild.nodeValue;
    knownCnt = gVUUFormatter.removeCommas(knownCnt);
    progCnt = gVUUFormatter.removeCommas(progCnt);
    td.setAttribute("id", "Tech4");
    knownPer = knownCnt ? this.calculateSciencePercent(knownCnt, 4) : 0;
    bagPer = progCnt ? this.calculateSciencePercent(parseInt(progCnt) + parseInt(knownCnt), 4) : knownPer;
    td.setAttribute("OnChange", "Update(4, 8," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    td.setAttribute("onKeyUp", "Update(4, 8," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    tmpNode = this.createImageNode(4, knownPer, bagPer);
    // insert the node.
    td.parentNode.insertBefore(tmpNode, td);

    // Military
    td = gVUUDOM.getDescendentElement(table, "td", 29);
    knownCnt = td.previousSibling.previousSibling.previousSibling.firstChild.nodeValue;
    progCnt = td.previousSibling.firstChild.nodeValue;
    knownCnt = gVUUFormatter.removeCommas(knownCnt);
    progCnt = gVUUFormatter.removeCommas(progCnt);
    td.setAttribute("id", "Tech5");
    knownPer = knownCnt ? this.calculateSciencePercent(knownCnt, 5) : 0;
    bagPer = progCnt ? this.calculateSciencePercent(parseInt(progCnt) + parseInt(knownCnt), 5) : knownPer;
    td.setAttribute("OnChange", "Update(5, 1.4," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    td.setAttribute("onKeyUp", "Update(5, 1.4," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    tmpNode = this.createImageNode(5, knownPer, bagPer);
    // insert the node.
    td.parentNode.insertBefore(tmpNode, td);

    // Crime.
    td = gVUUDOM.getDescendentElement(table, "td", 35);
    knownCnt = td.previousSibling.previousSibling.previousSibling.firstChild.nodeValue;
    progCnt = td.previousSibling.firstChild.nodeValue;
    knownCnt = gVUUFormatter.removeCommas(knownCnt);
    progCnt = gVUUFormatter.removeCommas(progCnt);
    td.setAttribute("id", "Tech6");
    knownPer = knownCnt ? this.calculateSciencePercent(knownCnt, 6) : 0;
    bagPer = progCnt ? this.calculateSciencePercent(parseInt(progCnt) + parseInt(knownCnt), 6) : knownPer;
    td.setAttribute("OnChange", "Update(6, 6," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    td.setAttribute("onKeyUp", "Update(6, 6," + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    tmpNode = this.createImageNode(6, knownPer, bagPer);
    // insert the node.
    td.parentNode.insertBefore(tmpNode, td);

    // Chanelling
    td = gVUUDOM.getDescendentElement(table, "td", 41);
    knownCnt = td.previousSibling.previousSibling.previousSibling.firstChild.nodeValue;
    progCnt = td.previousSibling.firstChild.nodeValue;
    knownCnt = gVUUFormatter.removeCommas(knownCnt);
    progCnt = gVUUFormatter.removeCommas(progCnt);
    td.setAttribute("id", "Tech7");
    knownPer = knownCnt ? this.calculateSciencePercent(knownCnt, 7) : 0;
    bagPer = progCnt ? this.calculateSciencePercent(parseInt(progCnt) + parseInt(knownCnt), 7) : knownPer;
    td.setAttribute("OnChange", "Update(7, 6, " +  bagPer + ", "+ (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    td.setAttribute("onKeyUp", "Update(7, 6, " + bagPer + ", " + (parseInt(progCnt) + parseInt(knownCnt)) + ")");
    tmpNode = this.createImageNode(7, knownPer, bagPer);
    // insert the node.
    td.parentNode.insertBefore(tmpNode, td);

    return;
}

vuuPMScience.prototype.calculateSciencePercent = function (books, typeOfScience)
{
    var     booksPerAcre = books/this.acres;
    var     sqrt = Math.sqrt(booksPerAcre);
    var     percent = 0;
	var 	racesx = this.racesx;

    switch (typeOfScience) {
        case 1 :
			if (racesx == "Undead") {
				percent = Math.round(sqrt * 100 * 1.4 / 2) / 100;
				break;
			} 	percent = Math.round(sqrt * 100 * 1.4) / 100;
				break;
        case 2 :
			if (racesx == "Undead") {
				percent = Math.round(sqrt * 100 * 1 / 2) / 100;
				break;
            }	percent = Math.round(sqrt * 100 * 1) / 100;
				break;
        case 3 :
			if (racesx == "Undead") {
				percent = Math.round(sqrt * 100 * 0.65 / 2) / 100;
				break;
			}	percent = Math.round(sqrt * 100 * 0.65) / 100;
				break;
        case 4 :
			if (racesx == "Undead") {
				percent = Math.round(sqrt * 100 * 8 / 2) / 100;
				break;
			}	percent = Math.round(sqrt * 100 * 8) / 100;
				break;
        case 5 :
			if (racesx == "Undead") {
				percent = Math.round(sqrt * 100 * 1.4 / 2) / 100;
				break;
			}	percent = Math.round(sqrt * 100 * 1.4) / 100;
				break;
        case 6 :
			if (racesx == "Undead") {
				percent = Math.round(sqrt * 100 * 6 / 2) / 100;
				break;
			}	percent = Math.round(sqrt * 100 * 6) / 100;
				break;
        case 7 :
			if (racesx == "Undead") {
				percent = Math.round(sqrt * 100 * 6 / 2) / 100;
				break;
			}	percent = Math.round(sqrt * 100 * 6) / 100;
				break;
        default:
            break;
    }

    return percent;

}

vuuPMScience.prototype.createImageNode = function (id, knownPer, bagPer)
{
    // chrome://vuu/skin/colorDarkBlue.png for Completed Science.
    // chrome://vuu/skin/colorLightBlue.png for Under Progress.
    // chrome://vuu/skin/colorDarkGreen.png for When User will Enter his count.

    // knwonPer --> percentage of science already known
    // bagPer --> percentage of science already known + percentage of under progress

    var       tmpNode    = null;
    var       href       = null;
    var       tdNode     = null;
    var       str        = null;
    var       path_1     = "chrome://vuu/skin/colorDarkBlue.png";
    var       path_2     = "chrome://vuu/skin/colorLightBlue.png";
    var       path_3     = "chrome://vuu/skin/colorDarkGreen.png";

    var       width1     = (knownPer) * 2;
    var       width2     = (bagPer - knownPer) * 2;

    if (id == 1) {
        str = "1";
    } else if (id == 2) {
        str = "2";
    } else if (id == 3) {
        str = "3";
    } else if (id == 4) {
        str = "4";
    } else if (id == 5) {
        str = "5";
    } else if (id == 6) {
        str = "6";
    } else {
        str = "7";
    }

    tdNode = this.doc.createElement("td");
    tdNode.setAttribute("align", "left");

    tmpNode = this.doc.createElement("img");
    tmpNode.setAttribute("src", path_1);
    tmpNode.setAttribute("height", "12px");
    tmpNode.setAttribute("width", width1);
    tmpNode.setAttribute("title", "You own " + knownPer + " %");
    tmpNode.setAttribute("id", "Existing" + str);
    tmpNode.setAttribute("border", "0");
    tdNode.appendChild(tmpNode);

    tmpNode = this.doc.createElement("img");
    tmpNode.setAttribute("src", path_2);
    tmpNode.setAttribute("height", "12px");
    tmpNode.setAttribute("width", width2);
    tmpNode.setAttribute("title", "Under progress " + (bagPer - knownPer) + " %\nTotal in kit " + bagPer + " %");
    tmpNode.setAttribute("id", "Progress" + str);
    tmpNode.setAttribute("border", "0");
    tdNode.appendChild(tmpNode);

    tmpNode = this.doc.createElement("img");
    tmpNode.setAttribute("src", path_3);
    tmpNode.setAttribute("height", "12px");
    tmpNode.setAttribute("width", "0%");
    tmpNode.setAttribute("title", "0 %");
    tmpNode.setAttribute("id", "New" + str);
    tmpNode.setAttribute("border", "0");
    tdNode.appendChild(tmpNode);


    return tdNode;
}

/**
 * Adds a summary to the top of the sciences table.
 */
vuuPMScience.prototype.addSciencesSummary = function ()
{
    var            freeBooks = null;
    var            bookCost = null;
    var            canPurchase = null;
    var            canLearn = null;

    var            nodeTD = null;
    var            sHeaderNode = null;
    var            tmpNode = null;
    var            tmpNode1 = null;

    nodeTD = gVUUDOM.getDescendentTextNode(this.body, "Ahh, the Arts & Sciences", 1, "e00066").parentNode;

    MpDebug(this.debug, "Found Science Header");

    // get free books then remove the node
    sHeaderNode = gVUUDOM.getChildElement(nodeTD, "p", 2);

    // Get Science Cost.
    tmpNode = gVUUDOM.getDescendentElement(sHeaderNode, "font", 2);
    bookCost = tmpNode.textContent;
    MpDebug(this.debug, "Cost Per Book:'" + bookCost + "'");

    // Get Free Books.
    tmpNode = gVUUDOM.getDescendentElement(sHeaderNode, "font", 3);
    freeBooks = gVUUFormatter.removeCommas(tmpNode.textContent);
    MpDebug(this.debug, "Free Books: '" + freeBooks + "'");

    // Get Purchase Books.
    tmpNode = gVUUDOM.getDescendentElement(sHeaderNode, "font", 4);
    canPurchase = gVUUFormatter.removeCommas(tmpNode.textContent);
    MpDebug(this.debug, "Purchaseble books: '" + canPurchase + "'");

    // Get Total Books.
    tmpNode = gVUUDOM.getDescendentElement(sHeaderNode, "font", 5);
    canLearn = gVUUFormatter.removeCommas(tmpNode.textContent);
    MpDebug(this.debug, "Total Leanable: '" + canLearn + "'");

    // remove the table column.
    nodeTD.removeChild(gVUUDOM.getChildElement(nodeTD, "p", 2));

    // calculate canLearn
    /*
    canLearn = parseInt(gVUUFormatter.removeCommas(freeBooks))
        + parseInt(gVUUFormatter.removeCommas(canPurchase));
    */

    // create and append a science summary table
    tmpNode = this.doc.createElement("table");
    tmpNode.setAttribute("style", "margin-left:auto; margin-right:auto;");
    nodeTD.appendChild(tmpNode);
    tmpNode1 = this.doc.createElement("tr");
    tmpNode.appendChild(tmpNode1);
    tmpNode = this.doc.createElement("td");
    tmpNode1.appendChild(tmpNode);
    tmpNode.appendChild(this.doc.createElement("br"));

    // free books
    tmpNode.appendChild(this.doc.createTextNode("'Free' Books available: "));
    tmpNode.appendChild(gVUUDOM.createColoredSpan(this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(freeBooks)));
    tmpNode.appendChild(this.doc.createTextNode(" books"));
    tmpNode.appendChild(this.doc.createElement("br"));

    // purchase cost
    tmpNode.appendChild(this.doc.createTextNode("Science Cost: "));
    tmpNode.appendChild(gVUUDOM.createColoredSpan(this.doc, gVUUColors.GOLD, bookCost));
    tmpNode.appendChild(this.doc.createTextNode(" per book"));
    tmpNode.appendChild(this.doc.createElement("br"));

    // can purchase
    tmpNode.appendChild(this.doc.createTextNode("Can Purchase: "));
    tmpNode.appendChild(gVUUDOM.createColoredSpan(this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(canPurchase)));
    tmpNode.appendChild(this.doc.createTextNode(" books"));
    tmpNode.appendChild(this.doc.createElement("br"));

    // can learn (free + purchase)
    tmpNode.appendChild(this.doc.createTextNode("Can Learn ('free' + purchase): "));
    tmpNode.appendChild(gVUUDOM.createColoredSpan(this.doc, gVUUColors.GOLD, gVUUFormatter.fNum(canLearn)));
    tmpNode.appendChild(this.doc.createTextNode(" books"));
    tmpNode.appendChild(this.doc.createElement("br"));
}
