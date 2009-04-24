/**
 * Written by Anthony Gabel on 16 November 2004.
 *
 * Performs required modifications to the Intro page:
 *  - Caches the current monarch message
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMIntro' object. Used to modify the Intro page.
 * param:  aDoc - HTMLDocument - Intro page to modify
 */
function vuuPMIntro(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
}

/**
 * Performs any required modifications to the Intro page by directly
 * modifying its DOM.
 */
vuuPMIntro.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    this.cacheData();
    this.setLoginType();
}

/**
 * Caches any required data from the page.
 */
vuuPMIntro.prototype.cacheData = function ()
{
    var        nodeMsg = null;

    // set the monarch message for this server. If there is not monarch message
    // then set the cached message to NULL
    nodeMsg = gVUUDOM.getDescendentTextNode(this.body, "Message from Our Monarch", 1, "e00001");

    if (nodeMsg != null) {
        nodeMsg = nodeMsg.parentNode.parentNode.parentNode;
        nodeMsg = gVUUDOM.getChildElement(nodeMsg, "tr", 2);
        nodeMsg = gVUUDOM.getChildElement(nodeMsg, "td", 1);

        this.server.cache.monarchMessage = nodeMsg.textContent;
    } else {
        this.server.cache.monarchMessage = null;
    }

}

/**
 * Sets the login type of this server's session ("DNS" or "IP")
 */
vuuPMIntro.prototype.setLoginType = function ()
{
    if (this.doc.location.href.indexOf(this.server.ipAddress) != -1) {
        this.server.loginType = "IP";
    } else {
        this.server.loginType = "DNS";
    }
}
