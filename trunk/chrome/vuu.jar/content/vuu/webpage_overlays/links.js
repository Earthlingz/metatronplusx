/**
 * Written by Anthony Gabel on 18 July 2005.
 *
 * Contains both vuuPMLinks & vuuPMFreeIncome
 *
 * Performs required modifications to the Links page:
 *  - Marks that this page has loaded and calls the free income
 *    highlighting routine which performs highlighting if necessary
 *
 * Performs required modifications to the 'Free Income Popup' page:
 *  - Caches the time that free income has been taken and updates
 *    highlighting if necessary
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMLinks' object. Used to modify the Links page.
 * param:  aDoc - HTMLDocument - Links page to modify
 */
function vuuPMLinks(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
}

/**
 * Performs any required modifications to the Links page by directly
 * modifying its DOM.
 */
vuuPMLinks.prototype.modify = function ()
{
    var            tmpNode = null;

    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    // add new links to the top
    this.addExtraLinks();

    // since free income has been removed from utopia.
    return;
/** Commented since not needed anymore.
    // add needed script element to unhighlight link when clicking free income
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");
    tmpNode.textContent =
        " function vuuUnhighlightFreeIncome() {"
            + " if (document.body.hasAttribute('style'))"
            + " document.body.removeAttribute('style');"
            + " var element = document.getElementById('vuu_free_income');"
            + " if (element.hasAttribute('style')) element.removeAttribute('style');"
            + " }";

    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);

    tmpNode = gVUUDOM.getDescendentTextNode( this.body, "Free Income", 1, "e00027").parentNode;
    tmpNode.setAttribute("id", "vuu_free_income");
    tmpNode.setAttribute("onclick", "vuuUnhighlightFreeIncome();");

    // change the free income link to point directly to it.
    var    href = tmpNode.getAttribute("href");

    if (href.indexOf("wol.swirve") != -1) {
        href = "http://wol.swirve.com/win.cgi?bonus=2";
    } else if (href.indexOf("gen.swirve") != -1) {
        href = "http://gen.swirve.com/win.cgi?bonus=2";
    } else if (href.indexOf("b.swirve") != -1) {
        href = "http://b.swirve.com/win.cgi?bonus=2";
    }
    tmpNode.setAttribute("href", href);

    // set up for free income highlighting which will only occur when both this page
    // and the throne page have loaded
    gVUU.pageLoadedLinks = true;
    gVUU.updateFreeIncomeHighlightSingle(this.doc);
*/
}

/**
 * Adds extra links to the top frame and
 * increases it's size in main window
 */
vuuPMLinks.prototype.addExtraLinks = function ()
{
    var            tmpNode = null;

    var            parWin = parent;

    if (parWin && parWin._content.document.body != this.body) {
        try {
            var   frameSet = parWin._content.document.body.firstChild.nextSibling.nextSibling.nextSibling;
            // increase the size of top frame
            frameSet.setAttribute("rows", "30,*,0");
        } catch (e) {
            dump("ERROR : " + e + "\n");
        }
    }

    var            centerNd = this.body.firstChild.nextSibling.nextSibling;
    var            fontNd = centerNd.firstChild.nextSibling;

    // let us make things bigger
    fontNd.setAttribute("style", "font-size: 10px;");

    tmpNode = this.doc.createElement("a");
    tmpNode.setAttribute("target", "utomain");
    tmpNode.setAttribute("href", "/players/race2.htm");
    tmpNode.setAttribute("style", "color: #ffeecc;");
	tmpNode.textContent = "World Demographics";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement("br");
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement("a");
    tmpNode.setAttribute("target", "utomain");
    tmpNode.setAttribute("href", "/council.cgi?elder=1");
    tmpNode.setAttribute("style", "color: #ffeecc;");
    tmpNode.textContent = "Affairs of the State";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement('span');
    tmpNode.innerHTML = "    ";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement("a");
    tmpNode.setAttribute("target", "utomain");
    tmpNode.setAttribute("href", "/council.cgi?elder=3");
    tmpNode.setAttribute("style", "color: #ffeecc;");
    tmpNode.textContent = "Military Affairs";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement('span');
    tmpNode.innerHTML = "    ";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement("a");
    tmpNode.setAttribute("target", "utomain");
    tmpNode.setAttribute("href", "/council.cgi?elder=4");
    tmpNode.setAttribute("style", "color: #ffeecc;");
    tmpNode.textContent = "Internal Affairs";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement('span');
    tmpNode.innerHTML = "    ";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement("a");
    tmpNode.setAttribute("target", "utomain");
    tmpNode.setAttribute("href", "/council.cgi?elder=5");
    tmpNode.setAttribute("style", "color: #ffeecc;");
    tmpNode.textContent = "Arts & Sciences";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement('span');
    tmpNode.innerHTML = "    ";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement("a");
    tmpNode.setAttribute("target", "utomain");
    tmpNode.setAttribute("href", "/council.cgi?elder=6");
    tmpNode.setAttribute("style", "color: #ffeecc;");
    tmpNode.textContent = "Mystic Affairs";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement('span');
    tmpNode.innerHTML = "    ";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement("a");
    tmpNode.setAttribute("target", "utomain");
    tmpNode.setAttribute("href", "/council.cgi?elder=7");
    tmpNode.setAttribute("style", "color: #ffeecc;");
    tmpNode.textContent = "Our History";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement('span');
    tmpNode.innerHTML = "    ";
    fontNd.appendChild(tmpNode);

    tmpNode = this.doc.createElement("a");
    tmpNode.setAttribute("target", "utomain");
    tmpNode.setAttribute("href", "/growth.cgi?style=1");
    tmpNode.setAttribute("style", "color: #ffeecc;");
    tmpNode.textContent = "Kingdom Growth";
    fontNd.appendChild(tmpNode);

    return;
}

/**
 * Constructor for a 'vuuPMFreeIncome' object. Used to modify the
 * 'Free Income Popup' page.
 * param:  aDoc - HTMLDocument - 'Free Income Popup' page to modify
 */
function vuuPMFreeIncome(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
}

/**
 * Performs any required modifications to the 'Free Income Popup' page by directly
 * modifying its DOM.
 * This occurs both when a new window is created (by left clicking free income link) and
 * when a new tab is created (via middle click etc.).
 
vuuPMFreeIncome.prototype.modify = function ()
{
    return;
    //since free income has been removed from utopia.
    var            cache = null;
    var            serverHrefID = null;
    var            startPoint = this.doc.location.href.indexOf(".swirve.com") - 2;
    var            endPoint = this.doc.location.href.indexOf(".swirve.com");

    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    // update the cache only if there is a currently cached date
    serverHrefID = this.doc.location.href.substring(startPoint, endPoint);

    if (serverHrefID) {
        cache = gVUU.servers.getServerByHrefID(serverHrefID).cache;
    } else {
        MpDebug(true, "invalid free income link.");
        return;
    }

    if (cache.dateMonth != null) {
        cache.freeIncomeMonth = cache.dateMonth;
        cache.freeIncomeYear = cache.dateYear;
    }

    gVUU.updateFreeIncomeHighlightSingle();
}
*/