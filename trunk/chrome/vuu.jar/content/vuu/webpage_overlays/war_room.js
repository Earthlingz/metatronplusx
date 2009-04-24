/**
 * Written by Anthony Gabel on 15 December 2004.
 *
 * Performs required modifications to the 'War Room' page:
 *  - Dynamic raw offense calculation
 *  - Attack confirmation
 *
 * Requires:
 *  vuuOverlay.js
 *  vuuRules.js
 *  dom_manipulation.js
 */

/**
 * Constructor for a 'vuuPMWarRoom' object. Used to modify the 'War Room' page.
 * param:  aDoc - HTMLDocument - 'War Room' page to modify
 */
function vuuPMWarRoom(aDoc)
{
    this.doc = aDoc;
    this.body = aDoc.body;
    this.server = gVUU.servers.getServerByHref(aDoc.location.href);
    this.rules = gVUURules.getRulesByHrefID(this.server.hrefID);
    this.bookmarks = this.server.bookmarkManager;
}

/**
 * Performs any required modifications to the 'War Room' page by directly
 * modifying its DOM.
 */
vuuPMWarRoom.prototype.modify = function ()
{
    // only modify once
    if (this.doc.getElementById("vuu_modified") != null) return;

    this.setLastKnownOptions();

    if (gVUU.prefs.getBoolPref("vuuModifyWarRoomSetNumGenerals"))
        this.setDefaultGenerals();
    if (gVUU.prefs.getBoolPref("vuuConfirmAttack"))
        this.addAttackConfirmation();
    if (gVUU.prefs.getBoolPref("vuuModifyWarRoomRawOffense"))
        this.addRawOffenseCalculation();

    if (gVUU.prefs.getBoolPref("allBookmarkingEnabled")) {
        this.addBookmarkInformaiton();
    }
}

/**
 * Sets the number of generals to a preferences specified default
 */
vuuPMWarRoom.prototype.setDefaultGenerals = function ()
{
    this.doc.forms[0].elements.namedItem("NUMGEN").value =
        gVUU.prefs.getIntPref("vuuModifyWarRoomDefaultNumGenerals");
}

/**
 * Adds an attack confirmation dialog before submitting an attack.
 */
vuuPMWarRoom.prototype.addAttackConfirmation = function ()
{
    var            tmpNode = null;
    var            offName = null;
    var            eliteName = null;

    // ensure forms validates before submission
    this.doc.forms[0].setAttribute("onSubmit", "return vuuValidateAttack();");

    // two buttons can 'submit' so we need to identify the button that
    // we want to validate
    this.doc.forms[0].elements.namedItem("sendattack").setAttribute(
            "onclick", "vuuValidateAttack.whichSubmit = 'prepare_military'");

    // retrieve the names of the units for use in confirmation text
    eliteName = this.doc.forms[0].elements.namedItem("ARMY4")
        .parentNode.previousSibling.previousSibling.textContent;

    offName = this.doc.forms[0].elements.namedItem("ARMY2")
        .parentNode.previousSibling.previousSibling.textContent;

    // create the validation script
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");

    tmpNode.textContent =
        "\n function vuuValidateAttack() {\n"
            + " vuuFireRecordingEvent();\n"
            + " var confirmText = null;\n"
            + " var tmpSelect = null;\n"
            + " var provToAttack = null;\n"
            + " var attackType = null;\n"
            + " var form = document.forms[0];\n"
            + " if (vuuValidateAttack.whichSubmit == 'prepare_military') {\n"
            + "  vuuValidateAttack.whichSubmit = null;\n"
            + "  var  modOff = null;\n"
            + "  var  rawOff = null;\n"
            + "  try {\n"
            + "   if (updateRawOffense) {\n"
            + "    updateRawOffense();\n"
            + "    modOff  = modOffVal;\n"
            + "    rawOff  = rawOffVal;\n"
            + "   }\n"
            + "  } catch (e) {\n"
            + "   alert('MetatronPlus : \\n Error occurred in confirm dailog script \\n "
                + "Either enable Raw/Mod Offense insertion to get confirm box \\n "
                + "or Disable confirm box setting\\n "
                + "\\n Reload page after changing settings');\n"
            + "   return false; \n"
            + "  };\n"
            + "  tmpSelect = form.targetprovince;\n"
            + "  provToAttack = tmpSelect.options[tmpSelect.selectedIndex].text;\n"
            + "  tmpSelect = form.attacknum;\n"
            + "  attackType = tmpSelect.options[tmpSelect.selectedIndex].text;\n"
            + "  confirmText = ' --== Attack Summary ==-- \\n\\n'"
            + "  + provToAttack + '\\n'"
            + "  + attackType + '\\n\\n'"
            + "  + 'Generals: ' + form.NUMGEN.value + '\\n'"
            + "  + 'Soldiers: ' + gVUUFormatter.fNum(form.ARMY1.value) + '\\n'"
            + "  + '" + offName + ": ' + gVUUFormatter.fNum(form.ARMY2.value) + '\\n'"
            + "  + '" + eliteName + ": ' + gVUUFormatter.fNum(form.ARMY4.value) + '\\n';\n"
            + "  if (form.ARMY6) {\n"
            + "   confirmText += 'War Horses: '"
            + "   + gVUUFormatter.fNum(form.ARMY6.value) + '\\n';\n"
            + "  }\n"
            + "  if (form.MERC) {\n"
            + "   confirmText += 'Mercenaries: '"
            + "   + gVUUFormatter.fNum(form.MERC.value) + '\\n';\n"
            + "  }\n"
            + "  if (form.PRIS) {\n"
            + "   confirmText += 'Prisoners: '"
            + "   + gVUUFormatter.fNum(form.PRIS.value) + '\\n';\n"
            + "  }\n"
            + "  if (rawOff != null) {\n"
            + "   confirmText += 'Raw Offense: '+ rawOff + '\\n';\n"
            + "  }\n"
            + "  if (modOff != null) {\n"
            + "   confirmText += 'Mod Offense: '+ modOff + '\\n';\n"
            + "  }\n"
            + "  "
            + "  return confirm(confirmText);\n"
            + " } else {\n"
            + "  return true;\n"
            + " }\n"
            + " }\n";

    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);
}

/**
 * Adds a raw offense calculation to the military table.
 */
vuuPMWarRoom.prototype.addRawOffenseCalculation = function ()
{
    var            tmpNode = null;
    var            tmpNode1 = null;

    var            offName = null;
    var            race = null;
    var            unitsPerMerc = 999999999999;
    var            availGenerals = 0;
    var            availSoldiers = 0;
    var            availOffSpecs = 0;
    var            availDefSpecs = this.server.cache.defspecs;
    var            availElites = 0;
    var            availWarHorses = 0;
    var            availMercs = 0;
    var            availPrisoners = 0;
    var            offMilEff = this.server.cache.offMilEff;
    var            defMilEff = this.server.cache.defMilEff;
    var            acres = this.server.cache.acres;

    if (offMilEff == null) {
        offMilEff = -1;
    }

    if (defMilEff == null) {
        defMilEff = -1;
    }

    if (availDefSpecs == null) {
        availDefSpecs = -1;
    }

    // get the current race (used to determine unit strengths)
    offName = this.doc.forms[0].elements.namedItem("ARMY2").parentNode.
                   previousSibling.previousSibling.textContent;

    race = this.rules.races.getRaceFromOffSpecName(offName);

    // how many troops to send 1 merc?
    tmpNode = gVUUDOM.getDescendentTextNode(this.doc.forms[0].parentNode,
                        "Mercenary Rate:", 1, "e00085");

    //unitsPerMerc = parseInt(tmpNode.nodeValue.substring(
    //        tmpNode.nodeValue.indexOf("per ") + 4, tmpNode.nodeValue.indexOf(" loyal")));
    unitsPerMerc = parseInt(tmpNode.parentNode.nextSibling.firstChild.nextSibling.firstChild.nodeValue);

    // get available number of generals & ensure changing updates raw offense
    this.doc.forms[0].elements.namedItem("NUMGEN").setAttribute("onKeyUp", "updateRawOffense();");
    this.doc.forms[0].elements.namedItem("NUMGEN").setAttribute("onChange", "updateRawOffense();");

    tmpNode = gVUUDOM.getDescendentTextNode(this.doc.forms[0].parentNode,
                        "Available Generals:", 1, "e00086");

    //availGenerals = parseInt(tmpNode.nodeValue.substring(tmpNode.nodeValue.indexOf(": ") + 2, tmpNode.nodeValue.indexOf(")")));
    availGenerals = parseInt(tmpNode.parentNode.nextSibling.firstChild.firstChild.nodeValue);

    // get availSoldiers & ensure changing updates raw offense
    availSoldiers = parseInt(gVUUFormatter.removeCommas(
        this.doc.forms[0].elements.namedItem("ARMY1").parentNode.previousSibling.textContent));
    this.doc.forms[0].elements.namedItem("ARMY1").setAttribute("onKeyUp", "updateRawOffense();");
    this.doc.forms[0].elements.namedItem("ARMY1").setAttribute("onChange", "updateRawOffense();");

    // get availOffSpecs & ensure changing updates raw offense
    availOffSpecs = parseInt(gVUUFormatter.removeCommas(
        this.doc.forms[0].elements.namedItem("ARMY2").parentNode.previousSibling.textContent));
    this.doc.forms[0].elements.namedItem("ARMY2").setAttribute("onKeyUp", "updateRawOffense();");
    this.doc.forms[0].elements.namedItem("ARMY2").setAttribute("onChange", "updateRawOffense();");

    // get availElites & ensure changing updates raw offense
    availElites = parseInt(gVUUFormatter.removeCommas(
        this.doc.forms[0].elements.namedItem("ARMY4").parentNode.previousSibling.textContent));
    this.doc.forms[0].elements.namedItem("ARMY4").setAttribute("onKeyUp", "updateRawOffense();");
    this.doc.forms[0].elements.namedItem("ARMY4").setAttribute("onChange", "updateRawOffense();");

    // get avail war horses (if race can't have warhorses this won't be here)
    // & ensure changing updates raw offense
    if (this.doc.forms[0].elements.namedItem("ARMY6")) {
        availWarHorses = parseInt(gVUUFormatter.removeCommas(
        this.doc.forms[0].elements.namedItem("ARMY6").parentNode.previousSibling.textContent));
        this.doc.forms[0].elements.namedItem("ARMY6").setAttribute("onKeyUp", "updateRawOffense();");
        this.doc.forms[0].elements.namedItem("ARMY6").setAttribute("onChange", "updateRawOffense();");
    }

    // get avail mercenaries (if not enough money this won't be here)
    // & ensure changing updates raw offense
    if (this.doc.forms[0].elements.namedItem("MERC")) {
        availMercs = parseInt(gVUUFormatter.removeCommas(
        this.doc.forms[0].elements.namedItem("MERC").parentNode.previousSibling.textContent));
        this.doc.forms[0].elements.namedItem("MERC").setAttribute("onKeyUp", "updateRawOffense();");
        this.doc.forms[0].elements.namedItem("MERC").setAttribute("onChange", "updateRawOffense();");
    }

    // get avail prisoners (if no prisoners this won't be here)
    // & ensure changing updates raw offense
    if (this.doc.forms[0].elements.namedItem("PRIS")) {
        availPrisoners = parseInt(gVUUFormatter.removeCommas(
        this.doc.forms[0].elements.namedItem("PRIS").parentNode.previousSibling.textContent));
        this.doc.forms[0].elements.namedItem("PRIS").setAttribute("onKeyUp", "updateRawOffense();");
        this.doc.forms[0].elements.namedItem("PRIS").setAttribute("onChange", "updateRawOffense();");
    }

    // add raw offense row to table
    tmpNode = this.doc.createElement("tr");
    this.doc.forms[0].elements.namedItem("ARMY1").parentNode.parentNode.parentNode.appendChild(tmpNode);
    tmpNode1 = this.doc.createElement("th");
    tmpNode1.textContent = "Raw Offense (- Gens) ";
    tmpNode1.setAttribute("align", "left");
    tmpNode.appendChild(tmpNode1);
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.setAttribute("colspan", "2");
    tmpNode1.setAttribute("id", "rawOffense");
    tmpNode1.setAttribute("align", "right");
    tmpNode.appendChild(tmpNode1);

    // add Mod offense row to table
    tmpNode = this.doc.createElement("tr");
    this.doc.forms[0].elements.namedItem("ARMY1").parentNode.parentNode.parentNode.appendChild(tmpNode);
    tmpNode1 = this.doc.createElement("th");
    tmpNode1.textContent = "Mod Offense (+ Gens) ";
    tmpNode1.setAttribute("align", "left");
    tmpNode.appendChild(tmpNode1);
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.setAttribute("colspan", "2");
    tmpNode1.setAttribute("id", "modOffense");
    tmpNode1.setAttribute("align", "right");
    tmpNode.appendChild(tmpNode1);

    // add OPA at home row to the table
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.setAttribute("colspan", "2");
    tmpNode1.setAttribute("id", "modOPA");
    tmpNode1.setAttribute("align", "right");
    tmpNode.appendChild(tmpNode1);

    // add Mod defense at home row to the table
    tmpNode = this.doc.createElement("tr");
    this.doc.forms[0].elements.namedItem("ARMY1").parentNode.parentNode.parentNode.appendChild(tmpNode);
    tmpNode1 = this.doc.createElement("th");
    tmpNode1.textContent = "Mod Def left at home ";
    tmpNode1.setAttribute("align", "left");
    tmpNode.appendChild(tmpNode1);
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.setAttribute("colspan", "2");
    tmpNode1.setAttribute("id", "modDefense");
    tmpNode1.setAttribute("align", "right");
    tmpNode.appendChild(tmpNode1);

    // add DPA at home row to the table
    tmpNode1 = this.doc.createElement("td");
    tmpNode1.setAttribute("colspan", "2");
    tmpNode1.setAttribute("id", "modDPA");
    tmpNode1.setAttribute("align", "right");
    tmpNode.appendChild(tmpNode1);

    // Add script to 'head' with vars for unit strengths & an updateRawOffense function

    // add needed formatting routines to page (formatter.js requires general.js)
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");
    tmpNode.setAttribute("src", "chrome://vuu/content/util/general.js");
    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");
    tmpNode.setAttribute("src", "chrome://vuu/content/util/formatter.js");
    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);

    // add raw offense calculations to page
    tmpNode = this.doc.createElement("script");
    tmpNode.setAttribute("language", "javascript");
    tmpNode.textContent =
        "   var modOffVal = 0; "
        + " var rawOffVal = 0; "
        +  "function updateRawOffense() {"
            + " var acres = " + acres +";"
            + " var unitsPerMerc = " + unitsPerMerc +";"
            + " var availGenerals = " + availGenerals +";"
            + " var availSoldiers = " + availSoldiers +";"
            + " var soldierOff = " + this.rules.races.getSoldierOff(race) +";"
            + " var soldierDef = " + this.rules.races.getSoldierDef(race) +";"
            + " var availOffSpecs = " + availOffSpecs +";"
            + " var offSpecOff = " + this.rules.races.getSpecOff(race) +";"
            + " var availDefSpecs = " + availDefSpecs +";"
            + " var defSpecDef = " + this.rules.races.getSpecDef(race) +";"
            + " var availElites = " + availElites +";"
            + " var eliteOff = " + this.rules.races.getEliteOff(race) +";"
            + " var eliteDef = " + this.rules.races.getEliteDef(race) +";"
            + " var availWarHorses = " + availWarHorses +";"
            + " var warHorseOff = " + this.rules.races.getWarHorseOff(race) +";"
            + " var availMercs = " + availMercs +";"
            + " var mercOff = " + this.rules.races.getMercOff(race) +";"
            + " var availPrisoners = " + availPrisoners +";"
            + " var prisOff = " + this.rules.races.getPrisOff(race) +";"
            + " var generals = 0;"
            + " var soldiers = 0;"
            + " var offSpecs = 0;"
            + " var elites = 0;"
            + " var warHorses = 0;"
            + " var mercs = 0;"
            + " var prisoners = 0;"
            + " var tmpNode = null;"
            + " var rawOffense = 0;"
            + " var modOffense = 0;"
            + " var rawDefense = 0;"
            + " var modDefense = 0;"
            + " var maxWarHorses = 0;"
            + " var maxMercsPris = 0;"
            + " var offMilEff = " + offMilEff + "; \n"
            + " var defMilEff = " + defMilEff + "; \n"
            + " var form = document.forms[0];"
            + " generals = parseInt(gVUUFormatter.removeCommas(form.elements.namedItem('NUMGEN').value));"
            + " generals = (generals > availGenerals) ? availGenerals : generals;"
            + " generals = (generals < 0) ? 0 : generals;"
            + " soldiers = parseInt(gVUUFormatter.removeCommas(form.elements.namedItem('ARMY1').value));"
            + " soldiers = (soldiers > availSoldiers) ? availSoldiers : soldiers;"
            + " offSpecs = parseInt(gVUUFormatter.removeCommas(form.elements.namedItem('ARMY2').value));"
            + " offSpecs = (offSpecs > availOffSpecs) ? availOffSpecs : offSpecs;"
            + " elites = parseInt(gVUUFormatter.removeCommas(form.elements.namedItem('ARMY4').value));"
            + " elites = (elites > availElites) ? availElites : elites;"
            + " maxWarHorses = soldiers + offSpecs + elites;"
            + " maxMercsPris = Math.floor((soldiers + offSpecs + elites) / unitsPerMerc);\n"
            + " if ((tmpNode = form.elements.namedItem('ARMY6'))) {"
            + " warHorses = parseInt(gVUUFormatter.removeCommas(tmpNode.value));"
            + " warHorses = (warHorses > availWarHorses) ? availWarHorses : warHorses;"
            + " warHorses = (warHorses > maxWarHorses) ? maxWarHorses : warHorses;"
            + " }\n"
            + " if ((tmpNode = form.elements.namedItem('MERC'))) {"
            + " mercs = parseInt(gVUUFormatter.removeCommas(tmpNode.value));"
            + " mercs = (mercs > availMercs) ? availMercs : mercs;"
            + " }\n"
            + " if ((tmpNode = form.elements.namedItem('PRIS'))) {"
            + " prisoners = parseInt(gVUUFormatter.removeCommas(tmpNode.value));"
            + " prisoners = (prisoners > availPrisoners) ? availPrisoners : prisoners;"
            + " }\n"
            + " if (mercs + prisoners > maxMercsPris) {"
            + " if (mercs > maxMercsPris) {"
            + " prisoners = 0;"
            + " mercs = maxMercsPris;"
            + " } else {"
            + " prisoners = maxMercsPris - mercs;"
            + " }"
            + " }\n"
            + " rawDefense = ((availSoldiers - soldiers) * soldierDef) + "
            + " ((availElites - elites) * eliteDef) + "
            + " ((availDefSpecs) * defSpecDef);"
            + " rawOffense = (soldiers * soldierOff) + (offSpecs * offSpecOff)"
            + " + (elites * eliteOff) + (warHorses * warHorseOff)"
            + " + (mercs * mercOff) + (prisoners * prisOff);"
            + " if (availDefSpecs == -1) {"
            + " document.getElementById('modDefense').textContent = "
            + " 'Def Spec count not known';"
            + " } else if (defMilEff == -1) {"
            + " document.getElementById('modDefense').textContent = "
            + " 'Def. M.E. not known';"
            + " } else {"
            + " document.getElementById('modDefense').textContent = "
            + " gVUUFormatter.fNum(Math.floor(rawDefense * defMilEff/100));"
            + " document.getElementById('modDPA').textContent = "
            + " (Math.floor((rawDefense * defMilEff)/acres) / 100).toFixed(2) + ' DPA';"
            + " }"
            + " document.getElementById('rawOffense').textContent = "
            + " gVUUFormatter.fNum(Math.floor(rawOffense));"
            + " rawOffVal = Math.floor(rawOffense);"
            + " var modNd1 = document.getElementById('modOffense');"
            + " var modNd2 = document.getElementById('modOPA');"
            + " if (offMilEff == -1)  { "
            + " modNd1.textContent = \"Off. M.E. not known\";"
            + " modNd2.textContent = \"\";"
            + " modOffVal = \"Off. M.E. not known\";"
            + " } else {"
            + " modOffense = rawOffense * ((generals - 1) * 0.03  + 1) * (generals > 0) * offMilEff / 100;"
            + " modNd1.textContent = gVUUFormatter.fNum(Math.floor(modOffense));"
            + " modNd2.textContent = Math.floor(modOffense / acres).toFixed(2) + ' OPA';"
            + " modOffVal = Math.floor(modOffense); "
            + " }"
            + "}"
            + " updateRawOffense()";

    this.doc.getElementsByTagName("head").item(0).appendChild(tmpNode);
}

/**
 * Sets the appropriate areas to the last known warroom target and last
 * known attack type.
 */
vuuPMWarRoom.prototype.setLastKnownOptions = function ()
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
    this.doc.forms[0].elements.namedItem("sendattack").
                         setAttribute("onclick", "return vuuFireRecordingEvent();");

    // set last warroom target
    if (gVUU.prefs.getBoolPref("vuuModifyWarRoomSetTarget")) {

        if (this.server.cache.lastWarroomTarget) {
            gVUUDOM.setSelectBox(this.doc.forms[0].elements.namedItem("targetprovince"),
                                            this.server.cache.lastWarroomTarget, " (");
        }
    }

    // set last warroom attack performed
    if (gVUU.prefs.getBoolPref("vuuModifyWarRoomSetAttackType")) {

        if (this.server.cache.lastWarroomAttack) {
            gVUUDOM.setSelectBox(this.doc.forms[0].elements.namedItem("attacknum"),
                                            this.server.cache.lastWarroomAttack, " (");
        }
    }
}


/**
 * Listens for recording events and when fired caches the warroom target
 * and the attack type used.
 * aEvent - Event - fired recording event
 */
vuuPMWarRoom.prototype.recordingListener = function(aEvent)
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

    server.cache.lastWarroomTarget = text;

    // attack type operation
    selectBox = doc.forms[0].elements.namedItem("attacknum");
    text = selectBox.options[selectBox.selectedIndex].text;

    if (text.indexOf(" (") != -1) {
        text = text.substring(0, text.indexOf(" ("));
    }

    server.cache.lastWarroomAttack = text;
}

/**
 * Adds all bookmark information to page
 */
vuuPMWarRoom.prototype.addBookmarkInformaiton = function ()
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
        var        node = gVUUDOM.getDescendentTextNode(this.body, "Select Attack Type:", 1, "e00089");

        nodeHR = this.doc.createElement('hr');
        nodeHR.setAttribute("style",
            "width: 50%; height: 3px; border: 0; background-color: "
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
vuuPMWarRoom.prototype.bookmarkingListener = function(aEvent)
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

        server.cache.lastWarroomTarget = provinceName;
    }

    if (dataArray[1] == doc.forms[0].elements.namedItem('SelectK').value
        && dataArray[2] == doc.forms[0].elements.namedItem('SelectI').value) {

        if (provinceName != "") {
            var selectBox = doc.forms[0].elements.namedItem("targetprovince");
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
