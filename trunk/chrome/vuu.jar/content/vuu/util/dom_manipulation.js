/**
 * Written by Anthony Gabel on 11 November 2004.
 * Major Update: 17 July 2005 (consolidate into global VUUDOM object)
 *
 * Singleton DOM manipulation object.
 *
 * Requires:
 *  reporter.js
 */

// Edit Start
var AAAAAAAA_DOM =
{
    decompileTextNodes: function(aNode, aText, aNum, aErrorLocation)
    {
        if (aNode == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Null Node Passed for parsing : " + aErrorLocation);
        }

        if (aText == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Null String can't be found : " + aErrorLocation);
        }

        if (aNum == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Number passed is Null : " + aErrorLocation);
        }

        if (aNum <= 0) {
            gVUUReporter.vuuPrintToJSConsole("Number passed is Negative or Zero : " + aErrorLocation);
        }

        this.decompileTextNodes.Number = aNum;

        if (aNode.nodeType == 3 && aNode.nodeValue.search(aText) != -1) {
            // ignore if this node contains text because search should start at children
            this.decompileTextNodes.Number++;
        }

        return this.recursiveDecompile(aNode, aText);
    },

    recursiveDecompile: function(aNode, aText)
    {
        var        retVal = null;

        if (aNode.nodeType == 3 && aNode.nodeValue.search(aText) != -1 ) {
            if (this.decompileTextNodes.Number == 1) {
                this.decompileTextNodes.Number = 0;
                return aNode;
            } else {
                this.decompileTextNodes.Number--;
            }
        }

        for (var m = aNode.firstChild; m != null; m = m.nextSibling) {
            retVal = this.recursiveDecompile(m, aText);
            if (retVal) return retVal;
        }

        return null;
    }
};
// Edit End

var gVUUDOM =
{
    /**
     * Returns the 'aNum'th descendent element to whose 'tagName' matches 'aNodeTag'
     * (depth first search). Search starts at descendents of 'aNode'
     * param:  aNode - Element - node whose descendents to search
     * param:  aNodeTag - String - tagName of elements to match
     * param:  aNum - Integer - which matched element to return (1=first, 2=second, etc.)
     * param:  aErrorLocation - String - unique identifier of line of code that called
     *         this method. Used to display error information to the javascript console.
     *         This parameter is not required but is very useful for debugging
     * return: Element - the 'aNum'th descendent element of 'aNode' whose 'tagName'
     *         matches 'aNodeTag' or NULL if no such element found
     */

    getDescendentElement: function(aNode, aNodeTag, aNum, aErrorLocation)
    {
        if (aNode == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getDescendentElement(): aNode is null. Called from: " + aErrorLocation);
        }

        if (aNodeTag == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getDescendentElement(): aNodeTag is null. Called from: " + aErrorLocation);
        }

        if (aNum == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Error in gVUUDOM.getDescendentElement(): aNum is null. Called from: " + aErrorLocation);
        }

        if (aNum <= 0) return null;

        aNodeTag = aNodeTag.toLowerCase();
        this.getDescendentElement.Number = aNum;

        // nodeType 1 = Node.ELEMENT
        if (aNode.nodeType == 1 && aNode.tagName.toLowerCase() == aNodeTag) {
            // ignore if this node is of type 'aNodeTag' because search
            // should start at children
            this.getDescendentElement.Number++;
        }

        return this.getDescendentElementHelper(aNode, aNodeTag);
    },

    /**
     * Recursive helper of this.getDescendentElement(). Searches 'aNode' and any
     * children for elements with 'tagName' matching 'aNodeTag'
     * param:  aNode - Element - node to search
     * param:  aNodeTag - String - tagName of elements to match (lower case)
     * return: Element - if a match found and match is the 'aNum'th match found
     *         else returns NULL
     */

    getDescendentElementHelper: function(aNode, aNodeTag)
    {
        var        retVal = null;

        // nodeType 1 = Node.ELEMENT
        if (aNode.nodeType == 1 && aNode.tagName.toLowerCase() == aNodeTag) {
            if (this.getDescendentElement.Number == 1) {
                this.getDescendentElement.Number = 0;
                return aNode;
            } else {
                this.getDescendentElement.Number--;
            }
        }

        // this node is not the one so recursively search children
        for (var m = aNode.firstChild; m != null; m = m.nextSibling) {
            retVal = this.getDescendentElementHelper(m, aNodeTag);
            if (retVal) return retVal;
        }

        return null;
    },

    /**
     * Returns the 'aNum'th child element to whose 'tagName' matches 'aNodeTag'
     * param:  aNode - Element - node whose children to search
     * param:  aNodeTag - String - tagName of elements to match
     * param:  aNum - Integer - which matched element to return (1=first, 2=second, etc.)
     * param:  aErrorLocation - String - unique identifier of line of code that called
     *         this method. Used to display error information to the javascript console.
     *         This parameter is not required but is very useful for debugging
     * return: Element - the 'aNum'th child element of 'aNode' whose 'tagName'
     *         matches 'aNodeTag' or NULL if no such element found
     */

    getChildElement: function(aNode, aNodeTag, aNum, aErrorLocation)
    {
        if (aNode == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getChildElement(): aNode is null. Called from: " + aErrorLocation);
        }

        if (aNodeTag == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getChildElement(): aNodeTag is null. Called from: " + aErrorLocation);
        }

        if (aNum == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getChildElement(): aNum is null. Called from: " + aErrorLocation);
        }

        var        cur = 0;

        if (aNum <= 0) return null;

        aNodeTag = aNodeTag.toLowerCase();

        for (var m = aNode.firstChild; m != null; m = m.nextSibling) {
            // nodeType 1 = Node.ELEMENT
            if (m.nodeType == 1 && m.tagName.toLowerCase() == aNodeTag) {
                cur++;
                if (cur == aNum) return m;
            }
        }

        return null;
    },

    /**
     * Returns the 'aNum'th descendent text node whose text includes a case sensitive
     * match for 'aText'. (depth first search). Search starts at descendents of 'aNode'
     * param:  aNode - Element - node whose descendents to search
     * param:  aText - String - text to match
     * param:  aNum - Integer - which matched element to return (1=first, 2=second, etc.)
     * param:  aErrorLocation - String - unique identifier of line of code that called
     *         this method. Used to display error information to the javascript console.
     *         This parameter is not required but is very useful for debugging
     * return: Element - the 'aNum'th descendent text node of 'aNode' whose text includes
     *         a case sensitive match for 'aText' or NULL if no such element found
     */

    getDescendentTextNode: function(aNode, aText, aNum, aErrorLocation)
    {
        if (aNode == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Error in gVUUDOM.getDescendentTextNode(): aNode is null. Called from: " + aErrorLocation);
        }

        if (aText == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Error in gVUUDOM.getDescendentTextNode(): aText is null. Called from: " + aErrorLocation);
        }

        if (aNum == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Error in gVUUDOM.getDescendentTextNode(): aNum is null. Called from: " + aErrorLocation);
        }

        if (aNum <= 0) return null;

        this.getDescendentTextNode.Number = aNum;

        // nodeType 3 = Node.TEXT
        if (aNode.nodeType == 3 && aNode.nodeValue.indexOf(aText) != -1) {
            // ignore if this node contains text because search should start at children
            this.getDescendentTextNode.Number++;
        }

        return this.getDescendentTextNodeHelper(aNode, aText);
    },

    /**
     * Recursive helper of this.getDescendentTextNode(). Searches 'aNode' and any
     * children for text nodes which include a case sensitive match for 'aText'
     * param:  aNode - Element - node to search
     * param:  aText - String - text to match
     * return: Element - if a match found and match is the 'aNum'th match found
     *         else returns NULL
     */

    getDescendentTextNodeHelper: function(aNode, aText)
    {
        var        retVal = null;

        // nodeType 3 = Node.TEXT
        if (aNode.nodeType == 3 && aNode.nodeValue.indexOf(aText) != -1) {
            if (this.getDescendentTextNode.Number == 1) {
                this.getDescendentTextNode.Number = 0;
                return aNode;
            } else {
                this.getDescendentTextNode.Number--;
            }
        }

        // this node is not the one so recursively search children
        for (var m = aNode.firstChild; m != null; m = m.nextSibling) {
            retVal = this.getDescendentTextNodeHelper(m, aText);
            if (retVal) return retVal;
        }

        return null;
    },

    /**
     * Returns the 'aNum'th child text elements text
     * param:  aNode - Element - node whose children to search
     * param:  aNum - Integer - which childs text to return (1=first, 2=second, etc.)
     * param:  aErrorLocation - String - unique identifier of line of code that called
     *         this method. Used to display error information to the javascript console.
     *         This parameter is not required but is very useful for debugging
     * return: String - text of the 'aNum'th text element child or NULL if no such
     *         element found
     */

    getChildTextNodeText: function(aNode, aNum, aErrorLocation)
    {
        if (aNode == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getChildTextNodeText(): aNode is null. Called from: " + aErrorLocation);
        }

        if (aNum == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getChildTextNodeText(): aNum is null. Called from: " + aErrorLocation);
        }

        var        cur = 0;

        if (aNum <= 0) return null;

        for (var m = aNode.firstChild; m != null; m = m.nextSibling) {
            // nodeType 3 = Node.TEXT
            if (m.nodeType == 3) {
                cur++;
                if (cur == aNum) return m.nodeValue;
            }
        }

        return null;
    },

    getSelectedText: function(aMaxLength)
    {
        var        selection = "";
        var        focusedWindow = null;

        if (document.popupNode) {
            var node = document.popupNode;
            var nodeLocalName = node.localName.toLowerCase();

            if ((nodeLocalName == "textarea") || (nodeLocalName == "input" && node.type == "text")) {
                selection = node.value.substring(node.selectionStart, node.selectionEnd);
            } else {
                focusedWindow = document.commandDispatcher.focusedWindow;
                selection = focusedWindow.getSelection();
                selection = selection.toString();
            }
        } else {
            focusedWindow = document.commandDispatcher.focusedWindow;
            selection = focusedWindow.getSelection();
            selection = selection.toString();
        }

        selection = selection.trim();

        if (selection.length > aMaxLength) {
            selection = "";
        }

        return selection;
    },

    /**
     * Returns all text from text nodes descending from (and including) 'aNode'.
     * If 'aNode' is a 'HTMLDocument' then starts at 'aNode.body'. Acts as if user
     * has selected text using their mouse and copied it.
     * param:  aWindow - Window - window in which 'aNode' resides
     * param:  aNode - Element - node to start text collection at
     * param:  aErrorLocation - String - unique identifier of line of code that called
     *         this method. Used to display error information to the javascript console.
     *         This parameter is not required but is very useful for debugging
      * return: String - all text from text nodes descending from (and including) 'aNode'
     */

    getAllText: function(aWindow, aNode, aErrorLocation)
    {
        if (aNode == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getAllText(): aNode is null. Called from: " + aErrorLocation);
        }

        var        text = null;
        var        selection = null;

        if (aNode == null) return null;

        if (aNode.body) aNode = aNode.body;  // poor check if aNode is a HTMLDocument

        selection = aWindow._content.getSelection();

        selection.removeAllRanges();
        selection.selectAllChildren(aNode);

        text = selection.toString();

        selection.removeAllRanges();

        return text;
    },

    /**
     * Returns the html souce (innerHTML) of the body of document 'aDoc'
     * param:  aDoc - HTMLDocument - node to start text collection at
     * param:  aErrorLocation - String - unique identifier of line of code that called
     *         this method. Used to display error information to the javascript console.
     *         This parameter is not required but is very useful for debugging
     * return: String - html source of body of document
     */

    getHtmlSource: function(aDoc, aErrorLocation)
    {
        if (aDoc == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getHtmlSource(): aDoc is null. Called from: " + aErrorLocation);
        }

        if (aDoc.body) return aDoc.body.innerHTML;

        return null;
    },

    getStackTrace: function()
    {
        var s = "";
        var a;

        for (a = arguments.caller; a != null; a = a.caller) {
            s = s + "->" + funcname(a.callee) + "\n";
            if (a.caller == a) {
                s+="*"; break;
            }
        }
        return s;
    },

    /**
     * Returns a <span> element with style "color: 'aColor'" and text content 'aText'
     * param:  aDoc - HTMLDocument - document span element is to be created from
     * param:  aColor - String - color of text (in hexadecimal form - eg."#99FFBB")
     * param:  aText - String - text of the created <span> element
     * param:  aErrorLocation - String - unique identifier of line of code that called
     *         this method. Used to display error information to the javascript console.
     *         This parameter is not required but is very useful for debugging
     * return: Element - <span> element with appropriate properties set
     */

    createColoredSpan: function(aDoc, aColor, aText, aErrorLocation)
    {
        if (aDoc == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.createColoredSpan(): aDoc is null. Called from: " + aErrorLocation);
        }

        var        span = aDoc.createElement("span");

        span.setAttribute("style", "color: " + aColor + ";");
        span.textContent = aText;

        return span;
    },

    /**
     * Sets the selected option of a select element to the option whose text equals
     * the given text (if one exists) which can be trimmed at a certain cutoff.
     * eg. if selectbox.options[x].text = 'some text (more)' and cutoff = ' ('
     * then option will be set as selected if given text equals 'some text'
     *
     * param:  aSelectBox - HTMLSelectElement - select box to set selected option for
     * param:  aText - String - text to match to option text
     * param:  aCutoff - String - cutoff point for option text when matching
     */

    setSelectBox: function (aSelectBox, aText, aCutoff)
    {
        var        index = null;

        for (i = 0; i < aSelectBox.length; i++) {
            if (aCutoff && (index = aSelectBox.options[i].text.indexOf(aCutoff)) != -1) {
                if (aSelectBox.options[i].text.substring(0, index) == aText) {
                    aSelectBox.options[i].selected = "true";
                }
            } else {
                if (aSelectBox.options[i].text == aText) {
                    aSelectBox.options[i].selected = "true";
                }
            }
        }
    },

    /**
     * Returns a frame from a window
     * param:  aWindow - Window - window to search for frame in
     * param:  aFrameName - String - name of the frame to return
     * param:  aErrorLocation - String - unique identifier of line of code that called
     *         this method. Used to display error information to the javascript console.
     *         This parameter is not required but is very useful for debugging
     * return: HTMLFrameElement - frame with name of 'aFrameName' or
     *         NULL if no such frame exists
     */

    getFrameFromWindow: function(aWindow, aFrameName, aErrorLocation)
    {
        if (aWindow == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getFrameFromWindow(): aWindow is null. Called from: " + aErrorLocation);
        }

        if (aWindow == null && aErrorLocation != null) {
        gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getFrameFromWindow(): aFrameName is null. Called from: " + aErrorLocation);
        }

        var        i = null;

        if (aWindow._content && aWindow._content.frames) {
            for (i = 0; i < aWindow._content.frames.length; i++) {
                if (aWindow._content.frames[i].name.toLowerCase() == aFrameName.toLowerCase()) {
                    return aWindow._content.frames[i];
                }
            }
        }

        return null;
    },

    /**
     * Returns the document containing a utopia page. First searches through 'aWindow's
     * frames for the main utopia document ('utomain' frame) and if not found returns
     * 'aWindow's content document.
     * param:  aWindow - Window - window to search for main utopia document in
     * param:  aErrorLocation - String - unique identifier of line of code that called
     *         this method. Used to display error information to the javascript console.
     *         This parameter is not required but is very useful for debugging
     * return: HTMLDocument - document containing main utopia page content (if from within Utopia's frames)
     *         or the current page's document if not within Utopia's frames
     *         NULL if no such document exists
     */

    getMainUtopiaDocument: function (aWindow, aErrorLocation)
    {
        if (aWindow == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getMainUtopiaDocument(): aWindow is null. Called from: " + aErrorLocation);
        }

        var        doc = null;

        if (aWindow._content && aWindow._content.document) {
            if (((doc = this.getFrameFromWindow(aWindow, "utomain"))) != null) {
                // frame -> document
                doc = doc.document;
            } else if ((doc = aWindow._content.document) != null) {
                // no code - doc set
            }
        }

        return doc;
    },

    /**
     * Returns the document containing a utopia links/top.htm page. First searches through
     * 'aWindow's frames for the document ('freebies' frame) and if not found returns
     * null.
     * param:  aWindow - Window - window to search for links/top.htm utopia document in
     * param:  aErrorLocation - String - unique identifier of line of code that called
     *         this method. Used to display error information to the javascript console.
     *         This parameter is not required but is very useful for debugging
     * return: HTMLDocument - document containing links/top.htm utopia page content or
     *         NULL if no such document exists
     */

    getLinksTopUtopiaDocument: function (aWindow, aErrorLocation)
    {
        if (aWindow == null && aErrorLocation != null) {
            gVUUReporter.vuuPrintToJSConsole("Warning in gVUUDOM.getLinksTopUtopiaDocument(): aWindow is null. Called from: " + aErrorLocation);
        }

        var        doc = null;

        if (((doc = this.getFrameFromWindow(aWindow, "freebies"))) != null) {
            // frame -> document
            doc = doc.document;
        }

        return doc;
    }
};
