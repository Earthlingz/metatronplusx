/**
 * Written by Anthony Gabel on 13 February 2006.
 *
 * Implementation for an XPCOM Utopia province bookmark.
 */


const COMPONENT_CONTRACTID = "@mozilla.org/vuu/province-bookmark;1";
const COMPONENT_CID = Components.ID("{e2363bdb-8a6f-41ab-bb68-91c5719eaef2}");
const COMPONENT_IID = Components.interfaces.nsIVUUProvinceBookmark;
const COMPONENT_NAME = "VUU Province Bookmark JS Component";

/**
 * Constructor.
 */
function nsVUUProvinceBookmarkComponent( )
{
  this.mName = "";
  this.mKingdom = -1;
  this.mIsland = -1;
  this.mFullName = "";
  this.mType = -1;
  this.mDescription = "";
}

/**
 * Adds required functions to the prototype.
 */
nsVUUProvinceBookmarkComponent.prototype =
{
  /** Read/write name of province */
  get name() { return this.mName; },
  set name(aName) { return this.mName = aName; },

  /** Read/write kingdom number */
  get kingdom() { return this.mKingdom; },
  set kingdom(aKingdom) { return this.mKingdom = aKingdom; },
  
  /** Read/write island number */
  get island() { return this.mIsland; },
  set island(aIsland) { return this.mIsland = aIsland; },
  
  /** Read/write full name of province (name and kingdom and island numbers) */
  get fullName() { return this.mFullName; },
  set fullName(aFullName) { return this.mFullName = aFullName; },
  
  /** Read/write type of bookmark */
  get type() { return this.mType; },
  set type(aType) { return this.mType = aType; },
  
  /** Read/write description of province */
  get description() { return this.mDescription; },
  set description(aDescription) { return this.mDescription = aDescription; },
  
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
var VUUProvinceBookmarkModule =
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
        
      return (new nsVUUProvinceBookmarkComponent( )).QueryInterface(aIID);
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
function NSGetModule(aComponentManager, aFileSpec) { return VUUProvinceBookmarkModule; }
