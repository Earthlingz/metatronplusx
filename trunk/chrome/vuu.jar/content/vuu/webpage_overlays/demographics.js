/**
 * Written by Anthony Gabel on 17 July 2005.
 *
 * Performs required modifications to the Demographics page:
 *  - Adds totals to demographics numbers
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 *  formatter.js
 */


/**
 * Constructor for a 'vuuPMDemographics' object. Used to modify the
 * Demographics page.
 * param:  aDoc - HTMLDocument - Demographics page to modify
 */
function vuuPMDemographics(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.debug = false;
}

/**
 * Performs any required modifications to the Demographics page by directly
 * modifying its DOM.
 */
vuuPMDemographics.prototype.modify = function ()
{
    var        tmpNode = null;

    this.debug = gVUU.prefs.getBoolPref("vuuWorldDebug");

    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    // modify the page a bit to reflect the server it is related to because
    // this page hasn't had much attention from Swirve
    tmpNode = gVUUDOM.getDescendentTextNode(
        this.body, "the Utopian World", 1, "e00019");

    tmpNode.nodeValue = "The provinces of " + this.server.name + ".";
    tmpNode = gVUUDOM.getDescendentTextNode(
        this.body, "The Utopian World", 1, "e00020");

    tmpNode.nodeValue = this.server.name
        + " consists of provinces of many races and backgrounds.";

    tmpNode = gVUUDOM.getDescendentTextNode(
        this.body, "The World of Utopia", 1, "e00021");

    tmpNode.nodeValue = this.server.name;

    if (gVUU.prefs.getBoolPref("vuuModifyWorldDemographicsTotals")) {
        this.addTotals();
    }

    if (gVUU.prefs.getBoolPref("vuuWorldInformation")) {
        this.addOtherIslands();
    }
}

vuuPMDemographics.prototype.addOtherIslands = function ()
{
    // http://wol.swirve.com/kingdoms/land-1.htm
    // http://wol.swirve.com/kingdoms/Honor-1.htm
    // http://wol.swirve.com/kingdoms/nw-20.htm
    // http://wol.swirve.com/players/land-20.htm
    // http://wol.swirve.com/players/honor-20.htm
    // http://wol.swirve.com/players/nw-20.htm

    var        docBody = gVUUDOM.getDescendentTextNode(this.body, "Race", 1, "e00022")
                         .parentNode.parentNode.parentNode.parentNode.parentNode;

    MpDebug(this.debug, "Adding all islands information Started");

    var     newTable = this.doc.createElement("table");
    newTable.setAttribute("align", "center");
    newTable.setAttribute("id", "vuu_islandId_Table");

    var     tbdy = this.doc.createElement("tbody");
    tbdy.setAttribute("id", "vuu_islandId_TableBody");
    newTable.appendChild(tbdy);

    // table header here
    var     row = this.doc.createElement("tr");
    row.setAttribute("bgcolor", "#500000");
    row.setAttribute("colspan", "4");
    tbdy.appendChild(row);

    var th = this.doc.createElement("th");
    th.setAttribute("width", "20px");
    th.setAttribute("align", "center");
    th.appendChild(this.doc.createTextNode("Island Number"));
    row.appendChild(th);

    th = this.doc.createElement("th");
    th.setAttribute("width", "75px");
    th.setAttribute("align", "center");
    th.appendChild(this.doc.createTextNode("KD Acre List"));
    row.appendChild(th);

    th = this.doc.createElement("th");
    th.setAttribute("width", "75px");
    th.setAttribute("align", "center");
    th.appendChild(this.doc.createTextNode("KD Honor List"));
    row.appendChild(th);

    th = this.doc.createElement("th");
    th.setAttribute("width", "75px");
    th.setAttribute("align", "center");
    th.appendChild(this.doc.createTextNode("KD NW List"));
    row.appendChild(th);

    th = this.doc.createElement("th");
    th.setAttribute("width", "75px");
    th.setAttribute("align", "center");
    th.appendChild(this.doc.createTextNode("Prov Acre List"));
    row.appendChild(th);

    th = this.doc.createElement("th");
    th.setAttribute("width", "75px");
    th.setAttribute("align", "center");
    th.appendChild(this.doc.createTextNode("Prov Honor List"));
    row.appendChild(th);

    th = this.doc.createElement("th");
    th.setAttribute("width", "75px");
    th.setAttribute("align", "center");
    th.appendChild(this.doc.createTextNode("Prov NW List"));
    row.appendChild(th);

    for (var count = 1; count <= 40; ++count) {
        row = this.doc.createElement("tr");
        tbdy.appendChild(row);

        var  link1 ;
        link1 = this.doc.createElement("a");
        link1.setAttribute("href", "../kingdoms/land-" + count +".htm");
        link1.textContent = "Link";

        var  link2 ;
        link2 = this.doc.createElement("a");
        link2.setAttribute("href", "../kingdoms/Honor-" + count +".htm");
        link2.textContent = "Link";

        var  link3 ;
        link3 = this.doc.createElement("a");
        link3.setAttribute("href", "../kingdoms/nw-" + count +".htm");
        link3.textContent = "Link";

        var  link4 ;
        link4 = this.doc.createElement("a");
        link4.setAttribute("href", "../players/land-" + count +".htm");
        link4.textContent = "Link";

        var  link5 ;
        link5 = this.doc.createElement("a");
        link5.setAttribute("href", "../players/honor-" + count +".htm");
        link5.textContent = "Link";

        var  link6 ;
        link6 = this.doc.createElement("a");
        link6.setAttribute("href", "../players/nw-" + count +".htm");
        link6.textContent = "Link";

        var  tc = this.doc.createElement("td");
        tc.appendChild(this.doc.createTextNode(count));
        tc.setAttribute("align", "center");
        row.appendChild(tc);

        tc = this.doc.createElement("td");
        tc.appendChild(link1);
        tc.setAttribute("align", "center");
        row.appendChild(tc);

        tc = this.doc.createElement("td");
        tc.appendChild(link2);
        tc.setAttribute("align", "center");
        row.appendChild(tc);

        tc = this.doc.createElement("td");
        tc.appendChild(link3);
        tc.setAttribute("align", "center");
        row.appendChild(tc);

        tc = this.doc.createElement("td");
        tc.appendChild(link4);
        tc.setAttribute("align", "center");
        row.appendChild(tc);

        tc = this.doc.createElement("td");
        tc.appendChild(link5);
        tc.setAttribute("align", "center");
        row.appendChild(tc);

        tc = this.doc.createElement("td");
        tc.appendChild(link6);
        tc.setAttribute("align", "center");
        row.appendChild(tc);

    }

    docBody.appendChild(this.doc.createElement("p"));
    docBody.appendChild(this.doc.createElement("p"));
    docBody.appendChild(newTable);

    MpDebug(this.debug, "Adding all islands information Finished");
    return;
}

/**
 * Adds totals to the hidden demographics pages of utopia.
 */
vuuPMDemographics.prototype.addTotals = function ()
{
    var        nodeTBody = gVUUDOM.getDescendentTextNode(this.body, "Race", 1, "e00022")
                                .parentNode.parentNode.parentNode;

    var        nodeTR = null;
    var        nodeTD = null;
    var        totalProvinces = 0;
    var        totalLand = 0;
    var        totalNW = 0;
    var        avgLand = 0;
    var        avgNW = 0;
    var        tmpText = null;
    var        i = null;

    MpDebug(this.debug, "Adding totals Started");

    // calculate totals and averages
    nodeTR = gVUUDOM.getChildElement(nodeTBody, "tr", 3, "e00023");

    for (i = 4; nodeTR != null; i++) {
        nodeTD = gVUUDOM.getChildElement(nodeTR, "td", 2, "e00024");
        totalProvinces += parseInt(gVUUFormatter.removeCommas(nodeTD.textContent));
        nodeTD = gVUUDOM.getChildElement(nodeTR, "td", 3, "e00025");
        tmpText = nodeTD.textContent.substring(0, nodeTD.textContent.indexOf(" "));
        totalLand += parseInt(gVUUFormatter.removeCommas(tmpText));
        nodeTD = gVUUDOM.getChildElement(nodeTR, "td", 4, "e00026");
        tmpText = nodeTD.textContent.substring(0, nodeTD.textContent.indexOf("k"));
        totalNW += parseInt(gVUUFormatter.removeCommas(tmpText));
        nodeTR = gVUUDOM.getChildElement(nodeTBody, "tr", i, "e00027");
    }

    avgLand = Math.floor(totalLand / totalProvinces);
    avgNW = Math.floor(totalNW / totalProvinces);

    // create the 'totals' row and append it to the demographics table
    nodeTR = this.doc.createElement("tr");
    nodeTD = this.doc.createElement("td");
    nodeTD.textContent = "Total";
    nodeTR.appendChild(nodeTD);
    nodeTD = this.doc.createElement("td");
    nodeTD.setAttribute("align", "right");
    nodeTD.textContent = gVUUFormatter.fNum(totalProvinces);
    nodeTR.appendChild(nodeTD);
    nodeTD = this.doc.createElement("td");
    nodeTD.setAttribute("align", "right");

    nodeTD.textContent = gVUUFormatter.fNum(totalLand)
        + " Acres (" + gVUUFormatter.fNum(avgLand) + ")";

    nodeTR.appendChild(nodeTD);
    nodeTD = this.doc.createElement("td");
    nodeTD.setAttribute("align", "right");

    nodeTD.textContent = gVUUFormatter.fNum(totalNW)
        + "k (" + gVUUFormatter.fNum(avgNW) + "k)";

    nodeTR.appendChild(nodeTD);
    nodeTBody.appendChild(nodeTR);

    MpDebug(this.debug, "Adding totals Finished");

    return;
}
