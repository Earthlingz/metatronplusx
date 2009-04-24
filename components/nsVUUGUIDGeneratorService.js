/**
 * Written by Anthony Gabel on 8 September 2005.
 *
 * Implementation for a SERVICE (singleton) that generates GUIDs.
 */


const COMPONENT_CONTRACTID = "@mozilla.org/vuu/guid-generator-service;1";
const COMPONENT_CID = Components.ID("{9bda8d50-772d-4f75-b6e5-c07f55b86aa6}");
const COMPONENT_IID = Components.interfaces.nsIVUUGUIDGeneratorService;
const COMPONENT_NAME = "VUU GUID Generator JS Component";

/**
 * Constructor.
 */
function nsVUUGUIDGeneratorServiceComponent( )
{
  this.mGUID = 0;
}

/**
 * Adds required functions to the prototype.
 */
nsVUUGUIDGeneratorServiceComponent.prototype =
{
  /**
   * Returns a GUID.
   *
   * @return a GUID
   */
  getGUID: function ()
  {
    this.mGUID++;
    return this.mGUID;
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
var VUUGUIDModule =
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
        
      return (new nsVUUGUIDGeneratorServiceComponent( )).QueryInterface(aIID);
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
function NSGetModule(aComponentManager, aFileSpec) { return VUUGUIDModule; }
