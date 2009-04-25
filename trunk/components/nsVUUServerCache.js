/**
 * Written by Anthony Gabel on 3 August 2005.
 *
 * Implementation for an XPCOM Utopia server cache for the current session.
 */


const COMPONENT_CONTRACTID = "@mozilla.org/vuu/server-cache;1";
const COMPONENT_CID = Components.ID("{4daeb132-ee8e-4e2f-9112-044213eb6342}");
const COMPONENT_IID = Components.interfaces.nsIVUUServerCache;
const COMPONENT_NAME = "VUU Server Cache JS Component";

/**
 * Constructor. Sets up the required non-value variables.
 */
function nsVUUServerCacheComponent( )
{
  this.resetAll();
}

/**
 * Adds the required value variables and methods to the prototype.
 */
nsVUUServerCacheComponent.prototype =
{
  /**
   * Resets all information in this cache.
   */
  resetAll: function ()
  {
    this.mProvinceName = null;
    this.mKingdom = null;
    this.mIsland = null;
    
    this.mMonarchMessage = null;
    this.mSavedMonarchMessage = null;
    this.mDateDay = null;
    this.mDateMonth = null;
    this.mDateYear = null;
    this.mFreeIncomeMonth = null;
    this.mFreeIncomeYear = null;

    this.mBuildingEff = null;
    this.mMilitaryEff = null;
    this.mOffMilEff = null;
    this.mDefMilEff = null;

    this.mAcres = null;
    this.mDefspecs = null;
	this.mRacesx = null;
    
    this.mLastThieveryTarget = null;
    this.mLastThieveryOp = null;
    this.mLastThieveryOpBuilding = null;
    this.mLastThievesSent = null;
    this.mLastMagicTarget = null;
    this.mLastMagicOp = null;
    this.mLastWarroomTarget = null;
    this.mLastWarroomAttack = null;
    this.mLastSendMessageTarget = null;
    
    this.mSpells = new Array();
    this.mArmies = new Array();
    
    this.mSpellLastHourUpdate = 0;
  },

  /** Read/write province name */
  get provinceName() { return this.mProvinceName; },
  set provinceName(aProvinceName) { return this.mProvinceName = aProvinceName; },
  
  /** Read/write kingdom number */
  get kingdom() { return this.mKingdom; },
  set kingdom(aKingdom) { return this.mKingdom = aKingdom; },
  
  /** Read/write island number */
  get island() { return this.mIsland; },
  set island(aIsland) { return this.mIsland = aIsland; },
  
  /** Read/write last known monarch message */
  get monarchMessage() { return this.mMonarchMessage; },
  set monarchMessage(aMonarchMessage) { return this.mMonarchMessage = aMonarchMessage; },
  
  /** Read/write last saved monarch message */
  get lastMonarchMessage() { return this.mSavedMonarchMessage; },
  set lastMonarchMessage(aMonarchMessage) { return this.mSavedMonarchMessage = aMonarchMessage; },
  
  /** Read/write day of the last known Utopia date */
  get dateDay() { return this.mDateDay; },
  set dateDay(aDateDay) { return this.mDateDay = aDateDay; },
  
  /** Read/write month of the last known Utopia date */
  get dateMonth() { return this.mDateMonth; },
  set dateMonth(aDateMonth) { return this.mDateMonth = aDateMonth; },
  
  /** Read/write year of the last known Utopia date */
  get dateYear() { return this.mDateYear; },
  set dateYear(aDateYear) { return this.mDateYear = aDateYear; },
  
  /** Read/write month of the last known Utopia date that free income was taken */
  get freeIncomeMonth() { return this.mFreeIncomeMonth; },
  set freeIncomeMonth(aFreeIncomeMonth) { return this.mFreeIncomeMonth = aFreeIncomeMonth; },
  
  /** Read/write year of the last known Utopia date that free income was taken */
  get freeIncomeYear() { return this.mFreeIncomeYear; },
  set freeIncomeYear(aFreeIncomeYear) { return this.mFreeIncomeYear = aFreeIncomeYear; },
  
  /** Read/write building efficiency */
  get buildingEff() { return this.mBuildingEff; },
  set buildingEff(aBuildingEff) { return this.mBuildingEff = aBuildingEff; },
  
  /** Read/write military efficiency */
  get militaryEff() { return this.mMilitaryEff; },
  set militaryEff(aMilitaryEff) { return this.mMilitaryEff = aMilitaryEff; },
  
  /** Read/write offensive military efficiency */
  get offMilEff() { return this.mOffMilEff; },
  set offMilEff(aOffMilEff) { return this.mOffMilEff = aOffMilEff; },
  
  /** Read/write defensive military efficiency */
  get defMilEff() { return this.mDefMilEff; },
  set defMilEff(aDefMilEff) { return this.mDefMilEff = aDefMilEff; },
  
  /** Read/write last known acres */
  get acres() { return this.mAcres; },
  set acres(aAcres) { return this.mAcres = aAcres; },

  /** Read/write last known defspecs */
  get defspecs() { return this.mDefspecs; },
  set defspecs(aDefspecs) { return this.mDefspecs = aDefspecs; },

  /** Read/write last known races */
  get racesx() { return this.mRacesx; },
  set racesx(aRacesx) { return this.mRacesx = aRacesx; },

  /** Read/write last thievery target */
  get lastThieveryTarget() { return this.mLastThieveryTarget; },
  set lastThieveryTarget(aLastThieveryTarget) { return this.mLastThieveryTarget = aLastThieveryTarget; },
  
  /** Read/write last thievery operation */
  get lastThieveryOp() { return this.mLastThieveryOp; },
  set lastThieveryOp(aLastThieveryOp) { return this.mLastThieveryOp = aLastThieveryOp; },

  /** Read/write last thievery operation building*/
  get lastThieveryOpBuilding() { return this.mLastThieveryOpBuilding; },
  set lastThieveryOpBuilding(aLastThieveryOpBuilding) { return this.mLastThieveryOpBuilding = aLastThieveryOpBuilding; },
  
  /** Read/write last thieves sent */
  get lastThievesSent() { return this.mLastThievesSent; },
  set lastThievesSent(aLastThievesSent) { return this.mLastThievesSent = aLastThievesSent; },
  
  /** Read/write last magic target */
  get lastMagicTarget() { return this.mLastMagicTarget; },
  set lastMagicTarget(aLastMagicTarget) { return this.mLastMagicTarget = aLastMagicTarget; },
  
  /** Read/write last magic operation */
  get lastMagicOp() { return this.mLastMagicOp; },
  set lastMagicOp(aLastMagicOp) { return this.mLastMagicOp = aLastMagicOp; },
  
  /** Read/write last warroom attack type */
  get lastWarroomAttack() { return this.mLastWarroomAttack; },
  set lastWarroomAttack(aLastWarroomAttack) { return this.mLastWarroomAttack = aLastWarroomAttack; },
  
  /** Read/write last warroom target */
  get lastWarroomTarget() { return this.mLastWarroomTarget; },
  set lastWarroomTarget(aLastWarroomTarget) { return this.mLastWarroomTarget = aLastWarroomTarget; },
  
  /** Read/write last send message target */
  get lastSendMessageTarget() { return this.mLastSendMessageTarget; },
  set lastSendMessageTarget(aLastSendMessageTarget) { return this.mLastSendMessageTarget = aLastSendMessageTarget; },

  /******************************
   ***** Army section
   ******************************/

  /** Read only number of armies managed by the cache */
  get numArmies() { return this.mArmies.length; },
  
  /**
   * Clears all armies managed by this cache.
   */
  clearArmies: function ()
  {
    this.mArmies = new Array();
  },
  
  /**
   * Adds a new army to the list of armies managed by this cache
   *
   * param:  aReturnTime - long - actual return time in MS. NULL if army is home.
   * param:  aConfirmedHome - boolean - whether the user has confirmed this army is home
   * return: TRUE if army added without error; FALSE otherwise
   */
  addNewArmy: function(aReturnTime, aConfirmedHome)
  {
    var army = Components.classes["@mozilla.org/vuu/army;1"]
        .createInstance(Components.interfaces.nsIVUUArmy);
    
    army.returnTime = aReturnTime;
    army.confirmedHome = aConfirmedHome;
  
    this.mArmies.push(army);
    return true;
  },
  
  /**
   * Updates an existing army managed by this cache
   *
   * param:  aIndex - long - index of army to update (starts at 0)
   * param:  aReturnTime - long - actual return time in MS. NULL if army is home.
   * param:  aConfirmedHome - boolean - whether the user has confirmed this army is home
   * return: TRUE if army updated without error; FALSE otherwise
   */
  setArmyByIndex: function(aIndex, aReturnTime, aConfirmedHome)
  {
    this.mArmies[aIndex].returnTime = aReturnTime;
    this.mArmies[aIndex].confirmedHome = aConfirmedHome;
    return true;
  },
  
  /**
   * Returns the army specificed by 'aIndex'
   *
   * param:  aIndex - long - index of army to return (starts at 0)
   * return: nsIVUUArmy - if army available at aIndex
   *         NULL - if no army found
   */
  getArmyByIndex: function(aIndex)
  {
    return this.mArmies[aIndex];
  },
  
  
  /******************************
   ***** Spell section
   ******************************/
  
  /** Read only number of currently active spells managed by the cache */
  get numSpells() { return this.mSpells.length; },
  
  /** Read/write last hour in real time that spells (duration, etc.) were updated */
  get spellLastHourUpdate() { return this.mSpellLastHourUpdate; },
  set spellLastHourUpdate(aSpellLastHourUpdate) { return this.mSpellLastHourUpdate = aSpellLastHourUpdate; },
  
  /**
   * Clears all spells managed by this cache.
   */
  clearSpells: function ()
  {
    this.mSpells = new Array();
  },
  
  /**
   * Adds a new spell to the list of spells managed by this cache
   *
   * param:  aName - String - human readable name of the spell
   * param:  aDuration - long - duration of the spell in hours
   * return: TRUE if spell added without error; FALSE otherwise
   */
  addNewSpell: function(aName, aDuration)
  {
    var spell = Components.classes["@mozilla.org/vuu/spell;1"]
        .createInstance(Components.interfaces.nsIVUUSpell);
    
    spell.name = aName;
    spell.duration = aDuration;
  
    this.mSpells.push(spell);
    return true;
  },
  
  /**
   * Updates an existing spell managed by this cache
   *
   * param:  aIndex - long - index of spell to update (starts at 0)
   * param:  aName - String - human readable name of the spell
   * param:  aDuration - long - duration of the spell in hours
   * return: TRUE if spell updated without error; FALSE otherwise
   */
  setSpellByIndex: function(aIndex, aName, aDuration)
  {
    this.mSpells[aIndex].name = aName;
    this.mSpells[aIndex].duration = aDuration;
    return true;
  },
  
  /**
   * Removes the spell at index 'aIndex'.
   * NOTE: This will decrement the index by one of all spells with a higher index
   *
   * param:  aIndex - long - index of spell to remove (starts at 0)
   * return: TRUE is spell removed successfully; FALSE otherwise
   */
  removeSpellByIndex: function(aIndex)
  {
    this.mSpells.splice(aIndex, 1);
    return true;
  },
  
  /**
   * Sorts the spells managed by this cache in descending order (changing the
   * index of each spell if required)
   */
  sortSpellsByDurationDescending: function()
  {
    this.mSpells.sort(vuuCompareSpellDurations);
  },
  
  /**
   * Returns the spell specificed by 'aIndex'
   *
   * param:  aIndex - long - index of spell to return (starts at 0)
   * return: nsIVUUSpell - if spell available at aIndex
   *         NULL - if no army found
   */
  getSpellByIndex: function(aIndex)
  {
    return this.mSpells[aIndex];
  },
    
  /**
   * Implements nsISupports
   */
  QueryInterface: function (aIID) 
  {
    if(!aIID.equals(COMPONENT_IID) 
        && !aIID.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
}

/**
 * Required by XPCOM.
 */
var VUUServerCacheModule =
{
  firstTime  : true,

  registerSelf: function (aComponentManager, aFileSpec, aLocation, aType)
  {
    if (this.firstTime) {
        this.firstTime = false;
        throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
    }

    aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aComponentManager.registerFactoryLocation(
        COMPONENT_CID,
        COMPONENT_NAME,
        COMPONENT_CONTRACTID,
        aFileSpec,
        aLocation,
        aType);
  },
  
  getClassObject : function (aComponentManager, aCID, aIID)
  {
      if (!aCID.equals(COMPONENT_CID))
        throw Components.results.NS_ERROR_NO_INTERFACE
      if (!aIID.equals(Components.interfaces.nsIFactory))
        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
      return this.factory;
  },

  factory: {
    createInstance: function (aOuter, aIID)
    {
      if (aOuter != null)
        throw Components.results.NS_ERROR_NO_AGGREGATION;
      if (!aIID.equals(COMPONENT_IID) &&
          !aIID.equals(Components.interfaces.nsISupports))
        throw Components.results.NS_ERROR_INVALID_ARG;
        
      return (new nsVUUServerCacheComponent( )).QueryInterface(aIID);
    }
  },
  
  canUnload: function(aComponentManager)
  {
    return true;
  }
}

/**
 * Required by XPCOM.
 */
function NSGetModule(aComponentManager, aFileSpec) { return VUUServerCacheModule; }

/*
 * Compares the durations of two spells
 * param:  a - nsIVUUSpell - first of the two spells to compare
 * param:  b - nsIVUUSpell - second of the two spells to compare
 * return: >0 if a's duration > b's duration
 *         <0 if b's duration > a's duration
 *         vuuCompareSpellNames(a, b) is a's duration = b's duration
 */
function vuuCompareSpellDurations(a, b)
{  
  var tmp = a.duration - b.duration;
  
  if (tmp != 0) return tmp;
  return vuuCompareSpellNames(a, b);
}

/*
 * Compares the names of two spells
 * param: a - nsIVUUSpell - first of the two spells to compare
 * param: b - nsIVUUSpell - second of the two spells to compare
 * return: >0 if a's name > b's name
 *         <0 if b's name > a's name
 *         0 if a's name = b's name
 */
function vuuCompareSpellNames(a, b)
{
  if (a.name < b.name)
    return -1;
  else if (b.name < a.name)
    return 1;
  else
    return 0;
}
