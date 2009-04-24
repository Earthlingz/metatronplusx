/**
 * Written by Anthony Gabel on 12 December 2004.
 * Major Update: 17 July 2005 (consolidate into global VUUFormatter object)
 *
 * Singleton formatter object relating to formatting of numbers and strings.
 * Also houses unfortunately poorly placed server specific information
 *
 * Requires:
 *  general.js
 */


var gVUUFormatter =
{
    /**
     * Removes commas from strings / integers - ie. 9,999,999 -> 9999999
     * param:  aText - String - string from which commas are to be removed
     * return: String - string with commas removed
     *                  if 'aText' is NULL then returns '0'
     */

    removeCommas: function (aText)
    {
        if (!aText) return "0"

        return this.removeChar(aText, ",")
    },

    /**
     * Removes all characters of type 'aCharacter' from strings / integers
     * param:  aText - String - string from which a certain character is to be removed
     * param:  aCharacter - char - character to be removed
     * return: String - string with all 'aCharacter' characters removed
     *                  if 'aText' is NULL then returns ""
     */

    removeChar: function (aText, aCharacter)
    {
        if (!aText) return ""

        var        retVal = aText;
        var        i = aText.indexOf(aCharacter);

        while (i != -1) {
            retVal = retVal.substring(0, i) + retVal.substring(i + 1);
            i = retVal.indexOf(aCharacter);
        }

        return retVal;
    },

    /**
     * Formats a number of the form xxxxxxx to x,xxx,xxx
     * param:  aNum - String or integer - value to be formatted with commas
     *                (integers or longs, NOT floats)
     * return: String - formatted number
     */

    fNum: function (aNum)
    {
        var        i = null;
        var        numStr = null;
        var        formatted = "";

        if (aNum != "") {
            numStr = aNum += "";
        } else {
            return "0";
        }

        numStr = numStr.reverse();

        for (i = 0; i < numStr.length; i++) {
            if (i != 0 && i % 3 == 0) {
                formatted += ",";
            }
            formatted += numStr.charAt(i);
        }

        return formatted.reverse();
    },

    /**
     * Returns whether a string is made up of valid characters.
     * param:  aString - String - string to check for valid characters
     * param:  aAllowed - String - allowed characters
     * return: boolean - true if string is made up of allowed characters,
     *                   false otherwise
     */

    isAllowedString: function (aString, aAllowed)
    {
        for (var i=0; i< aString.length; i++) {
            if (aAllowed.indexOf(aString.charAt(i)) == -1)
                return false;
        }

        return true;
    },

    /**
     * Returns whether a string is a number ("0123456789" only)
     * param:  aString - String - string to check for valid number
     * return: boolean - true if string is a number,
     *                   false otherwise
     */

    isStringNumber: function (aString)
    {
        return this.isAllowedString(aString, "0123456789");
    },

    /**
     * Returns whether a string is a number with a possible
     * symbol at the end denoting a multiplier ('k' = 1000,
     * 'm' = 1000000). ie. ("0123456789" with a possible 'k' or 'm' appended)
     * param:  aString - String - string to check for valid number
     *         (must be on a single line)
     * return: boolean - true if string is a number,
     *                   false otherwise
     */

    isStringNumberSymbol: function (aString)
    {
        var        regex = /^\d*(k|m)?$/;
        var        regexResult = regex.exec(aString);

        if (regexResult != null) {
            return true;
        } else {
            return false;
        }

    },

    /**
     * Returns the multiplier of a number that has a possible symbol at the end.
     * You should check that the number is a valid number plus possible symbol
     * before calling this method.
     * eg. if aString = '100', multiplier = 1
     * if aString = '100k', multiplier = 1000
     * if aString = '100m', multiplier = 1000000
     * param:  aString - String - string to check for multiplier
     * return: integer - multiplier of string number
     */

    getNumberSymbolMultiplier: function (aString)
    {
        var        multiplier = 1;

        if (aString != "") {
            if (aString.charAt(aString.length - 1).toLowerCase() == 'k') {
                multiplier = 1000;
            } else if (aString.charAt(aString.length - 1).toLowerCase() == 'm') {
                multiplier = 1000000;
            }
        }

        return multiplier;
    },

    /**
     * Returns whether a character is a digit (0123456789).
     * param:  aChar - char / String (of length one) - is this character a digit
     * return: boolean - true if character is a digit, false otherwise
     */

    isCharDigit: function (aChar)
    {
        return "0123456789".indexOf(aChar) >= 0;
    }

};  // end gVUUFormatter declaration
