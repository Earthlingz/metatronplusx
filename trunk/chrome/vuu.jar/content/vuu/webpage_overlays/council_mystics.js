/**
 * Written by Anthony Gabel on 7 April 2005.
 *
 * Performs required modifications to the 'Council -> Mystics' page:
 *  - caches current self spells
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMCouncilMystics' object. Used to modify the
 * 'Council -> Mystics' page.
 * param:  aDoc - HTMLDocument - 'Council -> Mystics' page to modify
 */
function vuuPMCouncilMystics(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
}

/**
 * Performs any required modifications to the 'Council -> Mystics' page by
 * directly modifying its DOM.
 */
vuuPMCouncilMystics.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    this.cacheSpells();
}

/**
 * Caches current self spells.
 */
vuuPMCouncilMystics.prototype.cacheSpells = function ()
{
    var        currentDate = gVUUDateTime.getCurrentGMTDateNTime();
    var        tmpNode = null;
    var        spellName = null;
    var        spellDuration = null;
    var        index = null;

    tmpNode = gVUUDOM.getDescendentTextNode(this.doc, "---", 1, "e00067");

    this.server.cache.clearSpells();

    if (this.server.hrefID != "gen") {
        this.server.cache.spellLastHourUpdate = currentDate.getHours();
    } else {
        if (currentDate.getMinutes() > 30)
            this.server.cache.spellLastHourUpdate = currentDate.getHours();
        else
            this.server.cache.spellLastHourUpdate = currentDate.getHours() - 1;
    }

    // traverse each element searching for spells
    for (var m = tmpNode.nextSibling; m != null; m = m.nextSibling) {
        if (m.nodeType == 3) {
            // Node.TEXT_NODE
            // '---' indicates the end of the spell list
            if (m.nodeValue.indexOf("---") != -1) {
                break;
            }

            // if a known spell has been found, cache it
            if ((spellName = this.getSpellNameFromDescription(m.nodeValue)) != null) {
                if ((index = m.nodeValue.indexOf("Estimated: ")) != -1) {
                    index += 11;  // "Estimated: ".length
                    spellDuration = parseInt(m.nodeValue.substring(index, m.nodeValue.indexOf(" ", index)));
                } else {
                    spellDuration = 99;
                }

                this.server.cache.addNewSpell(spellName, spellDuration);
            }
        }
    }

    // update spell durations
    gVUU.updateSpellDurationsSingle();
}

/**
 * Returns a spell name from its council -> mystics description
 *
 * param:  aDescription - String - description of spell from council -> mystics page
 * return: String - spell name or NULL if no matching spell found from description
 */
vuuPMCouncilMystics.prototype.getSpellNameFromDescription = function (aDescription)
{
    var        retVal = null;

    if (aDescription.indexOf("Our crops grow") != -1) {
        retVal = "Fertile Lands";
    } else if (aDescription.indexOf("Our troops fight") != -1) {
        retVal = "Protection";
    } else if (aDescription.indexOf("A shield protects") != -1) {
        retVal = "Magic Shield";
    } else if (aDescription.indexOf("Our land is blessed") != -1) {
        retVal = "Nature's Blessing";
    } else if (aDescription.indexOf("Our police have") != -1) {
        retVal = "Clear Sight";
    } else if (aDescription.indexOf("War Spoils give") != -1) {
        retVal = "War Spoils";
    } else if (aDescription.indexOf("Our army fights") != -1) {
        retVal = "Fanatacism";
    } else if (aDescription.indexOf("Our soldiers fight") != -1) {
        retVal = "Aggression";
    } else if (aDescription.indexOf("Our peasants will") != -1) {
        retVal = "Town Watch";
    } else if (aDescription.indexOf("Our people feel") != -1) {
        retVal = "Love & Peace";
    } else if (aDescription.indexOf("Our army is inspired") != -1) {
        retVal = "Inspire Army";
    } else if (aDescription.indexOf("Our lands are protected") != -1) {
        retVal = "Fog";
    } else if (aDescription.indexOf("Our students benefit") != -1) {
        retVal = "Mind Focus";
    } else if (aDescription.indexOf("Our builders work") != -1) {
        retVal = "Builder's Boon";
    } else if (aDescription.indexOf("Our people are feeling") != -1) {
        retVal = "Patriotism";
    } else if (aDescription.indexOf("Our thieves benefit") != -1) {
        retVal = "Invisibility";
    } else if (aDescription.indexOf("Our lands will reflect") != -1) {
        retVal = "Reflect Magic";
    } else if (aDescription.indexOf("Shadowlight protects") != -1) {
        retVal = "Shadowlight";
    } else if (aDescription.indexOf("Our land is protected") != -1) {
        retVal = "Mystic Aura";
    } else if (aDescription.indexOf("We will be able to raise") != -1) {
        retVal = "Animate Dead";
    } else if (aDescription.indexOf("Our armies are blessed") != -1) {
        retVal = "Quick Feet";
    } else if (aDescription.indexOf("Our armies are surrounded") != -1) {
        retVal = "Anonymity";
    }

    return retVal;
}
