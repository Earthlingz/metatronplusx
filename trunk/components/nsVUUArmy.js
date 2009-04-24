/**
 * Written by Anthony Gabel on 3 August 2005.
 *
 * Implementation for an XPCOM Utopia army (in relation to
 * the military advisor).
 */


const COMPONENT_CONTRACTID = "@mozilla.org/vuu/army;1";
const COMPONENT_CID = Components.ID("{4913077b-472a-4e30-b6b4-c379b77ea7b7}");
const COMPONENT_IID = Components.interfaces.nsIVUUArmy;
const COMPONENT_NAME = "VUU Army (Cached) JS Component";

/**
 * Constructor.
 */
function nsVUUArmyComponent( )
{
  this.mReturnTime = null;
  this.mConfirmedHome = null;
}

/**
 * Adds required functions to the prototype.
 */
nsVUUArmyComponent.prototype =
{
  /** Read/write actual return time in MS. NULL if army is home */
  get returnTime() { return this.mReturnTime; },
  set returnTime(aReturnTime) { return this.mReturnTime = aReturnTime; },
  
  /** Read/write whether the user has confirmed this army is home */
  get confirmedHome() { return this.mConfirmedHome; },
  set confirmedHome(aConfirmedHome) { return this.mConfirmedHome = aConfirmedHome; },
  
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
var VUUArmyModule =
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
        
      return (new nsVUUArmyComponent( )).QueryInterface(aIID);
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
function NSGetModule(aComponentManager, aFileSpec) { return VUUArmyModule; }
