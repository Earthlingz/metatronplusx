/**
 * Written by Anthony Gabel on 26 November 2004.
 *
 * Performs required modifications to the 'Send Messages' page:
 *  - Adds a message character count to the page
 *  - Adds a confirmation dialog for when sending overlength messages
 *
 * Requires:
 *  vuuOverlay.js
 *  dom_manipulation.js
 */


/**
 * Constructor for a 'vuuPMSendMessages' object. Used to modify the
 * 'Send Messages' page.
 * param:  aDoc - HTMLDocument - 'Send Messages' page to modify
 */
function vuuPMSendMessages(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.bookmarks = this.server.bookmarkManager;

    // maximum length of a message before it will be trimmed
    this.MAX_LENGTH = 1500;
}

/**
 * Performs any required modifications to the 'Send Messages' page by directly
 * modifying its DOM.
 */
vuuPMSendMessages.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    if (gVUU.prefs.getBoolPref("vuuModifySendMsgsConfirm")) {
        this.addSendConfirmation();
    }

    if (gVUU.prefs.getBoolPref("vuuModifySendMsgsCharCount")) {
        this.addCharacterCount();
    }

    this.setLastKnownOptions();

    if (gVUU.prefs.getBoolPref("allBookmarkingEnabled")) {
        this.addBookmarkInformaiton();
    }

    if (gVUU.prefs.getBoolPref("vuuAddMassMessageSupport")) {
        // possibly can be abused
        this.addMassMessageSupport();
    }
}

/*
 */

vuuPMSendMessages.prototype.addMassMessageSupport = function ()
{
    var     dropBoxNode = this.doc.forms[0].elements.namedItem('targetprovince');

    var     provName = new Array();
    var     provVal  = new Array();
    var     kingdom = this.doc.forms[0].elements.namedItem('SelectK').value;
    var     island = this.doc.forms[0].elements.namedItem('SelectI').value;
    var     linkHref = this.server.fullHref
    var     childNode = dropBoxNode.firstChild;
    var     count = 0;

    if (kingdom != this.server.cache.kingdom || island != this.server.cache.island) {
        // not a self kingdom page
        // do not add mass message support
        return;
    }

    while (childNode != null) {
        if (childNode.nodeType != 1) {
            childNode = childNode.nextSibling;
            continue;
        }

        var prvNm = childNode.text;
        var prvVl = childNode.value;

        if (prvNm != "Nobody" && prvNm != "- Awaiting Activation -") {
            provName.push(prvNm);
            provVal.push(prvVl);
            count++;
        }
        childNode = childNode.nextSibling;
    }

    var i = 0;
    var tbl1 = dropBoxNode.parentNode.parentNode.parentNode;
    var formParent = this.doc.forms[0].parentNode;
    var trNode = null;

    var ntbl = this.doc.createElement("TABLE");
    var tbody = this.doc.createElement("TBODY");

    ntbl.appendChild(tbody);
    tbl1.parentNode.appendChild(ntbl);

    for (i = 0; i < count; ++i) {
        // create check-box for each province
        var  flag = true;

        if (trNode == null) {
            trNode = this.doc.createElement("tr");
            tbody.appendChild(trNode);
            flag = false;
        }

        var tdNode = this.doc.createElement("td");
        var ckBox = this.doc.createElement("input");

        ckBox.type="checkbox";
        ckBox.id="ckProv_" + i;
        ckBox.setAttribute("trgt", "frm_" + i);
        ckBox.setAttribute("trgtNm", provName[i]);

        tdNode.align = "center";
        tdNode.appendChild(ckBox);
        trNode.appendChild(tdNode);

        tdNode = this.doc.createElement("td");
        var prvNm = this.doc.createTextNode(provName[i]);

        tdNode.appendChild(prvNm);
        trNode.appendChild(tdNode);

        if (provName[i].indexOf(" (M)") != -1) {
            tdNode.setAttribute("bgcolor", gVUUColors.TITLE_BAR_RED);
        }

        if (flag) {
            trNode = null;
        }

        // create FORM for each province
        var  frmNd = this.doc.createElement("FORM");

        frmNd.name = "frm_" + i;
        frmNd.id   = "frm_" + i;
        frmNd.target = "FRAME_" + i;
        frmNd.method = "POST";
        frmNd.action = linkHref + "msg.cgi?targetprovince=" + provVal[i] + "&SelectK="
        // COMMENT: to test what are we posting on swirve in form of messages.
        //frmNd.action = "http://w3schools.com/js/js_form_action.asp" + "?targetprovince=" + provVal[i] + "&SelectK="
                       + kingdom + "&SelectI=" + island;

        var  grtNd = this.doc.createElement("INPUT");
        grtNd.type = "hidden";
        grtNd.name = "Greeting";
        grtNd.id   = "greet_" + i;
        frmNd.appendChild(grtNd);

        var  msgTxtNd = this.doc.createElement("INPUT");
        msgTxtNd.type = "hidden";
        msgTxtNd.name = "messagetext";
        msgTxtNd.id   = "msgTxt_" + i;
        frmNd.appendChild(msgTxtNd);

        var  sndMsgNd = this.doc.createElement("INPUT");
        sndMsgNd.type = "hidden";
        sndMsgNd.name = "SENDMESSAGE";
        sndMsgNd.value = true;
        frmNd.appendChild(sndMsgNd);

        formParent.appendChild(frmNd);
    }

    // TODO: remove the drop box
    //dropBoxNode.parentNode.parentNode.removeChild(dropBoxNode.parentNode);

    // add java-script that is to be used to send messages script

    var scriptNd = this.doc.createElement("script");
    scriptNd.setAttribute("language", "javascript");

    scriptNd.textContent = "\n" +
        " function vuuSendMassMessage() {"
            + "if (vuuSendMassMessage.whichSubmit == 'send_message') {"
            + " vuuSendMassMessage.whichSubmit = null;"
            + " vuuValidateMessage.whichSubmit = 'send_message';"
            + " var  stNd = document.getElementById('status');"
            + " if (vuuValidateMessage()) {"
            + "  var prvCnt = " + count + ";"
            + "  var msgStr = document.getElementById('msgTxt').value;"
            + "  var grtVal = document.getElementById('greet').value;"
            + "  var ii = 0;"
            + "  if (grtVal < 0 && grtVal > 8) return false;"
            + "  msgStr = \"This is a mass msg sent using MetatronPlus.\\n"
            + "If the sender is not in your KD then delete this message immediately.\\n"
            + "Visit http://metatronplus.googlepages.com to known more about MetatronPlus\\n"
            + "------------------------------------------------------------------\\n\" + msgStr;"
            + "  var prvNms = \"\";"
            + "  for (ii = 0; ii < prvCnt; ++ii) {"
            + "   document.getElementById(\"greet_\" + ii).value = grtVal;"
            + "   document.getElementById(\"msgTxt_\" + ii).value = msgStr;"
            + "  }"
            + "  for (ii = 0; ii < prvCnt; ++ii) {"
            + "   var nd = document.getElementById(\"ckProv_\" + ii);"
            + "   if (nd.checked == true) {"
            + "    prvNms = prvNms + \" <BR>\" + nd.getAttribute(\"trgtNm\");"
            + "    var  frmNd = document.getElementById(\"frm_\" +ii);"
            + "    frmNd.submit();"
            + "   }"
            + "  }"
            + "  if (prvNms != \"\") {"
            + "   stNd.innerHTML = \"<B>Status: </B>Message sent successfully to\"+ prvNms; "
            + "   document.getElementById('msgTxt').value = \"\";"
            + "  } else {"
            + "   stNd.innerHTML = \"<B>Status: </B>No Province selected.\"; "
            + "  }"
            + " } else {"
            + "  stNd.innerHTML = \"<B>Status: </B>Message sending aborted by user\";"
            + " }"
            + " return false;"
            + "} else {"
            + " vuuSendMassMessage.whichSubmit = null;"
            + " return true;"
            + "}"
            + "}";

    this.doc.getElementsByTagName("head").item(0).appendChild(scriptNd);
    this.doc.forms[0].setAttribute("onSubmit", "return vuuSendMassMessage();");

    var  sbtBtnNode = this.doc.forms[0].elements.namedItem('sbtBtn');

    if (sbtBtnNode != null) {
        sbtBtnNode.setAttribute("onclick", "vuuSendMassMessage.whichSubmit = 'send_message'");

        var  brNd = this.doc.createElement("BR");
        var  spNd = this.doc.createElement("SPAN");

        spNd.id = "status";
        spNd.setAttribute("align","left");
        spNd.innerHTML = "<b>Status: </b> Waiting...";

        sbtBtnNode.parentNode.appendChild(brNd);
        sbtBtnNode.parentNode.appendChild(spNd);
    }

    // add dummy frames to avoid send message to open many pages
    for (i = 0; i < count; ++i) {
        var    ifrm = this.doc.createElement("IFRAME");
        ifrm.name = "FRAME_" + i;
        ifrm.setAttribute("style","display:none;");
        formParent.appendChild(ifrm);
    }

    // identifier for Greeting Node
    var     grtNode = this.doc.forms[0].elements.namedItem('Greeting');
    grtNode.id = "greet";

    // identifier for msg-text Node
    var     msgTxtNode = this.doc.forms[0].elements.namedItem('messagetext');
    msgTxtNode.id = "msgTxt";
}

/**
 * Modifies the page to include a confirmation dialog when attempting to send
 * a message over this.MAX_LENGTH characters in length.
 * IMPORTANT: This should be done first (if required) as other modifications may
 * change the order of nodes in 'this.doc'
 */
vuuPMSendMessages.prototype.addSendConfirmation = function ()
{
    var            tmpNode = null;
    var            tmpNode1 = null;

    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");

    tmpNode.textContent =
        " function vuuValidateMessage() {"
            + " if (vuuValidateMessage.whichSubmit == 'send_message'"
            + " && document.forms[0].elements.namedItem('messagetext').value.length "
            + " > " + this.MAX_LENGTH + ") {"
            + " vuuValidateMessage.whichSubmit = null;"
            + " return confirm('Your message is longer than the maximum of "
            + this.MAX_LENGTH + " allowed '"
            + " + 'characters and will be trimmed if sent.\\nSend the message anyway?');"
            + " } "
            + " vuuValidateMessage.whichSubmit = null;"
            + " return true; }";

    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);
    this.doc.forms[0].setAttribute("onSubmit", "return vuuValidateMessage();");

    // both buttons on the page are 'submit' for the same form
    // - need to distinguish between them
    nodeTBody = this.doc.forms[0];
    nodeTBody = gVUUDOM.getChildElement(nodeTBody, "p", 3, "e00051");
    nodeTBody = gVUUDOM.getDescendentElement(nodeTBody, "tbody", 1, "e00052");
    tmpNode1 = gVUUDOM.getChildElement(nodeTBody, "tr", 4, "e00053");
    tmpNode1 = gVUUDOM.getDescendentElement(tmpNode1, "input", 1, "e00054");
    tmpNode1.setAttribute("onclick", "vuuValidateMessage.whichSubmit = 'send_message'");
    tmpNode1.id = "sbtBtn";
}

/**
 * Adds a character count (for the data textbox) to the page. Character count
 * turns red when message goes overlength.
 */
vuuPMSendMessages.prototype.addCharacterCount = function ()
{
    var            tmpNode = null;
    var            tmpNode1 = null;
    var            nodeTBody = null;

    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");

    tmpNode.textContent =
        " function vuuUpdateCharacterCount() {"
            + " var message = document.forms[0].elements.namedItem('messagetext');"
            + " var chars = document.getElementById('spanCharacterCount');"
            + " chars.textContent = '' + message.value.length;"
            + " if (message.value.length > " + this.MAX_LENGTH + ") "
            + " chars.setAttribute('style', 'color: " + gVUUColors.LIGHT_RED + ";');"
            + " else"
            + " chars.setAttribute('style', 'color: " + gVUUColors.AQUA + ";');"
            + " }";

    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);

    tmpNode = this.doc.forms[0].elements.namedItem("messagetext");
    tmpNode.setAttribute("onKeyDown", "vuuUpdateCharacterCount();");
    tmpNode.setAttribute("onKeyUp", "vuuUpdateCharacterCount();");
    tmpNode.setAttribute("onChange", "vuuUpdateCharacterCount();");

    // create a current character count node
    nodeTBody = this.doc.forms[0];
    nodeTBody = gVUUDOM.getChildElement(nodeTBody, "p", 3, "e00055");
    nodeTBody = gVUUDOM.getDescendentElement(nodeTBody, "tbody", 1, "e00056");

    tmpNode = this.doc.createElement("tr");
    tmpNode.setAttribute("align", "center");
    tmpNode.appendChild(this.doc.createTextNode("Current message length: "));

    if (this.doc.forms[0].elements.namedItem("messagetext").value.length <= this.MAX_LENGTH) {
        tmpNode1 = gVUUDOM.createColoredSpan(this.doc, gVUUColors.AQUA,
        "" + this.doc.forms[0].elements.namedItem("messagetext").value.length);
    } else {
        tmpNode1 = gVUUDOM.createColoredSpan(this.doc, gVUUColors.LIGHT_RED,
        "" + this.doc.forms[0].elements.namedItem("messagetext").value.length);
    }

    tmpNode1.setAttribute("id", "spanCharacterCount");
    tmpNode.appendChild(tmpNode1);
    tmpNode.appendChild(this.doc.createTextNode(" characters"));
    tmpNode1 = gVUUDOM.getChildElement(nodeTBody, "tr", 4, "e00057");
    nodeTBody.insertBefore(tmpNode, tmpNode1);
}

/**
 * Sets the appropriate areas to the last known send messages target.
 */
vuuPMSendMessages.prototype.setLastKnownOptions = function ()
{
    // set last send messages target
    if (this.server.cache.lastSendMessageTarget) {
        gVUUDOM.setSelectBox(this.doc.forms[0].elements.namedItem("targetprovince"),
                                this.server.cache.lastSendMessageTarget, " (");
    }
}


/**
 * Adds all bookmark information to page
 */
vuuPMSendMessages.prototype.addBookmarkInformaiton = function ()
{
    // the "reply to message" page doesn't allow you to change kingdom so this
    // won't be needed there...
    var            testNode = this.doc.forms[0].elements.namedItem('SelectK');

    if (testNode == null) {
        return;
    }

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
    this.doc.addEventListener("BookmarkingEvent",
        this.bookmarkingListener, false);

    var            nodeHR = null;
    var            kingdom = this.doc.forms[0].elements.namedItem('SelectK').value;
    var            island = this.doc.forms[0].elements.namedItem('SelectI').value;
    var            bookmark = this.bookmarks.getKingdomBookmark(kingdom, island);

    if (bookmark != null) {
        tmpNode = gVUUDOM.getChildElement(this.doc.forms[0], "p", 1, "eTODO");
        nodeHR = this.doc.createElement('hr');

        nodeHR.setAttribute("style",
            "width: 40%; height: 3px; border: 0; background-color: "
            + this.bookmarks.getColorFromType(bookmark.type) +";");

        tmpNode.parentNode.insertBefore(nodeHR, tmpNode);
    }

    gVUUBookmarks.updateBookmarkDisplay(this.doc, this.bookmarks);
}

/**
 * Listens for bookmarking events fired by the document
 * and acts appropriately.
 */
vuuPMSendMessages.prototype.bookmarkingListener = function(aEvent)
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

        server.cache.lastSendMessageTarget = provinceName;
    }

    if (dataArray[1] == doc.forms[0].elements.namedItem('SelectK').value
        && dataArray[2] == doc.forms[0].elements.namedItem('SelectI').value) {

        if (provinceName != "") {
            var         selectBox = doc.forms[0].elements.namedItem("targetprovince");
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
