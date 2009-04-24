/**
 * Written by Anthony Gabel on 21 September 2005.
 *
 * Implementation for an XPCOM Utopia kingdom bookmark.
 */


const COMPONENT_CONTRACTID = "@mozilla.org/vuu/kingdom-bookmark;1";
const COMPONENT_CID = Components.ID("{434335a5-2928-4596-a429-01a0316bdbd2}");
const COMPONENT_IID = Components.interfaces.nsIVUUKingdomBookmark;
const COMPONENT_NAME = "VUU Kingdom Bookmark JS Component";

/**
 * Constructor.
 */
function nsVUUKingdomBookmarkComponent( )
{
  this.mName = "";
  this.mFullName = "";
  this.mKingdom = -1;
  this.mIsland = -1;
  this.mType = -1;
  this.mDescription = "";
}

/**
 * Adds required functions to the prototype.
 */
nsVUUKingdomBookmarkComponent.prototype =
{
  /**
   * Read only name of kingdom.
   * Should always returns an empty String
   */
  get name() { return this.mName; },

  /** Read only full name of kingdom (eg. "(11:11)" */
  get fullName()
  {
    if (this.mFullName == "")
      this.mFullName = "(" + this.mKingdom + ":" + this.mIsland + ")";
    return this.mFullName;
  },

  /** Read/write kingdom number */
  get kingdom() { return this.mKingdom; },
  set kingdom(aKingdom) { return this.mKingdom = aKingdom; },
  
  /** Read/write island number */
  get island() { return this.mIsland; },
  set island(aIsland) { return this.mIsland = aIsland; },
  
  /** Read/write type of bookmark */
  get type() { return this.mType; },
  set type(aType) { return this.mType = aType; },
  
  /** Read/write description of kingdom */
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
var VUUKingdomBookmarkModule =
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
        
      return (new nsVUUKingdomBookmarkComponent( )).QueryInterface(aIID);
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
function NSGetModule(aComponentManager, aFileSpec) { return VUUKingdomBookmarkModule; }
