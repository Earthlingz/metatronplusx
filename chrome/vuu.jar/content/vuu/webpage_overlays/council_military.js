/**
 * Written by Anthony Gabel on 16 November 2004.
 *
 * Performs required modifications to the 'Council -> Military' page:
 *  - caches army return times
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMCouncilMilitary' object. Used to modify the
 * 'Council -> Military' page.
 * param:  aDoc - HTMLDocument - 'Council -> Military' page to modify
 */
function vuuPMCouncilMilitary(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.debug = false;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
}

/**
 * Performs any required modifications to the 'Council -> Military' page by
 * directly modifying its DOM.
 */
vuuPMCouncilMilitary.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    MpDebug(this.debug, "Started Council Military Modification");

    this.cacheArmyReturnTimes();
    MpDebug(this.debug, "Army Return Times Read Successfully");

    this.saveEfficiency();
    MpDebug(this.debug, "Military Efficiencies saved Successfully");

    //dump("Trying to do something new\n");
    //this.addTotalMilitaryCount();
    //dump("New Completed Successfully\n");
}

vuuPMCouncilMilitary.prototype.saveEfficiency = function ()
{
    var     tdNode = gVUUDOM.getDescendentTextNode(this.body, "Offensive Military Effectiveness: ", 1, "e00068");

    tdNode = tdNode.parentNode;

    var     milEff = null;
    var     offMilEff = null;
    var     defMilEff = null;

    // offensive military efficiency
    try {
        offMilEff = tdNode.childNodes[1].firstChild.firstChild.nodeValue;
        offMilEff = gVUUFormatter.removeChar(offMilEff, '%');
    } catch (e) {
        MpDebug(true, "determining offMilEff Failed");
    }

    // defensive military efficiency
    try {
        defMilEff = tdNode.childNodes[5].firstChild.firstChild.nodeValue;
        defMilEff = gVUUFormatter.removeChar(defMilEff, '%');
    } catch (e) {
        MpDebug(true, "determining defMilEff Failed");
    }

    // normal military efficiency
    try {
        var     tdNode = gVUUDOM.getDescendentTextNode(this.body, "At this time, approximately ", 1, "e00068");
        milEff = tdNode.parentNode.childNodes[5].firstChild.nodeValue;
        milEff = gVUUFormatter.removeChar(milEff, '%');
    } catch (e) {
        MpDebug(this.true, "Determining military efficiency failed");
    }

    if (milEff) this.server.cache.militaryEff = milEff;
    if (offMilEff) this.server.cache.offMilEff = offMilEff;
    if (defMilEff) this.server.cache.defMilEff = defMilEff;

    return;
}

/* to make military table display total count of military under training.
 */

vuuPMCouncilMilitary.prototype.addTotalMilitaryCount = function ()
{
    var     tempNode = null
    vuuDebug("CP1");

    tempNode = gVUUDOM.getDescendentTextNode(this.body, "Training", 1, "e00068");
    vuuDebug("CP2");

    if (tempNode != null) {
        MpDebug("CP3");
        tempNode = tempNode.parentNode.parentNode.parentNode;
        // tempNode = tempNode.parentNode.parentNode.parentNode;
        var            trainingHeaderStr = gVUUDOM.getAllText(window, tempNode, "e00090");
        vuuDebug("haha:'" + trainingHeaderStr + "'");
    }
    vuuDebug("CP4");
}

/**
 * Caches Army return times.
 */
vuuPMCouncilMilitary.prototype.cacheArmyReturnTimes = function ()
{
    var        nodeTR = null;
    var        tmpNode = null;
    var        tmpAwayTime = null;
    var        army = null;
    var        awayTimesInit = null;
    var        returnTime = null;
    var        currentTime = new Date();

    awayTimesInit = (this.server.cache.numArmies == 0) ? true : false;

    nodeTR = gVUUDOM.getDescendentTextNode(
                    this.body, "Status", 1, "e00068").parentNode.parentNode;

    // search for each army and cache its return time (or if it is available)
    for (var i = 2; ; i++) {

        if((tmpNode = gVUUDOM.getChildElement(nodeTR, "td", i, "e00069")) == null)
            break;

        if ((tmpNode1 = gVUUDOM.getDescendentTextNode(tmpNode, "(", 1, "e00070")) != null) {
            // army unavailable
            tmpAwayTime = tmpNode1.nodeValue.substring(
                                tmpNode1.nodeValue.indexOf("(") + 1, tmpNode1.nodeValue.indexOf(" days"));

            // 60minutes * 60seconds * 1000milliseconds = hours (utopia days)
            tmpAwayTime = parseFloat(tmpAwayTime) * 3600000;
            returnTime = currentTime.getTime() + parseInt(tmpAwayTime.toFixed(0));

            if (!awayTimesInit) {
                // array already created - set it
                army = this.server.cache.getArmyByIndex(i - 2);
                if (!army.returnTime) army.confirmedHome = false;
                army.returnTime = returnTime;
            } else {
                // creating the array - push it
                this.server.cache.addNewArmy(returnTime, false);
            }
        } else {

            // army is available
            if (!awayTimesInit) {
                // array already created - set it
                army = this.server.cache.getArmyByIndex(i - 2);
                if (!army.returnTime) army.confirmedHome = true;
                army.returnTime = null;
            } else {
                // creating the array - push it
                this.server.cache.addNewArmy(null, true);
            }
        }
    }

    // update army return times
    gVUU.updateArmyReturnTimesSingle();
}
