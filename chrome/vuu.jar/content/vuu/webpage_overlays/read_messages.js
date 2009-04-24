/**
 * Written by Anthony Gabel on 11 January 2005.
 *
 * Performs required modifications to the 'Read Messages' page:
 *  - TODO
 *
 * Requires:
 *  TODO
 */

/**
 * Constructor for a 'vuuPMReadMessages' object. Used to modify the
 * 'Read Messages' page.
 * param:  aDoc - HTMLDocument - 'Read Messages' page to modify
 */
function vuuPMReadMessages(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
}

/**
 * Performs any required modifications to the 'Read Messages' page by directly
 * modifying its DOM.
 */
vuuPMReadMessages.prototype.modify = function ()
{
  // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    if(gVUU.prefs.getBoolPref("vuuModifyReadMsgsReportConfirmation")) {
        this.addReportMessageConfirmation();
    }
}

/**
 * Adds a confirmation dialog to each 'Report Message' link.
 */
vuuPMReadMessages.prototype.addReportMessageConfirmation = function ()
{
    var            tmpNode = null;
    var            links = this.doc.links;
    var            i = null;

    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");

    tmpNode.textContent =
        " function vuuConfirmReport() {"
            + "   return confirm('Please confirm that you wish to report this message.');"
            + " }";

    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);

    for (i = 0; i < links.length; i++) {
        if (links[i].textContent.indexOf("Report this Message") != -1) {
            links[i].setAttribute("onclick", "return vuuConfirmReport();");
        }
    }
}


/**
 * FOR NOW, LEAVE THIS OUT
// modifies the read messages page to ignore (and if preferences allow, delete) messages
// from undesired provinces
function rmsg_modify(doc)
{
    var            tmpNodes = null;
    var            tmpNode = null;
    var            nodeData = null;

    ol_insertPageModified(doc);
    rmsg_reset();

    nodeData = dom_getFirstDescendentElement(doc, "body");
    nodeData = dom_getFirstDescendentElement(nodeData, "td");
    nodeData = dom_getFirstDescendentElement(nodeData, "form");
    nodeData = dom_getFirstDescendentElement(nodeData, "tbody");

    tmpNodes = nodeData.getElementsByTagName("tr");

    for (var i = 0; i < tmpNodes.length; i++) {
        tmpNode = dom_getChildElement(tmpNodes[i], "td", 1);
        tmpNode = dom_getChildElement(tmpNode, "i", 2);
        tmpNode = dom_getChildElement(tmpNode, "font", 1);

        if (tmpNode.textContent.indexOf(vuu_rmsg_PROV) != -1) {
            tmpNodes[i].setAttribute("style", "display: none !important;");
        }
    }
}
*/
