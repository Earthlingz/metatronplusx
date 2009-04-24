/**
 * @author Anthony Gabel
 *
 * Object used to convert province locations into links to the appropriate kingdom page.
 *
 * @requires className Description
 */

// constructor
function vuuLocationConverter(aDoc, aPageType)
{
    this.doc = aDoc;
    this.pageType = aPageType;
    this.server = null;
    this.numConverted = 0;
    this.debug = false;
}

vuuLocationConverter.prototype.MAX_TO_CONVERT = 1024;
vuuLocationConverter.prototype.REGEX = /(\d{1,2}):(\d{1,2})/;

/**
 * Replaces any province lacation text on Utopia pages with a link to that kingdom
 * on all pages but the kingdom page (because it would just link to itself)
 * handles in-game forums & 'world' pages correctly
 * param:  aDoc - HTMLDocument - document in which to replace locations
 * param:  aPageType - integer - a gVUU.PAGE_ constant
 */
vuuLocationConverter.prototype.convertProvinceLocationsToLinks = function()
{
    this.server = gVUU.servers.getServerByHref(this.doc.location.href);
    this.debug = gVUU.prefs.getBoolPref("vuuGeneralLocalDebug");

    // don't do it for kingdom page because all the links link to the same kingdom page
    if (this.pageType == gVUU.PAGE_KINGDOM) return;
    if (this.pageType == gVUU.PAGE_UNKNOWN) return;

    if (this.pageType == gVUU.PAGE_BOARDS) {
        // if page is FORUMS, then find server from cached kingdom/island numbers
        this.server = gVUU.servers.getServerByForumHref(this.doc.location.href);
    }

    if (!this.server) return;

    // get all text node with province locations within them and convert them to links
    this.convertMaxProvinceLocationTextNodes(this.doc.body);
}

vuuLocationConverter.prototype.shouldNodeBeModified = function(aNode)
{
    if (aNode.parentNode && aNode.parentNode.parentNode && aNode.parentNode.parentNode.parentNode
        && (aNode.parentNode.tagName.toLowerCase() != "a")
        && (aNode.parentNode.parentNode.tagName.toLowerCase() !="a")
        && (aNode.parentNode.parentNode.parentNode.tagName.toLowerCase() !="a")
        && (aNode.parentNode.tagName.toLowerCase() != "input")
        && (aNode.parentNode.parentNode.tagName.toLowerCase() !="input")
        && (aNode.parentNode.parentNode.parentNode.tagName.toLowerCase() != "input")
        && (aNode.parentNode.tagName.toLowerCase() != "select")
        && (aNode.parentNode.parentNode.tagName.toLowerCase() !="select")
        && (aNode.parentNode.parentNode.parentNode.tagName.toLowerCase() != "select"))
    {
        return true;
    } else {
        return false;
    }
}

vuuLocationConverter.prototype.getNodeColor = function(aNode)
{
    var color = null;
    if (aNode.parentNode.tagName.toLowerCase() == "font") {
        color = aNode.parentNode.getAttribute("color");
    } else if (aNode.parentNode.tagName.toLowerCase() == "span") {
        if (aNode.parentNode.style.color) {
            color = aNode.parentNode.style.color;
        }
    } else {
        // text color can also be specified in body tag -
        // eg. <BODY  TEXT=#FFEECC LINK=#77FFFF VLINK=#77AAAA BGCOLOR=#000000>
        color = aNode.ownerDocument.body.getAttribute("text");
    }

    return color;
}

vuuLocationConverter.prototype.convertMaxProvinceLocationTextNodes = function(aNode)
{
    if (aNode == null) return aNode;

    var        span = null;
    var        color = null;

    // nodeType 3 = Node.TEXT
    if (aNode.nodeType == 3) {
        if (aNode.textContent.match(this.REGEX)) {
            if (this.shouldNodeBeModified(aNode)) {
                span = this.doc.createElement("span");
                color = this.getNodeColor(aNode);
                this.convertSingleProvinceLocationTextNode(span, this.REGEX.exec(aNode.textContent), color);
                aNode.parentNode.replaceChild(span, aNode);
                this.numConverted++;
                return span;
            }
        }
    }

    // recursively search children
    for (var m = aNode.firstChild; m != null; m = m.nextSibling) {
        if (this.numConverted <= this.MAX_TO_CONVERT) {
            m = this.convertMaxProvinceLocationTextNodes(m);
        } else {
            return aNode;
        }
    }
    return aNode;
}

vuuLocationConverter.prototype.convertSingleProvinceLocationTextNode = function(aSpan, aExecArray, aColor)
{
    if (!aExecArray) return;

    var        node = null;
    var        newExecArray = null;
    var        linkHref = this.server.fullHref + "scores.cgi?ks=" + aExecArray[1] + "&is=" + aExecArray[2];

    MpDebug(this.debug, "Converting KD location :'" + aExecArray[1] + ":" +  aExecArray[2] + "' to [" + 
                        linkHref + "]");

    if (RegExp.leftContext) {
        node = this.doc.createTextNode(RegExp.leftContext);
        aSpan.appendChild(node);
    }

    node = this.doc.createElement("a");

    node.setAttribute("href", linkHref);

    if (aColor) {
        node.setAttribute("style", "color: " + aColor + ";");
    }

    node.appendChild(this.doc.createTextNode(aExecArray[1] + ":" + aExecArray[2]));
    aSpan.appendChild(node);

    if (RegExp.rightContext) {

        newExecArray = this.REGEX.exec(RegExp.rightContext);

        if (newExecArray) {
            this.convertSingleProvinceLocationTextNode(aSpan, newExecArray, aColor);
        } else {
            node = this.doc.createTextNode(RegExp.rightContext);
            aSpan.appendChild(node);
        }
    }
}
