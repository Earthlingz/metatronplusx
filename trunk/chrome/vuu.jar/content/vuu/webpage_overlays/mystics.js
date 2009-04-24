/**
 * Written by Anthony Gabel on 24 July 2005.
 *
 * Performs required modifications to the Mystics page:
 *  - If a self spell has been cast then cache it's duration
 *  - Set / Remember last spell target and last spell cast
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMMystics' object. Used to modify the Mystics page.
 * param:  aDoc - HTMLDocument - Mystics page to modify
 */
function vuuPMMystics(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.bookmarks = this.server.bookmarkManager;

    this.spellName = null;
    this.spellDuration = null;
}

/**
 * Performs any required modifications to the Mystics page by directly
 * modifying its DOM.
 */
vuuPMMystics.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    this.checkIfSpellCast();
    this.setLastKnownOptions();
    this.setCastSpellAccessKey();

    if (gVUU.prefs.getBoolPref("allBookmarkingEnabled")) {
        this.addBookmarkInformaiton();
    }

}

/**
 * Checks whether a spell has been cast and if so checks if it is a self spell.
 * If so it caches the duration.
 */
vuuPMMystics.prototype.checkIfSpellCast = function ()
{
    var            spellNode = null;
    var            tmpNode = null;
    var            i = null;
    var            found = false;

    if ((spellNode = gVUUDOM.getDescendentTextNode(
        this.body, "Your wizards gather", 1, "e00064")) != null) {
        spellNode = spellNode.parentNode;

        if ((gVUUDOM.getDescendentTextNode(spellNode, "successful", 1, "e00065")) != null) {
            // set this.spellName & this.spellDuration
            this.getSpellFromSpellNode(spellNode);

            if (this.spellName && this.spellDuration) {
                // if the spell already exists in the cache then replace it

                for (i = 0; i < this.server.cache.numSpells; i++) {

                    if (this.spellName == this.server.cache.getSpellByIndex(i).name) {
                        this.server.cache.removeSpellByIndex(i);
                        this.server.cache.addNewSpell(this.spellName, this.spellDuration);
                        found = true;
                        break;
                    }
                }

                // if the spell doesn't exist in the cache then add it
                if (!found) {
                    this.server.cache.addNewSpell(this.spellName, this.spellDuration);
                }

                // update spell durations
                gVUU.updateSpellDurationsSingle();
            }
        }
    }
}

/**
 * Sets the appropriate areas to the last known spell target and spell cast.
 */
vuuPMMystics.prototype.setLastKnownOptions = function ()
{
    var            tmpNode = null;

    // add event listener for custom event. Allows communication between
    // the webpage and this extension
    this.doc.addEventListener("RecordingEvent", this.recordingListener, false);

    // add needed script element for last known options
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");

    tmpNode.textContent =
        " var element = document.createElement('input');"
            + " element.setAttribute('id', 'vuu_comms_recording');"
            + " element.setAttribute('type', 'hidden');"
            + " document.body.appendChild(element);"
            + " function vuuFireRecordingEvent() {"
            + " var element = document.getElementById('vuu_comms_recording');"
            + " var event = document.createEvent('Events');"
            + " event.initEvent('RecordingEvent', true, false);"
            + " element.dispatchEvent(event);"
            + " return true;"
            + " }";

    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);
    this.doc.forms[1].elements.namedItem("castaspell").setAttribute("onclick",
                               "return vuuFireRecordingEvent();");

    // set spell target
    if (gVUU.prefs.getBoolPref("vuuModifyMysticsSetTarget")) {

        if (this.server.cache.lastMagicTarget) {
            gVUUDOM.setSelectBox(this.doc.forms[1].elements.namedItem("targetprovince"),
                               this.server.cache.lastMagicTarget, " (");
        }
    }

    // set spell cast
    if (gVUU.prefs.getBoolPref("vuuModifyMysticsSetOp")) {

        if (this.server.cache.lastMagicOp) {
            gVUUDOM.setSelectBox(this.doc.forms[1].elements.namedItem("spellnum"),
                               this.server.cache.lastMagicOp, " (");
        }
    }
}

/**
 * Sets the access key for casting a spell so the user can use (ALT + accesskey)
 * to cast a spell instead of clicking the button.
 */
vuuPMMystics.prototype.setCastSpellAccessKey = function ()
{
    var            nodeCastSpell = this.doc.forms[1].elements.namedItem("castaspell");

    nodeCastSpell.setAttribute("accesskey", "c");
}

/**
 * Listens for recording events and when fired caches the spell target and
 * spell cast.
 * aEvent - Event - fired recording event
 */
vuuPMMystics.prototype.recordingListener = function(aEvent)
{
    var            doc = aEvent.target.ownerDocument;
    var            server = gVUU.servers.getServerByHref(doc.location.href);
    var            selectBox = null;
    var            text = null;

    // target
    selectBox = doc.forms[1].elements.namedItem("targetprovince");
    text = selectBox.options[selectBox.selectedIndex].text;

    if (text.indexOf(" (") != -1) {
        text = text.substring(0, text.indexOf(" ("));
    }

    server.cache.lastMagicTarget = text;

    // spell
    selectBox = doc.forms[1].elements.namedItem("spellnum");
    text = selectBox.options[selectBox.selectedIndex].text;

    if (text.indexOf(" (") != -1) {
        text = text.substring(0, text.indexOf(" ("));
    }

    server.cache.lastMagicOp = text;
}

/**
 * Sets this.spellName & this.spellDuration from the element containing the success
 * message of the spell.
 * param:  aSpellNode - HTMLElement - element containing full spell success message
 */
vuuPMMystics.prototype.getSpellFromSpellNode = function (aSpellNode)
{
    if (gVUUDOM.getDescendentTextNode(aSpellNode, "sphere of protection", 1)) {
        this.spellName = "Protection";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "filled with fog", 1)) {
        this.spellName = "Fog";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "the magical auras", 1)) {
        this.spellName = "Magic Shield";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "Mystic Aura", 1)) {
        this.spellName = "Mystic Aura";
        this.spellDuration = 99;
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "extraordinarily fertile", 1)) {
        this.spellName = "Fertile Lands";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "Our lands have been blessed by nature for", 1)) {
        // str shouldn't match is "Your wizards gather their runes and begin casting. The spell consumes WXYZ Runes and ... is successful! Unfortunately, that land has been blessed by nature, and our spell had no effect!"
        this.spellName = "Nature's Blessing";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "peasantry is influenced", 1)) {
        this.spellName = "Love & Peace"
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "excellent speed", 1)) {
        this.spellName = "Quick Feet";
        this.spellDuration = 99;
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "builders have been", 1)) {
        this.spellName = "Builder's Boon";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "inspired to work", 1)) {
        this.spellName = "Inspire Army";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "cloaked under the shades", 1)) {
        this.spellName = "Anonymity";
        this.spellDuration = 99;
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "invisible", 1)) {
        this.spellName = "Invisibility";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "police", 1)) {
        this.spellName = "Clear Sight";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "War Spoils", 1)) {
        this.spellName = "War Spoils";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "fanaticism", 1)) {
        this.spellName = "Fanatacism";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "excellent concentration", 1)) {
        this.spellName = "Mind Focus";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "peasants will fight", 1)) {
        this.spellName = "Town Watch";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "more aggressively", 1)) {
        this.spellName = "Aggression";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "dead will be awakened", 1)) {
        this.spellName = "Animate Dead";
        this.spellDuration = 99;
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "being reflected", 1)) {
        this.spellName = "Reflect Magic";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "Shadowlight", 1)) {
        this.spellName = "Shadowlight";
        this.spellDuration = 99;
    } else if (gVUUDOM.getDescendentTextNode(aSpellNode, "signup more quickly", 1)) {
        this.spellName = "Patriotism";
        this.spellDuration =
        parseInt(gVUUDOM.getDescendentElement(aSpellNode, "font", 2).textContent);
    }

}

/**
 * Adds all bookmark information to page
 */
vuuPMMystics.prototype.addBookmarkInformaiton = function ()
{
    var            tmpNode = null;

    // add needed script element for bookmarking / tagging click
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");

    tmpNode.textContent =
        " var element = document.createElement('input');"
            + " element.setAttribute('id', 'vuu_comms_bookmarking');"
            + " element.setAttribute('type', 'hidden');"
            + " document.body.appendChild(element);"
            + " function fire_bookmarking_event(aLocation) {"
            + " var element = document.getElementById('vuu_comms_bookmarking');"
            + " element.setAttribute('value', aLocation);"
            + " var event = document.createEvent('Events');"
            + " event.initEvent('BookmarkingEvent', true, false);"
            + " element.dispatchEvent(event);"
            + " }";

    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);

    // add event listener for custom event. Allows communication between
    // the webpage and this extension
    this.doc.addEventListener("BookmarkingEvent", this.bookmarkingListener, false);

    var            nodeHR = null;
    var            kingdom = this.doc.forms[1].elements.namedItem('SelectK').value;
    var            island = this.doc.forms[1].elements.namedItem('SelectI').value;
    var            bookmark = this.bookmarks.getKingdomBookmark(kingdom, island);

    if (bookmark != null) {
        var        node = gVUUDOM.getDescendentTextNode(this.body, "Casting Spells", 1, "e00089");

        nodeHR = this.doc.createElement('hr');
        nodeHR.setAttribute("style",
            "width: 75%; height: 3px; border: 0; background-color: "
            + this.bookmarks.getColorFromType(bookmark.type) +";");

        tmpNode = node.parentNode;
        tmpNode.parentNode.insertBefore(nodeHR, tmpNode);
    }

    gVUUBookmarks.updateBookmarkDisplay(this.doc, this.bookmarks);
}

/**
 * Listens for bookmarking events fired by the document
 * and acts appropriately.
 */
vuuPMMystics.prototype.bookmarkingListener = function(aEvent)
{
    var            doc = aEvent.target.ownerDocument;
    var            value = aEvent.target.getAttribute("value");
    var            dataArray = value.split(":");
    var            server = gVUU.servers.getServerByHref(doc.location.href);
    var            provinceName = null;

    if (dataArray[0] != "") {
        provinceName = dataArray[0];

        if (provinceName.indexOf(" (") != -1) {
            provinceName = provinceName.substring(0, provinceName.indexOf(" ("));
        }

        server.cache.lastMagicTarget = provinceName;
    }

    if (dataArray[1] == doc.forms[1].elements.namedItem('SelectK').value
        && dataArray[2] == doc.forms[1].elements.namedItem('SelectI').value) {

        if (provinceName != "") {
            var        selectBox = doc.forms[1].elements.namedItem("targetprovince");
            gVUUDOM.setSelectBox(selectBox, provinceName, " (");
            selectBox.setAttribute("style", selectBox.options[selectBox.selectedIndex].
                                                getAttribute("style"));
        }
    } else {
        doc.forms[1].elements.namedItem('SelectK').value = dataArray[1];
        doc.forms[1].elements.namedItem('SelectI').value = dataArray[2];
        doc.forms[1].elements.namedItem('ChangeSelect').click();
    }

}
