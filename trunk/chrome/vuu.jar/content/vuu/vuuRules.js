/**
 * Written by Anthony Gabel on 05 August 2005
 *
 * A global rules object that holds all various server related rules
 * such as unit offense / defense, unit names and various server
 * specific formula.
 *
 * Requires:
 *  none
 */


/**
 * The main global rules object. Allows the retrieval of a server specific rules
 * object.
 */
var gVUURules =
{
    /** internal list of all server's rules objects */
    rules: [new vuuRules('wol'), new vuuRules('b'), new vuuRules('gen')],

    /*
     *   wol :- World of Legends.
     *   b   :- Great Utopian War.
     *   gen  :- Genesis.
     */

    /**
     * Returns the rules object for the given server's hrefID.
     *
     * param:  aServerHrefID - String - hrefID of server whose rules to retrieve
     * return: vuuRules - rules object of the given server hrefID or
     *         NULL if hrefID not found
     */

    getRulesByHrefID: function(aServerHrefID)
    {
        var        i = null;
        var        retVal = null;

        for (i = 0; i < this.rules.length; i++) {
            if (aServerHrefID == this.rules[i].hrefID) {
                retVal = this.rules[i];
                break;
            }
        }

        return retVal;
    }

};  // end gVUURules declaration

/**
 * Constructor of server specific rules object that contains rules relating to a
 * variety of categories within Utopia.
 *
 * param:  aServerHrefID - String - hrefID of server whose rules to retrieve
 */
function vuuRules(aServerHrefID)
{
    this.hrefID = aServerHrefID;

    this.races     = new vuuRulesRaces(aServerHrefID);
    this.honor     = new vuuRulesHonor(aServerHrefID);
    this.aid       = new vuuRulesAid(aServerHrefID);
    this.thievery  = new vuuRulesThievery(aServerHrefID);
    this.growth    = new vuuRulesGrowth(aServerHrefID);
    this.dragons   = new vuuRulesDragon(aServerHrefID);
}


/****************************************************
*****************************************************
***** Rules relating to races
*****************************************************
****************************************************/

/**
 * Constructor for the rules related to races.
 * param:  aServerHrefID - String - hrefID of server whose rules to retrieve
 */
function vuuRulesRaces(aServerHrefID)
{
    this.hrefID = aServerHrefID;
}

/**
 * Returns an array containing the name of each race
 * return: String() - Name of each race on given server
 */
vuuRulesRaces.prototype.getRaceNames = function()
{
    if (this.hrefID == "wol") {
        return ["Human", "Dark Elf", "Elf", "Gnome", "Dwarf", "Orc"];
    } else if (this.hrefID == "b") {
        return ["Human", "Dark Elf", "Elf", "Gnome", "Dwarf", "Orc"];
    } else if (this.hrefID == "gen") {
        return ["Human", "Dark Elf", "Elf", "Gnome", "Dwarf", "Orc", "Undead"];
    } else  {
        return ["Human", "Dark Elf", "Elf", "Gnome", "Dwarf", "Orc"];
    }
}

/**
 * Returns an array containing the name of each race in plural form
 * return: String() - Name of each race on given server
 */
vuuRulesRaces.prototype.getPluralRaceNames = function()
{
    if (this.hrefID == "wol") {
        return ["Humans", "Dark Elves", "Elves", "Gnomes", "Dwarves", "Orcs"];
    } else if (this.hrefID == "b") {
        return ["Humans", "Dark Elves", "Elves", "Gnomes", "Dwarves", "Orcs"];
    } else if (this.hrefID == "gen") {
        return ["Humans", "Dark Elves", "Elves", "Gnomes", "Dwarves", "Orcs", "Undead"];
    } else  {
        return ["Humans", "Dark Elves", "Elves", "Gnomes", "Dwarves", "Orcs"];
    }
}

/**
 * Returns the name of a race's offensive specialist in plural form.
 * param:  aRace - String - name of the race
 * return: String - Plural form of the name of the race's offensive specialist
 */
vuuRulesRaces.prototype.getOffSpecName = function(aRace)
{
    var        offname = null;
    var        race = aRace.trim().toLowerCase();

    switch(race)
    {
        case "human":      offname = "Swordsmen";     break;
        case "dark elf":   offname = "Night Rangers"; break;
        case "elf":        offname = "Rangers";       break;
        case "dwarf":      offname = "Warriors";      break;
        case "orc":        offname = "Goblins";       break;
        case "faery":      offname = "Magicians";     break;
        case "halfling":   offname = "Spearmen";      break;
        case "avian":      offname = "Harpies";       break;
        case "undead":     offname = "Skeletons";     break;
        case "gnome":      offname = "Halflings";     break;
        default:           offname = "Off specs";     break;
    }

    return offname;
}

/**
 * Returns the name of a race from the name of an offensive specialist.
 * param:  aOffSpecName - String - name of the offensive specialist
 * return: String - Returns the name of the race to which the
 *         offensive specialist belongs
 */
vuuRulesRaces.prototype.getRaceFromOffSpecName = function(aOffSpecName)
{
    var        race = null;
    var        offName = aOffSpecName.trim().toLowerCase();

    switch(offName)
    {
        case "swordsmen":     race = "Human";               break;
        case "night rangers": race = "Dark Elf";            break;
        case "rangers":       race = "Elf";                 break;
        case "warriors":      race = "Dwarf";               break;
        case "goblins":       race = "Orc";                 break;
        case "magicians":     race = "Faery";               break;
        case "spearmen":      race = "Halfling";            break;
        case "harpies":       race = "Avian";               break;
        case "skeletons":     race = "Undead";              break;
        case "halflings":     race = "Gnome";               break;
        default:              race = "Error: Unknown race"; break;
    }

    return race;
}

/**
 * Returns the name of a race's defensive specialist in plural form.
 * param:  aRace - String - name of the race
 * return: String - Plural form of the name of the race's defensive specialist
 */
vuuRulesRaces.prototype.getDefSpecName = function(aRace)
{
    var        defname = null;
    var        race = aRace.trim().toLowerCase();

    switch(race)
    {
        case "human":     defname = "Archers";   break;
        case "dark elf":  defname = "Druids";    break;
        case "elf":       defname = "Archers";   break;
        case "dwarf":     defname = "Axemen";    break;
        case "orc":       defname = "Trolls";    break;
        case "faery":     defname = "Druids";    break;
        case "halfling":  defname = "Archers";   break;
        case "avian":     defname = "Griffins";  break;
        case "undead":    defname = "Zombies";   break;
        case "gnome":     defname = "Pikemen";   break;
        default:          defname = "Def specs"; break;
    }

    return defname;
}

/**
 * Returns the name of a race's elite unit in plural form.
 * param:  aRace - String - name of the race
 * return: String - Plural form of the name of the race's elite unit
 */
vuuRulesRaces.prototype.getEliteName = function(aRace)
{
    var        elitename = null;
    var        race = aRace.trim().toLowerCase();

    switch(race)
    {
        case "human":     elitename = "Knights";           break;
        case "dark elf":  elitename = "Drows";             break;
        case "elf":       elitename = "Elf Lords";         break;
        case "dwarf":     elitename = "Berserkers";        break;
        case "orc":       elitename = "Ogres";             break;
        case "faery":     elitename = "Beastmasters";      break;
        case "halfling":  elitename = "Half-Giants";       break;
        case "avian":     elitename = "Drakes";            break;
        case "undead":    elitename = "Ghouls";            break;
        case "gnome":     elitename = "Golems";            break;
        default:          elitename = "Elites";            break;
    }

    return elitename;
}

/**
 * Returns the offense of a race's soldier unit.
 * param:  aRace - String - name of the race
 * return: integer - offense of the race's soldier unit
 */
vuuRulesRaces.prototype.getSoldierOff = function(aRace)
{
    var        soldierOff = 1;

    return soldierOff;
}

/**
 * Returns the defense of a race's soldier unit.
 * param:  aRace - String - name of the race
 * return: integer - defense of the race's soldier unit
 */
vuuRulesRaces.prototype.getSoldierDef = function(aRace)
{
    var        soldierDef = 1;

    return soldierDef;
}

/**
 * Returns the offense of a race's offensive specialist.
 * param:  aRace - String - name of the race
 * return: integer - offense of the race's offensive specialist
 */
vuuRulesRaces.prototype.getSpecOff = function(aRace)
{
    var        points = null;
    var        race = aRace.trim().toLowerCase();

    if (this.hrefID == "wol") {
        switch(race) {
            case "human":     points = 5; break;
            case "dark elf":  points = 6; break;
            case "elf":       points = 5; break;
            case "dwarf":     points = 5; break;
            case "orc":       points = 5; break;
            case "gnome":     points = 5; break;
            default:          points = 0; break;
        }
    }
    
    if (this.hrefID == "b")
    {
        switch(race)
        {
            case "human":     points = 5; break;
            case "dark elf":  points = 6; break;
            case "elf":       points = 5; break;
            case "dwarf":     points = 5; break;
            case "orc":       points = 5; break;
            case "gnome":     points = 5; break;
            default:          points = 0; break;
        }
    }
    
    if (this.hrefID == "gen")
    {
        switch(race)
        {
            case "human":     points = 5; break;
            case "dark elf":  points = 6; break;
            case "elf":       points = 5; break;
            case "dwarf":     points = 5; break;
            case "orc":       points = 5; break;
            case "gnome":     points = 5; break;
			case "undead":    points = 5; break;
            default:          points = 0; break;
        }
    }
    return points;
}

/**
 * Returns the defense of a race's defensive specialist.
 * param:  aRace - String - name of the race
 * return: integer - defense of the race's defensive specialist
 */
vuuRulesRaces.prototype.getSpecDef = function(aRace)
{
    var        points = null;
    var        race = aRace.trim().toLowerCase();

    if (this.hrefID == "wol")
    {
        switch(race)
        {
            case "human":     points = 6; break;
            case "dark elf":  points = 5; break;
            case "elf":       points = 5; break;
            case "dwarf":     points = 5; break;
            case "orc":       points = 5; break;
            case "gnome":     points = 5; break;
            default:          points = 0; break;
        }
    }
    if (this.hrefID == "b")
    {
        switch(race)
        {
            case "human":     points = 6; break;
            case "dark elf":  points = 5; break;
            case "elf":       points = 5; break;
            case "dwarf":     points = 5; break;
            case "orc":       points = 5; break;
            case "gnome":     points = 5; break;
            default:          points = 0; break;
        }
    }    
    if (this.hrefID == "gen")
    {
        switch(race)
        {
            case "human":     points = 6; break;
            case "dark elf":  points = 5; break;
            case "elf":       points = 5; break;
            case "dwarf":     points = 5; break;
            case "orc":       points = 5; break;
            case "gnome":     points = 5; break;
			case "undead":    points = 5; break;
            default:          points = 0; break;
        }
    }
    return points;
}

/**
 * Returns the offense of a race's elite unit.
 * param:  aRace - String - name of the race
 * return: integer - offense of the race's elite unit
 */
vuuRulesRaces.prototype.getEliteOff = function(aRace)
{
    var        points = null;
    var        race = aRace.trim().toLowerCase();

    if (this.hrefID == "wol")
    {
        switch(race)
        {
            case "human":     points = 6; break;
            case "dark elf":  points = 5; break;
            case "elf":       points = 6; break;
            case "dwarf":     points = 7; break;
            case "orc":       points = 8; break;
            case "gnome":     points = 5; break;
            default:          points = 0; break;
        }
    }
    if (this.hrefID == "b")
    {
        switch(race)
        {
            case "human":     points = 6; break;
            case "dark elf":  points = 4; break;
            case "elf":       points = 6; break;
            case "dwarf":     points = 6; break;
            case "orc":       points = 8; break;
            case "gnome":     points = 5; break;
            default:          points = 0; break;
        }
    }
        
    if (this.hrefID == "gen")
    {
        switch(race)
        {
            case "human":     points = 6; break;
            case "dark elf":  points = 4; break;
            case "elf":       points = 6; break;
            case "dwarf":     points = 6; break;
            case "orc":       points = 8; break;
            case "gnome":     points = 5; break;
			case "undead":    points = 9; break;
            default:          points = 0; break;
        }
    }

    return points;
}

/**
 * Returns the defense of a race's elite unit.
 * param:  aRace - String - name of the race
 * return: integer - defense of the race's elite unit
 */
vuuRulesRaces.prototype.getEliteDef = function(aRace)
{
    var        points = null;
    var        race = aRace.trim().toLowerCase();

    if (this.hrefID == "wol")
    {
        switch(race)
        {
            case "human":     points = 3; break;
            case "dark elf":  points = 6; break;
            case "elf":       points = 4; break;
            case "dwarf":     points = 4; break;
            case "orc":       points = 2; break;
            case "gnome":     points = 4; break;
            default:          points = 0; break;
        }
    }
    if (this.hrefID == "b")
    {
        switch(race)
        {
            case "human":     points = 4; break;
            case "dark elf":  points = 6; break;
            case "elf":       points = 5; break;
            case "dwarf":     points = 6; break;
            case "orc":       points = 2; break;
            case "gnome":     points = 5; break;
            default:          points = 0; break;
        }
    }

    if (this.hrefID == "gen")
    {
        switch(race)
        {
            case "human":     points = 4; break;
            case "dark elf":  points = 6; break;
            case "elf":       points = 5; break;
            case "dwarf":     points = 6; break;
            case "orc":       points = 2; break;
            case "gnome":     points = 5; break;
			case "undead":    points = 0; break;
            default:          points = 0; break;
        }
    }

    return points;
}

/**
 * Returns the offense of a race's war horse.
 * param:  aRace - String - name of the race
 * return: integer - ofense of the race's war horse
 */
vuuRulesRaces.prototype.getWarHorseOff = function(aRace)
{
    return 1;
}

/**
 * Returns the offense of a race's mercenary.
 * param:  aRace - String - name of the race
 * return: integer - ofense of the race's mercenary
 */
vuuRulesRaces.prototype.getMercOff = function(aRace)
{
    var        points = 3

    //if (aRace.trim().toLowerCase() == "halfling")
    //    points = 5;

    return points;
}

/**
 * Returns the offense of a race's prisoners.
 * param:  aRace - String - name of the race
 * return: integer - ofense of the race's prisoners
 */
vuuRulesRaces.prototype.getPrisOff = function(aRace)
{
    var        points = null;
    var        race = aRace.trim().toLowerCase();
    switch(race)
    {
        case "human":     points = 3; break;
        case "dark elf":  points = 3; break;
        case "elf":       points = 0; break;
        case "dwarf":     points = 3; break;
        case "orc":       points = 3; break;
        case "faery":     points = 3; break;
        case "halfling":  points = 3; break;
        case "avian":     points = 3; break;
        case "undead":    points = 3; break;
        case "gnome":     points = 3; break;
        default:          points = 0; break;           
    }

    return points;
}

/****************************************************
*****************************************************
***** Rules relating to honor
*****************************************************
****************************************************/


/**
 * Constructor for the rules related to honor.
 * param:  aServerHrefID - String - hrefID of server whose rules to retrieve
 */
function vuuRulesHonor(aServerHrefID)
{
    this.hrefID = aServerHrefID;
}

/**
 * Returns the minimum honor required to be of the given rank.
 * param:  aRank - String - Rank to find minimum required honor for
 *         Note: King / Queen / Dead will all return smallest possible honor
 * return: integer - minimum required honor to be of the given rank
 */
vuuRulesHonor.prototype.getMinHonor = function(aRank)
{
    var        honor = null;
    var        rank = aRank.trim().toLowerCase();

    switch(rank)
    {
        case "peasant":      honor = 0; break;
        case "knight":
        case "lady":         honor = 801; break;
        case "lord":
        case "noble lady":   honor = 1501; break;
        case "baron":
        case "baroness":     honor = 2251; break;
        case "viscount":
        case "viscountess":  honor = 3001; break;
        case "count":
        case "countess":     honor = 3751; break;
        case "marquis":
        case "marchioness":  honor = 4501; break;
        case "duke":
        case "duchess":      honor = 5501; break;
        case "prince":
        case "princess":     honor = 7001; break;
        default: honor = 0; break;
    }

    return honor;
}

/**
 * Returns the maximum honor a given rank can attain.
 * param:  aRank - String - Rank to find maximum attainable honor for
 *         Note: King / Queen / Dead will all return smallest possible honor
 *               Highest rank will return an arbitrary amount of honor that
 *               is greater than the honor required to attain it
 *               (since technically it has no maximum attainable honor)
 * return: integer - maximum honor a given rank can attain
 */
vuuRulesHonor.prototype.getMaxHonor = function(aRank)
{
    var        honor = null;
    var        rank = aRank.toLowerCase().trim();

    switch(rank)
    {
        case "peasant":      honor = 800; break;
        case "knight":
        case "lady":         honor = 1500; break;
        case "lord":
        case "noble lady":   honor = 2250; break;
        case "baron":
        case "baroness":     honor = 3000; break;
        case "viscount":
        case "viscountess":  honor = 3750; break;
        case "count":
        case "countess":     honor = 4500; break;
        case "marquis":
        case "marchioness":  honor = 5500; break;
        case "duke":
        case "duchess":      honor = 7000; break;
        case "prince":
        case "princess":     honor = 7500; break;
        default:             honor = 0; break;
    }

    return honor;
}

/**
 * Returns whether the given rank indicates Monarchy.
 * param:  aRank - String - Rank to use to determine Monarchy status
 * return: boolean - TRUE if given rank indicates Monarchy; FALSE otherwise
 */
vuuRulesHonor.prototype.isMonarch = function(aRank)
{
    var        rank = aRank.toLowerCase().trim();

    if (rank == "queen" || rank == "king") {
        return true;
    } else {
        return false;
    }
}

/**
 * Returns a whole number derived from the given rank. The higher the rank the
 * higher the whole number returned. Female ranks are given a higher number than
 * the equivelant male ranks.
 * param:  aRank - String - Rank to convert to a whole number
 * return: integer - integer derived from the given rank
 *         (higher rank = higher integer) - DEAD returns lower than all other ranks
 */
vuuRulesHonor.prototype.rankToInt = function(aRank)
{
    var retVal = -1;

    if (aRank.indexOf("Peasant") != -1) {
        retVal = 0;
    } else if (aRank.indexOf("Knight") != -1) {
        retVal = 1;
    } else if (aRank.indexOf("Lady") != -1 && aRank.indexOf("Noble") == -1) {
        // don't want to match 'Lady' in 'Noble Lady'
        retVal = 2;
    } else if (aRank.indexOf("Lord")  != -1) {
        retVal = 3;
    } else if (aRank.indexOf("Noble Lady")  != -1) {

        retVal = 4;
    } else if (aRank.indexOf("Baron")  != -1) {
        retVal = 5;
    } else if (aRank.indexOf("Baroness")  != -1) {
        retVal = 6;
    } else if (aRank.indexOf("Viscount")  != -1) {
        retVal = 7;
    } else if (aRank.indexOf("Viscountess")  != -1) {
        retVal = 8;
    } else if (aRank.indexOf("Count")  != -1) {
        retVal = 9;
    } else if (aRank.indexOf("Countess")  != -1) {
        retVal = 10;
    } else if (aRank.indexOf("Marquis")  != -1) {
        retVal = 11;
    } else if (aRank.indexOf("Marchioness")  != -1) {
        retVal = 12;
    } else if (aRank.indexOf("Duke")  != -1) {
        retVal = 13;
    } else if (aRank.indexOf("Duchess")  != -1) {
        retVal = 14;
    } else if (aRank.indexOf("Prince")  != -1) {
        retVal = 15;
    } else if (aRank.indexOf("Princess")  != -1) {
        retVal = 16;
    } else if (aRank.indexOf("Queen")  != -1) {
        retVal = 17;
    } else if (aRank.indexOf("King")  != -1) {
        retVal = 18;
    }

    return retVal;
}


/****************************************************
*****************************************************
***** Rules relating to aid
*****************************************************
****************************************************/

/**
 * Constructor for the rules related to aid.
 * param:  aServerHrefID - String - hrefID of server whose rules to retrieve
 */
function vuuRulesAid(aServerHrefID)
{
    this.hrefID = aServerHrefID;
}

/**
 * Returns the trade balance value of a tradeable good
 * param:  aGoods - String - Tradeable good to retrieve the trade balance value of
 * return: float - trade balance value of the given tradeable good
 */
vuuRulesAid.prototype.getTradeBalanceValue = function(aGoods)
{
    var        tbv = null;
    var        goods = aGoods.toLowerCase().trim();

    switch(goods)
    {
        case "gold":
        case "gold coins":        tbv = 1.0; break;
        case "food":
        case "bushel":
        case "bushels":           tbv = 0.1; break;
        case "soldier":
        case "soldiers":          tbv = 150.0; break;
        case "rune":
        case "runes":             tbv = 5.0; break;
        default:                  tbv = 0.0; break;
    }

    return tbv;
}


/****************************************************
*****************************************************
***** Rules relating to thievery
*****************************************************
****************************************************/

/**
 * Constructor for the rules related to thievery.
 * param:  aServerHrefID - String - hrefID of server whose rules to retrieve
 */
function vuuRulesThievery(aServerHrefID)
{
    this.hrefID = aServerHrefID;
}

/**
 * Returns raw TPA of a province calculated from the given information.
 * param:  aInfo - Object - containing the relevant information required for a server
 *         For all servers this object must contain:
 *           .acres -> integer -> province's current acres
 *           .thieves -> integer -> province's current number of thieves
 * return: float - raw TPA of the province
 */
vuuRulesThievery.prototype.calcRawTPA = function(aInfo)
{
    if (aInfo == null) {
        gVUUReporter.vuuPrintToJSConsole("Warning in vuuRulesThievery.calcRawTPA(): aInfo is null");
    }

    if (aInfo.acres == null) {
        gVUUReporter.vuuPrintToJSConsole("Warning in vuuRulesThievery.calcRawTPA(): aInfo.acres is null");
    }

    if (aInfo.thieves == null) {
        gVUUReporter.vuuPrintToJSConsole("Warning in vuuRulesThievery.calcRawTPA(): aInfo.thieves is null");
    }

    if (aInfo.acres > 500) {
        return (aInfo.thieves / aInfo.acres);
    } else {
        return (aInfo.thieves / 500);
    }
}

/****************************************************
*****************************************************
***** Rules relating to growth
*****************************************************
****************************************************/

/**
 * Constructor for the rules related to growth.
 * param:  aServerHrefID - String - hrefID of server whose rules to retrieve
 */
function vuuRulesGrowth(aServerHrefID)
{
    this.hrefID = aServerHrefID;
}

/**
 * Returns the cost to raze a single building calculated from the given information.
 * param:  aInfo - Object - containing the relevant information required for a server
 *         For all servers this object must contain:
 *           .acres -> integer -> province's current acres
 * return: integer - cost to raze a single building
 */
vuuRulesGrowth.prototype.getRazeCost = function(aInfo)
{
    if (aInfo == null) {
        gVUUReporter.vuuPrintToJSConsole("Warning in vuuRulesGrowth.getRazeCost(): aInfo is null.");
    }

    if (aInfo.acres == null) {
        gVUUReporter.vuuPrintToJSConsole("Warning in vuuRulesGrowth.getRazeCost(): aInfo.acres is null.");
    }

    return Math.round((1400 + aInfo.acres) / 4);
}


/****************************************************
*****************************************************
***** Rules relating to dragons
*****************************************************
****************************************************/

/**
 * Constructor for the rules related to dragons.
 * param:  aServerHrefID - String - hrefID of server whose rules to retrieve
 */
function vuuRulesDragon(aServerHrefID)
{
    this.hrefID = aServerHrefID;
}

/**
 * Returns the cost create a dragon to target a kingdom.
 * param:  aInfo - Object - containing the relevant information required for a server
 *         For all servers this object must contain:
 *           .networth -> integer -> targeted kingdom's networth
 * return: integer - cost to created a dragon
 */
vuuRulesDragon.prototype.getCost = function(aInfo)
{
    return Math.round(aInfo.networth * 1.75);
}

/**
 * Returns the number of soldiers needed to kill 1% of a dragon targeting a kingdom.
 * param:  aInfo - Object - containing the relevant information required for a server
 *         For all servers this object must contain:
 *           .networth -> integer -> targeted kingdom's networth
 * return: integer - number of soldiers to kill 1% of the dragon
 */
vuuRulesDragon.prototype.getSoldiersToKillOnePercent = function(aInfo)
{
    return Math.max(Math.ceil(aInfo.networth / 3000) + 1, 100);
}

/**
 * Returns the lowest kingdom networth that a kingdom can send a dragon against.
 * param:  aInfo - Object - containing the relevant information required for a server
 *         For all servers this object must contain:
 *           .networth -> integer -> targeted kingdom's networth
 * return: integer - lowest kingdom networth a kingdom can target with a dragon
 */
vuuRulesDragon.prototype.getSendRangeLower = function(aInfo)
{
    return Math.round(aInfo.networth * 0.8);
}

/**
 * Returns the highest kingdom networth that a kingdom can send a dragon against.
 * param:  aInfo - Object - containing the relevant information required for a server
 *         For all servers this object must contain:
 *           .networth -> integer -> targeted kingdom's networth
 * return: integer - highest kingdom networth a kingdom can target with a dragon
 */
vuuRulesDragon.prototype.getSendRangeUpper = function(aInfo)
{
    return Math.round(aInfo.networth * 1.25);
}
