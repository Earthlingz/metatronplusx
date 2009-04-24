/**
 * Written by Anthony Gabel on 18 July 2005.
 *
 * Performs required modifications to the various 'Council -> Kingdom Growth' pages
 * (Kingdom Land, Kingdom NW, Kingdom Honor):
 *  - Adds tooltips to graph to give exact values for each bar
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMKingdomGrowth' object. Used to modify the
 * 'Council -> Kingdom Growth' page.
 * param:  aDoc - HTMLDocument - 'Council -> Kingdom Growth' page to modify
 */
function vuuPMKingdomGrowth(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.style = null;      // '1' = NW, '2' = land, '3' = honor
    this.total = null;      // total current kingdom value
    this.maxHeight = null;  // maximum height of chart bars
}

/**
 * Performs any required modifications to the 'Council -> Kingdom Growth'
 * page by directly modifying its DOM.
 */
vuuPMKingdomGrowth.prototype.modify = function ()
{
    var        index = null;

    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    // style=X determines whether displaying NW, land or honor screen
    index = this.doc.location.href.indexOf("style=") + 6; // +6 for "style=".length
    this.style = this.doc.location.href.substring(index, index + 1);

    if (gVUU.prefs.getBoolPref("vuuModifyKingdomGrowthGraphTooltips")) {
        this.addTooltips();
    }
}

/**
 * Adds tooltips to growth chart to give exact values for each bar
 */
vuuPMKingdomGrowth.prototype.addTooltips = function ()
{
    var i = null;
    var text = null;
    var tmpNode = null;
    var tmpNode1 = null;
    var images = new Array();
    var valuePerPixel = null;

    // get this.total
    tmpNode = gVUUDOM.getDescendentTextNode(this.body, "Highest Total", 1, "e00058");

    // TODO - don't think this is set up at the start of the age?
    // have to keep an eye out for it next age
    if (tmpNode) {
        text = tmpNode.nodeValue;
        i = text.indexOf("(") + 1;

        if (1 == this.style) {
            // NW
            this.total = parseInt(gVUUFormatter.removeCommas(
                            text.substring(i, text.indexOf(" ", i))));
        } else if (2 == this.style) {
            // Land
            this.total = parseInt(gVUUFormatter.removeCommas(
                            text.substring(i, text.indexOf(" ", i))));
        } else if (3 == this.style) {
            // Honor
            this.total = parseInt(gVUUFormatter.removeCommas(
                            text.substring(i, text.indexOf(")", i))));
        }

        // get images
        tmpNode = gVUUDOM.getDescendentTextNode(this.body,
            "Your Kingdom's Growth", 1, "e00059").parentNode.parentNode.parentNode;

        tmpNode = gVUUDOM.getChildElement(tmpNode, "tr", 2, "e00060");
        tmpNode1 = gVUUDOM.getChildElement(tmpNode, "td", 2, "e00061");

        for (i = 3; tmpNode1 != null; i++) {
            tmpNode1 = gVUUDOM.getDescendentElement(tmpNode1, "img", 1, "e00062");

            if (tmpNode1.getAttribute("src").indexOf("chart.gif") == -1) {
                images.push(tmpNode1);
            } else {
                break;
            }

            tmpNode1 = gVUUDOM.getChildElement(tmpNode, "td", i, "e00063");
        }

        // TODO - if there are any images - none at start of age?
        if (images.length > 0) {
            // sort images
            images.sort(vuuCompareImgHeight);
            this.maxHeight = parseInt(images[0].getAttribute("height"));
            valuePerPixel = this.total / this.maxHeight;

            for (i = 0; i < images.length; i++) {
                text = gVUUFormatter.fNum(Math.floor(
                valuePerPixel * parseInt(images[i].getAttribute("height"))));

                if (1 == this.style) {
                    // NW
                    text += "gc";
                } else if (2 == this.style) {
                    // Land
                    text += " acres";
                } else if (3 == this.style) {
                    // Honor
                    text += " honor";
                }

                images[i].setAttribute("title", text);
            }
        }
    }
}


/****************************************************
*****************************************************
***** Image Element Height Comparator
*****************************************************
****************************************************/

/**
 * Compares two image Elements based on their height
 * (sorts in descending order)
 * return integer - negative number if a > b (in height)
 *                  positive number if b > a (in height)
 *                  zero if a == b (in height)
 */
function vuuCompareImgHeight(a, b)
{
    return parseInt(b.getAttribute("height")) - parseInt(a.getAttribute("height"));
}
