/**
 * Written by Anthony Gabel on 06 August 2005.
 *
 * Performs required modifications to the Thievery page:
 *  - Set / Remember last thievery target, last operation performed and last
 *    number of thieves sent
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMThievery' object. Used to modify the Thievery page.
 * param:  aDoc - HTMLDocument - Thievery page to modify
 */
function vuuPMThievery(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.bookmarks = this.server.bookmarkManager;
}

/**
 * Performs any required modifications to the Thievery page by directly
 * modifying its DOM.
 */
vuuPMThievery.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    this.setLastKnownOptions();
    this.setRunOperationAccessKey();

    if (gVUU.prefs.getBoolPref("allBookmarkingEnabled")) {
        this.addBookmarkInformaiton();
    }
}

/**
 * Sets the appropriate areas to the last known thievery target, last operation
 * performed and last number of thieves sent.
 */
vuuPMThievery.prototype.setLastKnownOptions = function ()
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

    var            nodeRunOperation = null;

    nodeRunOperation = this.doc.forms[0].elements.namedItem("AmtSend").parentNode.parentNode.parentNode;
    if (this.doc.forms[0].elements.namedItem("landchoice")){
        nodeRunOperation = gVUUDOM.getChildElement(nodeRunOperation, "tr", 4, "e00131");
    } else {
        nodeRunOperation = gVUUDOM.getChildElement(nodeRunOperation, "tr", 3, "e00131");
    }
    nodeRunOperation = gVUUDOM.getDescendentElement(nodeRunOperation, "input", 1, "e00132");
    nodeRunOperation.setAttribute("onclick", "return vuuFireRecordingEvent();");

    // set last thievery target
    if (gVUU.prefs.getBoolPref("vuuModifyThieverySetTarget")) {

        if (this.server.cache.lastThieveryTarget) {
        gVUUDOM.setSelectBox(this.doc.forms[0].elements.namedItem("targetprovince"),
                                this.server.cache.lastThieveryTarget, " (");
        }
    }

    // set last operation performed
    if (gVUU.prefs.getBoolPref("vuuModifyThieverySetOp")) {

        if (this.server.cache.lastThieveryOp) {
            gVUUDOM.setSelectBox(this.doc.forms[0].elements.namedItem("Thiefnum"),
                                this.server.cache.lastThieveryOp, " (");
        }

        if (this.server.cache.lastThieveryOpBuilding) {
            gVUUDOM.setSelectBox(this.doc.forms[0].elements.namedItem("landchoice"),
                                this.server.cache.lastThieveryOpBuilding, " (");
        }
    }

    // set last number of thieves sent
    if (gVUU.prefs.getBoolPref("vuuModifyThieverySetThievesSent")) {

        if (this.server.cache.lastThievesSent) {
            this.doc.forms[0].elements.namedItem("AmtSend").value = this.server.cache.lastThievesSent;
        }
    }
}

/**
 * Sets the access key for running an operation so the user can use
 * (ALT + accesskey) to run an operation instead of clicking the button.
 */
vuuPMThievery.prototype.setRunOperationAccessKey = function ()
{
    var            nodeRunOperation = null;

    nodeRunOperation = this.doc.forms[0].elements.namedItem("AmtSend").parentNode.parentNode.parentNode;
    if (this.doc.forms[0].elements.namedItem("landchoice")){
        nodeRunOperation = gVUUDOM.getChildElement(nodeRunOperation, "tr", 4, "e00131");
    } else {
        nodeRunOperation = gVUUDOM.getChildElement(nodeRunOperation, "tr", 3, "e00131");
    }
    nodeRunOperation = gVUUDOM.getDescendentElement(nodeRunOperation, "input", 1, "e00132");
    nodeRunOperation.setAttribute("accesskey", "r");
}

/**
 * Listens for recording events and when fired caches the thievery target,
 * the operation performed and the number of thieves sent.
 * aEvent - Event - fired recording event
 */
vuuPMThievery.prototype.recordingListener = function(aEvent)
{
    var            doc = aEvent.target.ownerDocument;
    var            server = gVUU.servers.getServerByHref(doc.location.href);
    var            selectBox = null;
    var            textBox = null;
    var            text = null;

    // target
    selectBox = doc.forms[0].elements.namedItem("targetprovince");
    text = selectBox.options[selectBox.selectedIndex].text;
    if (text.indexOf(" (") != -1) {
        text = text.substring(0, text.indexOf(" ("));
    }

    server.cache.lastThieveryTarget = text;

    // thievery operation
    selectBox = doc.forms[0].elements.namedItem("Thiefnum");
    text = selectBox.options[selectBox.selectedIndex].text;
    if (text.indexOf(" (") != -1) {
        text = text.substring(0, text.indexOf(" ("));
    }

    server.cache.lastThieveryOp = text;

    if (doc.forms[0].elements.namedItem("landchoice")) {
        selectBox = doc.forms[0].elements.namedItem("landchoice");
        text = selectBox.options[selectBox.selectedIndex].text;
        if (text.indexOf(" (") != -1) {
            text = text.substring(0, text.indexOf(" ("));
        }
        server.cache.lastThieveryOpBuilding = text;
    } else {
        server.cache.lastThieveryOpBuilding = null;
    }

    // thieves to send
    textBox = doc.forms[0].elements.namedItem("AmtSend");
    if (gVUUFormatter.isStringNumber(textBox.value)) {
        server.cache.lastThievesSent = parseInt(textBox.value);
    }
}

/**
 * Adds all bookmark information to page
 */
vuuPMThievery.prototype.addBookmarkInformaiton = function ()
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
    var            kingdom = this.doc.forms[0].elements.namedItem('SelectK').value;
    var            island = this.doc.forms[0].elements.namedItem('SelectI').value;
    var            bookmark = this.bookmarks.getKingdomBookmark(kingdom, island);

    if (bookmark != null) {
        var        node = gVUUDOM.getDescendentTextNode(this.body, "Select Operation:", 1, "e00089");

        nodeHR = this.doc.createElement('hr');
        nodeHR.setAttribute("style",
            "width: 60%; height: 3px; border: 0; background-color: "
            + this.bookmarks.getColorFromType(bookmark.type) +";");

        tmpNode = node.parentNode.parentNode.parentNode.parentNode;
        tmpNode.parentNode.insertBefore(nodeHR, tmpNode);
    }

    gVUUBookmarks.updateBookmarkDisplay(this.doc, this.bookmarks);
}

/**
 * Listens for bookmarking events fired by the document
 * and acts appropriately.
 */
vuuPMThievery.prototype.bookmarkingListener = function(aEvent)
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

        server.cache.lastThieveryTarget = provinceName;
    }

    if (dataArray[1] == doc.forms[0].elements.namedItem('SelectK').value
        && dataArray[2] == doc.forms[0].elements.namedItem('SelectI').value) {

        if (provinceName != "") {
            var        selectBox = doc.forms[0].elements.namedItem("targetprovince");
            gVUUDOM.setSelectBox(selectBox, provinceName, " (");
            selectBox.setAttribute("style", selectBox.options[selectBox.selectedIndex].
                                                getAttribute("style"));
        }
    } else {
        doc.forms[0].elements.namedItem('SelectK').value = dataArray[1];
        doc.forms[0].elements.namedItem('SelectI').value = dataArray[2];
        doc.forms[0].elements.namedItem('ChangeSelect').click();
    }
}
