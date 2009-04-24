/**
 * Written by Anthony Gabel on 3 August 2005.
 *
 * Implementation for an XPCOM Utopia spell.
 */


const COMPONENT_CONTRACTID = "@mozilla.org/vuu/spell;1";
const COMPONENT_CID = Components.ID("{49c9ea17-61f2-47dc-aaec-be4fe548f394}");
const COMPONENT_IID = Components.interfaces.nsIVUUSpell;
const COMPONENT_NAME = "VUU Spell (Cached) JS Component";

/**
 * Constructor.
 */
function nsVUUSpellComponent( )
{
  this.mName = null;
  this.mDuration = null;
}

/**
 * Adds required functions to the prototype.
 */
nsVUUSpellComponent.prototype =
{
  /** Read/write human readable name of the spell */
  get name() { return this.mName; },
  set name(aName) { return this.mName = aName; },
  
  /** Read/write duration of the spell in hours */
  get duration() { return this.mDuration; },
  set duration(aDuration) { return this.mDuration = aDuration; },
  
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
var VUUSpellModule =
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
        
      return (new nsVUUSpellComponent( )).QueryInterface(aIID);
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
function NSGetModule(aComponentManager, aFileSpec) { return VUUSpellModule; }
