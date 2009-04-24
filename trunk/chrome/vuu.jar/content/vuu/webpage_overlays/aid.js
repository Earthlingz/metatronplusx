/**
 * Written by Anthony Gabel on 18 July 2005.
 *
 * Performs required modifications to the Aid page:
 *  - Adds a current aid trade balance value
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMAid' object. Used to modify the Aid page.
 * param:  aDoc - HTMLDocument - Aid page to modify
 */
function vuuPMAid(aDoc)
{
    this.doc = aDoc;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.rules = gVUURules.getRulesByHrefID(this.server.hrefID);
}

/**
 * Performs any required modifications to the Aid page by directly
 * modifying its DOM.
 */
vuuPMAid.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    if (gVUU.prefs.getBoolPref("vuuModifyAidTB")) {
        this.addTradeBalanceValue();
    }
}

/**
 * Adds a current aid trade balance value to the aid table
 */
vuuPMAid.prototype.addTradeBalanceValue = function ()
{
    var        tmpNode = null;
    var        nodeTBody = null;
    var        nodeTR = null;

    // add formatting routines to page
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");
    tmpNode.setAttribute("src", "chrome://vuu/content/util/general.js");
    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");
    tmpNode.setAttribute("src", "chrome://vuu/content/util/formatter.js");
    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);

    // add TB calculations to page
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");
    tmpNode.textContent =
        " var vuuTBFood = " + this.rules.aid.getTradeBalanceValue("food") + ";"
        + " var vuuTBGold = " + this.rules.aid.getTradeBalanceValue("gold") + ";"
        + " var vuuTBRunes = " + this.rules.aid.getTradeBalanceValue("runes") + ";"
        + " var vuuTBSoldiers = " + this.rules.aid.getTradeBalanceValue("soldiers") + ";"
        + " function vuuUpdateTBValue() {"
        + "   var tb = 0;"
        + "   tb += vuuGetTBValue(document.forms[0].elements.namedItem('tradefood').value, vuuTBFood);"
        + "   tb += vuuGetTBValue(document.forms[0].elements.namedItem('trademoney').value, vuuTBGold);"
        + "   tb += vuuGetTBValue(document.forms[0].elements.namedItem('traderunes').value, vuuTBRunes);"
        + "   tb += vuuGetTBValue(document.forms[0].elements.namedItem('trademilitary').value, vuuTBSoldiers);"
        + "   document.getElementById('vuu_tb_value').textContent ="
        + " gVUUFormatter.fNum(tb) + 'gc';"
        + " }"
        + "\n"
        + " function vuuGetTBValue(aText, aTBValue) {"
        + "   var text = gVUUFormatter.removeCommas(aText);"
        + "   if (gVUUFormatter.isStringNumberSymbol(text)) {"
        + "     return vuuRoundTBValue(parseInt(text)"
        + "       * gVUUFormatter.getNumberSymbolMultiplier(text) * aTBValue);"
        + "   } else"
        + "     return 0;"
        + " }"
        + "\n"
        + " function vuuRoundTBValue(aNum) {"
        + "   var numFloor = Math.floor(aNum);"
        + "   var even = (numFloor % 2) == 0;"
        + "   if (even) {"
        + "     var tmp = aNum - numFloor;"
        + "     return (tmp <= 0.5) ? numFloor : Math.ceil(aNum);"
        + "   } else {"
        + "     return Math.round(aNum);"
        + "   }"
        + " }"
        + " vuuUpdateTBValue();";
    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);

    // food
    tmpNode = this.doc.forms[0].elements.namedItem("tradefood");
    tmpNode.setAttribute("size", "12");
    tmpNode.setAttribute("onKeyUp", "vuuUpdateTBValue();");
    tmpNode.setAttribute("onChange", "vuuUpdateTBValue();");

    // gold
    tmpNode = this.doc.forms[0].elements.namedItem("trademoney");
    tmpNode.setAttribute("size", "12");
    tmpNode.setAttribute("onKeyUp", "vuuUpdateTBValue();");
    tmpNode.setAttribute("onChange", "vuuUpdateTBValue();");

    //runes
    tmpNode = this.doc.forms[0].elements.namedItem("traderunes");
    tmpNode.setAttribute("size", "12");
    tmpNode.setAttribute("onKeyUp", "vuuUpdateTBValue();");
    tmpNode.setAttribute("onChange", "vuuUpdateTBValue();");

    // soldiers
    tmpNode = this.doc.forms[0].elements.namedItem("trademilitary");
    tmpNode.setAttribute("size", "12");
    tmpNode.setAttribute("onKeyUp", "vuuUpdateTBValue();");
    tmpNode.setAttribute("onChange", "vuuUpdateTBValue();");

    // actual trade balance value display node
    tmpNode = this.doc.forms[0];
    nodeTBody = gVUUDOM.getDescendentElement(tmpNode, "tbody", 1, "e00049");

    nodeTR = this.doc.createElement("tr");
    tmpNode = this.doc.createElement("td");
    tmpNode.textContent = "TB Value";
    nodeTR.appendChild(tmpNode);
    tmpNode = this.doc.createElement("td");
    nodeTR.appendChild(tmpNode);
    tmpNode = this.doc.createElement("td");
    tmpNode.setAttribute("id", "vuu_tb_value");
    tmpNode.setAttribute("align", "right");
    tmpNode.textContent = "0gc";
    nodeTR.appendChild(tmpNode);

    nodeTBody.insertBefore(nodeTR,
        gVUUDOM.getChildElement(nodeTBody, "tr", 7, "e00050"));
}
