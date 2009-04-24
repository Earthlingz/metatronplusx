/**
 * Written by Anthony Gabel on 17 July 2005.
 *
 * Performs required modifications to the 'The World' page:
 *  - Adds a link to the hidden world demographics
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMWorld' object. Used to modify the 'The World' page.
 * param:  aDoc - HTMLDocument - 'The World' page to modify
 */
function vuuPMWorld(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
}

/**
 * Performs any required modifications to the 'The World' page by directly
 * modifying its DOM.
 */
vuuPMWorld.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    if (gVUU.prefs.getBoolPref("vuuModifyWorldDemographics")) {
        this.addDemographicLinks();
    }
}

/**
 * Adds a link to the hidden demographics page in utopia.
 */
vuuPMWorld.prototype.addDemographicLinks = function ()
{
    var            tmpNode = null;
    var            tmpNode1 = null;

    tmpNode = gVUUDOM.getDescendentTextNode(this.body, "A Survey of the World", 1, "e00018");
    tmpNode = tmpNode.parentNode.parentNode;
    tmpNode.appendChild(this.doc.createElement("br"));
    tmpNode1 = this.doc.createElement("a");
    tmpNode1.setAttribute("href", "players/race2.htm");
    tmpNode1.textContent = this.server.name + " Demographics";
    tmpNode.appendChild(tmpNode1);
    tmpNode.appendChild(this.doc.createElement("br"));
}
