/**
 * Written by Anthony Gabel on 21 July 2005.
 *
 * General utility functions added to existing Javascript objects.
 *
 * Requires:
 *  none
 */


/** Add general methods to the Javascript String object */

/** Trims whitespace from both the left and right of the String */
if (!String.prototype.trim)
{
    String.prototype.trim = function()
    {
        // skip leading and trailing whitespace
        // and return everything in between

        var        x = this;

        x = x.replace(/^\s*(.*)/, "$1");
        x = x.replace(/(.*?)\s*$/, "$1");

        return x;
    }
}

/** Trims whitespace from the left of a String */
if (!String.prototype.lTrim)
{
    String.prototype.lTrim = function()
    {
        // skip leading whitespace

        var        x = this;

        x = x.replace(/^\s*(.*)/, "$1");

        return x;
    }
}

/** Trims whitespace from the right of a String */
if (!String.prototype.rTrim)
{
    String.prototype.rTrim = function()
    {
        // skip trailing whitespace

        var x = this;

        x = x.replace(/(.*?)\s*$/, "$1");

        return x;
    }
}

/**
 * Reverses a String
 * return:  String - the reversed string
 */
if (!String.prototype.reverse)
{
    String.prototype.reverse = function()
    {
        var        reversed = "";

        for (var i = this.length - 1; i >= 0; i--) {
            reversed += this.charAt(i);
        }

        return reversed;
    }
}
