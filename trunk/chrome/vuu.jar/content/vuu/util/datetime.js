/**
 * Written by Anthony Gabel on 13 December 2004.
 * Major Update: 17 July 2005 (consolidate into global VUUDateTime object)
 *
 * Singleton datetime object for dealing with dates and times.
 *
 * Requires:
 *  none
 */


var gVUUDateTime =
{
    /**
     * Returns the current date in string form: 22nd November, 2004
     * return: String - current date in form 22nd November, 2004
     */

    getDate: function()
    {
        var        months = new Array("January", "February", "March",
                                      "April", "May", "June", "July",
                                      "August", "September", "October",
                                      "November", "December");

        var        date = new Date();
        var        day  = date.getDate();
        var        month = date.getMonth();
        var        year = date.getFullYear();

        return day + this.getDaySuffix(day) + " " + months[month] + ", " + year;
    },

    /**
     * Converts a date to a string time in the format HH:MM:SS
     * param:  aDate - Date - date to convert
     * return: String - current date in form HH:MM:SS
     */

    getTimeHHMMSS: function(aDate)
    {
        return this.padZero(aDate.getHours())   + ":"
             + this.padZero(aDate.getMinutes()) + ":"
             + this.padZero(aDate.getSeconds());
    },

    /**
     * Converts a date to a string time in the format HH:MM
     * param:  aDate - Date - date to convert
     * return: String - current date in form HH:MM
     */

    getTimeHHMM: function(aDate)
    {
        return this.padZero(aDate.getHours())   + ":"
             + this.padZero(aDate.getMinutes());
    },

    /**
     * Converts time in millisecond format to HH:MM:SS
     * param:  aMS - Long - number of milliseconds since 01 January, 1970 00:00:00
     * return: String - 'aMS' in form HH:MM:SS
     */

    milliToHHMMSS: function(aMS)
    {
        var        tmpTime = Math.floor(aMS / 1000);
        var        hours = null;
        var        minutes = null;
        var        seconds = null;

        seconds = this.padZero(tmpTime % 60);
        tmpTime = Math.floor(tmpTime / 60);
        hours = Math.floor(tmpTime / 60);
        minutes = this.padZero(tmpTime % 60);

        return hours + ":" + minutes + ":" + seconds;
    },

    /**
     * Returns the day suffix for a given day 1-31
     * ie. st, nd, rd and th
     * param:  aDay - Integer - corresponding to a day from 1 - 31
     * return: String - suffix to use for that day
     */

    getDaySuffix: function(aDay)
    {
        var        suffix = null;

        switch(aDay) {
            case 1: case 21: case 31:  suffix = "st"; break;
            case 2: case 22:  suffix = "nd"; break;
            case 3: case 23:  suffix = "rd"; break;
            default:  suffix = "th";
        }

        return suffix;
    },

    getCurrentGMTDateNTime: function()
    {
        var        date = new Date();
        var        tzOffset = date.getTimezoneOffset(); // this is in minutes.
        var        gmtDate = new Date();

        // we need to add milliseconds to it to works.
        gmtDate.setTime(gmtDate.getTime() + tzOffset * 60 * 1000);

        return gmtDate;
    },

    /**
    * Returns the current time as GMT (eg. 11:00)
    * return: String - current time as GMT
    */
    getTimeGMT: function()
    {
        var        date = new Date();
        var        tzOffset = date.getTimezoneOffset() / 60;
        var        gmtHours = (date.getHours() + tzOffset);

        gmtHours = (gmtHours >= 24) ? gmtHours - 24 : gmtHours;

        return (this.padZero(gmtHours) + ":" + this.padZero(date.getMinutes()));
    },

    /**
     * Pads a number with up to a single 0 if required (eg. 3 -> 03, 11 -> 11)
     * param:  aNum - integer - number to be tested for padding
     * return: String - fully padded number
     */

    padZero: function(aNum)
    {
        return ((aNum <= 9) ? ("0" + aNum) : aNum);
    }

};  // end gVUUDateTime declaration
