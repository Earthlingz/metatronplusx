/**
 * Written by Anthony Gabel on 22 September 2005.
 *
 * Implementation for an XPCOM Utopia bookmark manager.
 */


const COMPONENT_CONTRACTID = "@mozilla.org/vuu/bookmark-manager;1";
const COMPONENT_CID = Components.ID("{43b9b1bc-46b7-4e33-83a7-45bf07c155ca}");
const COMPONENT_IID = Components.interfaces.nsIVUUBookmarkManager;
const COMPONENT_NAME = "VUU Bookmark Manager JS Component";

/**
 * Constructor.
 */
function nsVUUBookmarkManagerComponent( )
{
  this.mFriendKingdomPref = "";
  this.mFoeKingdomPref = "";
  this.mInterestKingdomPref = "";
  
  this.mFriendProvincePref = "";
  this.mFoeProvincePref = "";
  this.mInterestProvincePref = "";
  
  /** Read only initialized */
  this.mInitialized = false;
  
  this.resetAll();
}

/**
 * Adds required functions to the prototype.
 */
nsVUUBookmarkManagerComponent.prototype =
{
  /**
   * Resets all information in this bookmark manager.
   */
  resetAll: function ()
  {    
    /** Internal only kingdom bookmarks */
    this.mFriendKingdoms = new Array();
    this.mFoeKingdoms = new Array();
    this.mInterestKingdoms = new Array();
    
    /** Currently tagged kingdom */
    this.mTaggedKingdom = null;
    
    /** Internal only province bookmarks */
    this.mFriendProvinces = new Array();
    this.mFoeProvinces = new Array();
    this.mInterestProvinces = new Array();
    
    /** Currently tagged province */
    this.mTaggedProvince = null;
  },
  
  /**
   * Saves all information in this bookmark manager.
   */
  saveAll: function ()
  {    
    this.saveKingdomBookmarks();
    this.saveProvinceBookmarks();
  },
  
  /** Read only bookmark types */
  mTYPE_TAGGED: 0,
  get TYPE_TAGGED() { return this.mTYPE_TAGGED; },
  
  mTYPE_FOE: 1,
  get TYPE_FOE() { return this.mTYPE_FOE; },
  
  mTYPE_INTEREST: 2,
  get TYPE_INTEREST() { return this.mTYPE_INTEREST; },
  
  mTYPE_FRIEND: 3,
  get TYPE_FRIEND() { return this.mTYPE_FRIEND; },
  
  /** Read only bookmark colours */
  //mCOLOR_TAGGED: "#FFFFFF",
  mCOLOR_TAGGED: "#C0C0C0",
  get COLOR_TAGGED() { return this.mCOLOR_TAGGED; },
  
  mCOLOR_FOE: "#FFAAAA",
  get COLOR_FOE() { return this.mCOLOR_FOE; },
  
  mCOLOR_INTEREST: "#FFEECC",
  get COLOR_INTEREST() { return this.mCOLOR_INTEREST; },
  
  mCOLOR_FRIEND: "#99FFBB",
  get COLOR_FRIEND() { return this.mCOLOR_FRIEND; },
  
  mNAME_TAGGED: "tagged",
  get NAME_TAGGED() { return this.mNAME_TAGGED; },
  
  mNAME_FOE: "foe",
  get NAME_FOE() { return this.mNAME_FOE; },
  
  mNAME_INTEREST: "interest",
  get NAME_INTEREST() { return this.mNAME_INTEREST; },
  
  mNAME_FRIEND: "friend",
  get NAME_FRIEND() { return this.mNAME_FRIEND; },
  
  getDisplayNameFromType: function (aType)
  {
    var retVal = null;
    
    if (aType == this.mTYPE_TAGGED)
      retVal = this.mNAME_TAGGED;
    if (aType == this.mTYPE_FOE)
      retVal = this.mNAME_FOE;
    if (aType == this.mTYPE_FRIEND)
      retVal = this.mNAME_FRIEND;
    if (aType == this.mTYPE_INTEREST)
      retVal = this.mNAME_INTEREST;
    
    return retVal;
  },
  
  getColorFromType: function (aType)
  {
    var retVal = null;
    
    if (aType == this.mTYPE_TAGGED)
      retVal = this.mCOLOR_TAGGED;
    if (aType == this.mTYPE_FOE)
      retVal = this.mCOLOR_FOE;
    if (aType == this.mTYPE_FRIEND)
      retVal = this.mCOLOR_FRIEND;
    if (aType == this.mTYPE_INTEREST)
      retVal = this.mCOLOR_INTEREST;
    
    return retVal;
  },

  initialize: function (aFriendKingdoms, aFoeKingdoms, aInterestKingdoms, aFriendProvinces, aFoeProvinces, aInterestProvinces)
  {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
      .getService(Components.interfaces.nsIPrefService);
    var prefs = prefService.getBranch("extensions.vuu.");
  
    this.mFriendKingdomPref = aFriendKingdoms;
    this.mFoeKingdomPref = aFoeKingdoms;
    this.mInterestKingdomPref = aInterestKingdoms;
    
    this.loadKingdomBookmarkType(prefs, this.mFriendKingdomPref, this.mTYPE_FRIEND);
    this.loadKingdomBookmarkType(prefs, this.mFoeKingdomPref, this.mTYPE_FOE);
    this.loadKingdomBookmarkType(prefs, this.mInterestKingdomPref, this.mTYPE_INTEREST);
    
    this.mFriendProvincePref = aFriendProvinces;
    this.mFoeProvincePref = aFoeProvinces;
    this.mInterestProvincePref = aInterestProvinces;
    
    this.loadProvinceBookmarkType(prefs, this.mFriendProvincePref, this.mTYPE_FRIEND);
    this.loadProvinceBookmarkType(prefs, this.mFoeProvincePref, this.mTYPE_FOE);
    this.loadProvinceBookmarkType(prefs, this.mInterestProvincePref, this.mTYPE_INTEREST);
    
    this.mInitialized = true;
  },

  /**
   * Adds a list of bookmarks, that is retrieved from preferences, to the this manager
   *
   * @param  aPrefs - nsIPrefBranch - VUU preferences branch
   * @param  aPreferenceName - String - Bookmark preference to retrieve bookmark
   *          information from
   * @param  aType - integer - type of bookmark (this.mTYPE_xxx)
   */
  loadKingdomBookmarkType: function(aPrefs, aPreferenceName, aType)
  {
    var bookmarksString = null;
    var bookmarks = null;
    var bookmark = null;
    var i = 0;
    
    var description = "";
    
    bookmarksString = aPrefs.getCharPref(aPreferenceName);
    bookmarks = bookmarksString.split(/:::/);
    
    for (i = 0; i < bookmarks.length; i++)
    {
      if (bookmarks[i].trim() == "")
        break;
      bookmark = bookmarks[i].split(/::/);
      if (bookmark[2] != "|") description = bookmark[2];
        
      this.addKingdomBookmark(parseInt(bookmark[0]), parseInt(bookmark[1]), aType, description);
    }
  },
  
  /**
   * Adds a list of bookmarks, that is retrieved from preferences, to the this manager
   *
   * @param  aPrefs - nsIPrefBranch - VUU preferences branch
   * @param  aPreferenceName - String - Bookmark preference to retrieve bookmark
   *          information from
   * @param  aType - integer - type of bookmark (this.mTYPE_xxx)
   */
  loadProvinceBookmarkType: function(aPrefs, aPreferenceName, aType)
  {
    var bookmarksString = null;
    var bookmarks = null;
    var bookmark = null;
    var i = 0;
    
    var description = "";
    
    bookmarksString = aPrefs.getCharPref(aPreferenceName);
    bookmarks = bookmarksString.split(/:::/);
    
    for (i = 0; i < bookmarks.length; i++)
    {
      if (bookmarks[i].trim() == "")
        break;
      bookmark = bookmarks[i].split(/::/);
      if (bookmark[3] != "|") description = bookmark[3];
        
      this.addProvinceBookmark(bookmark[0], parseInt(bookmark[1]), parseInt(bookmark[2]), aType, description);
    }
  },
  
  /** whether this service has been initialized yet (available bookmarks set up) */
  get initialized() { return this.mInitialized; },
  
  /** Read/write currently tagged kingdom */
  get taggedKingdom() { return this.mTaggedKingdom; },
  
  setTaggedKingdom: function (aKingdom, aIsland)
  {
    var tag = Components.classes["@mozilla.org/vuu/kingdom-bookmark;1"]
      .createInstance(Components.interfaces.nsIVUUKingdomBookmark);
    
    tag.kingdom = aKingdom;
    tag.island = aIsland;
    tag.type = this.mTYPE_TAGGED;
    tag.description = "";
    
    this.mTaggedKingdom = tag;
  },
  
  get numFriendKingdoms() { return this.mFriendKingdoms.length; },
  get numFoeKingdoms() { return this.mFoeKingdoms.length; },
  get numInterestKingdoms() { return this.mInterestKingdoms.length; },
  
  //public
  saveKingdomBookmarks: function ()
  {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
      .getService(Components.interfaces.nsIPrefService);
    var prefs = prefService.getBranch("extensions.vuu.");
    
    this.saveKingdomArray(prefs, this.mFriendKingdomPref, this.mFriendKingdoms);
    this.saveKingdomArray(prefs, this.mFoeKingdomPref, this.mFoeKingdoms);
    this.saveKingdomArray(prefs, this.mInterestKingdomPref, this.mInterestKingdoms);
  },
  
  //private
  saveKingdomArray: function (aPrefs, aPreferenceName, aArray)
  {
    var i = 0;
    var bookmarks = "";
    var description = "|";
    
    for (i = 0; i < aArray.length; i++)
    {
      if (aArray[i].description != "")
        description = aArray[i].description;
      else
        description = "|";
      
      bookmarks += aArray[i].kingdom + "::";
      bookmarks += aArray[i].island + "::";
      bookmarks += description + ":::";
    }
    
    aPrefs.setCharPref(aPreferenceName, bookmarks);
  },
  
  /**
   * Adds a new bookmark to the set of bookmarks managed by this service
   *
   * param:  aKingodm - long - Kingdom number of kingdom to bookmark
   * param:  aIsland - long - Island number of kingdom to bookmark
   * param:  aType - long - Type of kingdom bookmark
   * param:  aDescription - String - description of kingdom bookmark
   * return: TRUE if bookmark added without error; FALSE otherwise
   */
  addKingdomBookmark: function (aKingdom, aIsland, aType, aDescription)
  {
    if (this.getKingdomBookmark(aKingdom, aIsland) != null)
      return false;
    
    var kingdomArray = this.getKingdomArrayFromType(aType);
    var bookmark = Components.classes["@mozilla.org/vuu/kingdom-bookmark;1"]
      .createInstance(Components.interfaces.nsIVUUKingdomBookmark);
    
    bookmark.kingdom = aKingdom;
    bookmark.island = aIsland;
    bookmark.type = aType;
    bookmark.description = aDescription;
    kingdomArray.push(bookmark);
    kingdomArray.sort(vuuCompareKingdomBookmarks);
    
    return true;
  },
  
  // private
  getKingdomArrayFromType: function (aType)
  {
    var retVal = null;
    
    if (aType == this.mTYPE_FRIEND)
      retVal = this.mFriendKingdoms;
    else if (aType == this.mTYPE_FOE)
      retVal = this.mFoeKingdoms;
    else if (aType == this.mTYPE_INTEREST)
      retVal = this.mInterestKingdoms;
    
    return retVal;
  },
  
  // public
  getKingdomBookmark: function (aKingdom, aIsland)
  {
    var i = 0;
    var kingdomBookmark = null;
    
    if ((kingdomBookmark = this.getKingdomBookmarkFromArray(aKingdom, aIsland, this.mFriendKingdoms)) != null)
      return kingdomBookmark;
    
    if ((kingdomBookmark = this.getKingdomBookmarkFromArray(aKingdom, aIsland, this.mFoeKingdoms)) != null)
      return kingdomBookmark;
    
    if ((kingdomBookmark = this.getKingdomBookmarkFromArray(aKingdom, aIsland, this.mInterestKingdoms)) != null)
      return kingdomBookmark;
    
    return null;
  },
  
  // private
  getKingdomBookmarkFromArray: function (aKingdom, aIsland, aArray)
  {
    var retVal = null;
    var i = 0;

    for (i = 0; i < aArray.length; i++)
    {
      if (aArray[i].kingdom == aKingdom && aArray[i].island == aIsland)
      {
        retVal = aArray[i];
        break;
      }
    }
    
    return retVal;
  },
  
  // public
  getKingdomBookmarkByIndex: function (aIndex, aType)
  {
    var kingdomArray = this.getKingdomArrayFromType(aType);
    return kingdomArray[aIndex];
  },
  
  // public
  removeKingdomBookmark: function (aKingdom, aIsland, aType)
  {
    var i = null;
    var kingdomArray = this.getKingdomArrayFromType(aType);
    
    for (i = 0; i < kingdomArray.length; i++)
    {
      if (kingdomArray[i].kingdom == aKingdom && kingdomArray[i].island == aIsland)
      {
        kingdomArray.splice(i, 1);
        break; 
      }
    }
  },
  
  
  
  /** Read/write currently tagged province */
  get taggedProvince() { return this.mTaggedProvince; },
  
  setTaggedProvince: function (aName, aKingdom, aIsland)
  {
    var tag = Components.classes["@mozilla.org/vuu/province-bookmark;1"]
      .createInstance(Components.interfaces.nsIVUUProvinceBookmark);
    
    tag.name = aName.trim();
    tag.kingdom = aKingdom;
    tag.island = aIsland;
    tag.fullName = aName.trim() + " (" + aKingdom + ":" + aIsland + ")";
    tag.type = this.mTYPE_TAGGED;
    tag.description = "";
    
    this.mTaggedProvince = tag;
  },
  
  get numFriendProvinces() { return this.mFriendProvinces.length; },
  get numFoeProvinces() { return this.mFoeProvinces.length; },
  get numInterestProvinces() { return this.mInterestProvinces.length; },
  
  //public
  saveProvinceBookmarks: function ()
  {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
      .getService(Components.interfaces.nsIPrefService);
    var prefs = prefService.getBranch("extensions.vuu.");
    
    this.saveProvinceArray(prefs, this.mFriendProvincePref, this.mFriendProvinces);
    this.saveProvinceArray(prefs, this.mFoeProvincePref, this.mFoeProvinces);
    this.saveProvinceArray(prefs, this.mInterestProvincePref, this.mInterestProvinces);
  },
  
  //private
  saveProvinceArray: function (aPrefs, aPreferenceName, aArray)
  {
    var i = 0;
    var bookmarks = "";
    var description = "|";
    
    for (i = 0; i < aArray.length; i++)
    {
      if (aArray[i].description != "")
        description = aArray[i].description;
      else
        description = "|";
      
      bookmarks += aArray[i].name + "::";
      bookmarks += aArray[i].kingdom + "::";
      bookmarks += aArray[i].island + "::";
      bookmarks += description + ":::";
    }
    
    aPrefs.setCharPref(aPreferenceName, bookmarks);
  },
  
  /**
   * Adds a new bookmark to the set of bookmarks managed by this service
   *
   * param:  aName - long - Name of province to bookmark
   * param:  aKingodm - long - Kingdom number of province to bookmark
   * param:  aIsland - long - Island number of province to bookmark
   * param:  aType - long - Type of province bookmark
   * param:  aDescription - String - description of province bookmark
   * return: TRUE if bookmark added without error; FALSE otherwise
   */
  addProvinceBookmark: function (aName, aKingdom, aIsland, aType, aDescription)
  {
    if (this.getProvinceBookmark(aName, aKingdom, aIsland) != null)
      return false;
    
    var provinceArray = this.getProvinceArrayFromType(aType);
    var bookmark = Components.classes["@mozilla.org/vuu/province-bookmark;1"]
      .createInstance(Components.interfaces.nsIVUUProvinceBookmark);
    
    bookmark.name = aName.trim();
    bookmark.kingdom = aKingdom;
    bookmark.island = aIsland;
    bookmark.fullName = aName.trim() + " (" + aKingdom + ":" + aIsland + ")";
    bookmark.type = aType;
    bookmark.description = aDescription;
    provinceArray.push(bookmark);
    provinceArray.sort(vuuCompareProvinceBookmarks);
    
    return true;
  },
  
  // private
  getProvinceArrayFromType: function (aType)
  {
    var retVal = null;
    
    if (aType == this.mTYPE_FRIEND)
      retVal = this.mFriendProvinces;
    else if (aType == this.mTYPE_FOE)
      retVal = this.mFoeProvinces;
    else if (aType == this.mTYPE_INTEREST)
      retVal = this.mInterestProvinces;
    
    return retVal;
  },
  
  // public
  getProvinceBookmark: function (aName, aKingdom, aIsland)
  {
    var i = 0;
    var provinceBookmark = null;
    
    if ((provinceBookmark = this.getProvinceBookmarkFromArray(aName, aKingdom, aIsland, this.mFriendProvinces)) != null)
      return provinceBookmark;
    
    if ((provinceBookmark = this.getProvinceBookmarkFromArray(aName, aKingdom, aIsland, this.mFoeProvinces)) != null)
      return provinceBookmark;
    
    if ((provinceBookmark = this.getProvinceBookmarkFromArray(aName, aKingdom, aIsland, this.mInterestProvinces)) != null)
      return provinceBookmark;
    
    return null;
  },
  
  // private
  getProvinceBookmarkFromArray: function (aName, aKingdom, aIsland, aArray)
  {
    var retVal = null;
    for (i = 0; i < aArray.length; i++)
    {
      if (aArray[i].name == aName.trim() && aArray[i].kingdom == aKingdom && aArray[i].island == aIsland)
      {
        retVal = aArray[i];
        break;
      }
    }
    
    return retVal;
  },
  
  // public
  getProvinceBookmarkByIndex: function (aIndex, aType)
  {
    var provinceArray = this.getProvinceArrayFromType(aType);
    return provinceArray[aIndex];
  },
  
  // public
  removeProvinceBookmark: function (aName, aKingdom, aIsland, aType)
  {
    var i = null;
    var provinceArray = this.getProvinceArrayFromType(aType);
    
    for (i = 0; i < provinceArray.length; i++)
    {
      if (provinceArray[i].name == aName.trim() && provinceArray[i].kingdom == aKingdom && provinceArray[i].island == aIsland)
      {
        provinceArray.splice(i, 1);
        break; 
      }
    }
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
var VUUBookmarkManagerModule =
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
        
      return (new nsVUUBookmarkManagerComponent( )).QueryInterface(aIID);
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
function NSGetModule(aComponentManager, aFileSpec) { return VUUBookmarkManagerModule; }

/**
 * Compares two kingdom bookmarks. Sorts in ascending order.
 */
function vuuCompareKingdomBookmarks(a, b)
{
  if (a.island == b.island)
  {
    return a.kingdom - b.kingdom;
  }
  else if (a.island > b.island)
    return 1;
  else
    return -1;
}

/**
 * Compares two province bookmarks. Sorts in ascending order.
 */
function vuuCompareProvinceBookmarks(a, b)
{
  if (a.island == b.island)
  {
    if (a.kingdom != b.kingdom)
      return a.kingdom - b.kingdom;
    else
    {
      if (a.name < b.name)
        return -1;
      else if (b.name < a.name)
        return 1;
      else
        return 0;
    }
  }
  else if (a.island > b.island)
    return 1;
  else
    return -1;
}

/** Trims whitespace from both the left and right of the String */
if (!String.prototype.trim)
{
  String.prototype.trim = function()
  {
   // skip leading and trailing whitespace
   // and return everything in between
    var x = this;
    x = x.replace(/^\s*(.*)/, "$1");
    x = x.replace(/(.*?)\s*$/, "$1");
    return x;
  }
}
