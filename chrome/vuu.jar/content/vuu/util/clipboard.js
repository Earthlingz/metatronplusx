/**
 * Written by Anthony Gabel on 16 November 2004.
 * Major Update: 17 July 2005 (consolidate into global VUUClipboard object)
 *
 * Singleton clipboard object for dealing with the clipboard.
 *
 * Requires:
 *  none
 */


var gVUUClipboard =
{
    /**
     * Returns any text on the clipboard.
     * return: String - any text currently on the clipboard
     *         or FALSE if an error occured trying to manipulate the clipboard
     */

    getText: function()
    {
        var        clip = null;
        var        trans = null;
        var        str = null;
        var        strLength = null;
        var        clipText = null;

        clip = Components.classes["@mozilla.org/widget/clipboard;1"]
        .createInstance(Components.interfaces.nsIClipboard);

        if (!clip) return false;

        trans = Components.classes["@mozilla.org/widget/transferable;1"]
        .createInstance(Components.interfaces.nsITransferable);

        if (!trans) return false;

        trans.addDataFlavor("text/unicode");
        clip.getData(trans, clip.kGlobalClipboard);

        str       = new Object();
        strLength = new Object();

        trans.getTransferData("text/unicode", str, strLength);

        if (str) {
            str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
        }
        if (str) {
            clipText = str.data.substring(0, strLength.value / 2);
        }

        return clipText;
    },

    /**
     * Sets the current text on the clipboard to 'aText'
     * param:  aText - String - text to send to clipboard
     * return: boolean - TRUE if clipboard text set; FALSE if unable to set text
     */

    setText: function(aText)
    {
        var        str = null;
        var        clipid = null;
        var        clip = null;
        var        trans = null;

        str = Components.classes["@mozilla.org/supports-string;1"]
        .createInstance(Components.interfaces.nsISupportsString);

        if (!str) return false;

        str.data = aText;

        trans = Components.classes["@mozilla.org/widget/transferable;1"]
        .createInstance(Components.interfaces.nsITransferable);

        if (!trans) return false;

        trans.addDataFlavor("text/unicode");
        trans.setTransferData("text/unicode", str, aText.length * 2);

        clipid = Components.interfaces.nsIClipboard;
        clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);

        if (!clip) return false;

        clip.setData(trans, null, clipid.kGlobalClipboard);
        return true;
    },

    /**
     * Sets the current 'text/html' on the clipboard to 'aHtml'
     * param:  aHtml - String - html to send to clipboard
     * return: boolean - TRUE if clipboard 'text/html' set;
     *                   FALSE if unable to set 'text/html'
     */

    setHtml: function(aHtml)
    {
        var        str = null;
        var        clipid = null;
        var        clip = null;
        var        trans = null;

        str = Components.classes["@mozilla.org/supports-string;1"]
        .createInstance(Components.interfaces.nsISupportsString);

        if (!str) return false;

        str.data = aHtml;

        trans = Components.classes["@mozilla.org/widget/transferable;1"]
        .createInstance(Components.interfaces.nsITransferable);

        if (!trans) return false;

        trans.addDataFlavor("text/html");
        trans.setTransferData("text/html", str, aHtml.length * 2);

        clipid = Components.interfaces.nsIClipboard;
        clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);

        if (!clip) return false;

        clip.setData(trans, null, clipid.kGlobalClipboard);
        return true;
    },

    /**
     * Sets the current text & 'text/html' on the clipboard to 'aText' and 'aHtml'
     * respectively
     * param:  aText - String - text to send to clipboard
     * param:  aHtml - String - html to send to clipboard
     * return: boolean - TRUE if clipboard text & 'text/html' set;
     *                   FALSE if unable to set text & 'text/html'
     */

    setTextAndHtml: function(aText, aHtml)
    {
        var        text = null;
        var        html = null;
        var        clipid = null;
        var        clip = null;
        var        trans = null;

        text = Components.classes["@mozilla.org/supports-string;1"]
        .createInstance(Components.interfaces.nsISupportsString);

        html = Components.classes["@mozilla.org/supports-string;1"]
        .createInstance(Components.interfaces.nsISupportsString);

        if (!text || !html) return false;

        text.data = aText;
        html.data = aHtml;

        trans = Components.classes["@mozilla.org/widget/transferable;1"]
        .createInstance(Components.interfaces.nsITransferable);

        if (!trans) return false;

        trans.addDataFlavor("text/unicode");
        trans.setTransferData("text/unicode", text, aText.length * 2);
        trans.addDataFlavor("text/html");
        trans.setTransferData("text/html", html, aHtml.length * 2);

        clipid = Components.interfaces.nsIClipboard;
        clip   = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);

        if (!clip) return false;

        clip.setData(trans, null, clipid.kGlobalClipboard);
        return true;
    }

};  // end gVUUClipboard declaration
