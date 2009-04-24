/**
 * Written by Anthony Gabel on 3 August 2005.
 *
 * Implementation for an XPCOM Utopia server.
 */


const COMPONENT_CONTRACTID = "@mozilla.org/vuu/server;1";
const COMPONENT_CID = Components.ID("{785ec3e8-9d47-45a3-b0a1-576b2d24b92d}");
const COMPONENT_IID = Components.interfaces.nsIVUUServer;
const COMPONENT_NAME = "VUU Server JS Component";

/**
 * Constructor.
 */
function nsVUUServerComponent( )
{
  this.mName = null;
  this.mHrefID = null;
  this.mIPAddress = null;
  this.mLoginType = "DNS";
  this.mFullHref = null;
  this.mSidebarElementID = null;
  
  this.mServerCache = Components.classes["@mozilla.org/vuu/server-cache;1"]
    .createInstance(Components.interfaces.nsIVUUServerCache);
  
  // TODO - bookmarking improvements
  this.mBookmarkManager = Components.classes["@mozilla.org/vuu/bookmark-manager;1"]
      .createInstance(Components.interfaces.nsIVUUBookmarkManager);
}

/**
 * Adds required functions to the prototype.
 */
nsVUUServerComponent.prototype =
{
  /** Read/write human readable name of this server (eg. Genesis) */
  get name() { return this.mName; },
  set name(aName) { return this.mName = aName; },
  
  /** Read/write part of a location's href that identifies this server (eg. b)*/
  get hrefID() { return this.mHrefID; },
  set hrefID(aHrefID) { return this.mHrefID = aHrefID; },
  
  /** Read/write IP address this server */
  get ipAddress() { return this.mIPAddress; },
  set ipAddress(aIPAddress) { return this.mIPAddress = aIPAddress; },
  
  /** Read/write loginType of this server ("DNS" or "IP") */
  get loginType() { return this.mLoginType; },
  set loginType(aLoginType)
  {
    this.mFullHref = null;
    return this.mLoginType = aLoginType;
  },
  
  /**
   * Read only full href of this server (eg. http://wol.swirve.com/)
   * OR (http://ipaddress/)
   */
  get fullHref()
  {
    if (this.mFullHref == null)
    {
      if (this.mLoginType == "DNS")
        this.mFullHref = "http://" + this.mHrefID + ".swirve.com/";
      else if (this.mLoginType == "IP")
        this.mFullHref = "http://" + this.mIPAddress + "/";
    }
    return this.mFullHref;
  },
  
  /**
   * Read/write partial ID of the sidebar elements used to display army return times
   * and spell duration in the sidebar. (eg. section_bf)
   */
  get sidebarElementID() { return this.mSidebarElementID; },
  set sidebarElementID(aSidebarElementID) { return this.mSidebarElementID = aSidebarElementID; },
  
  /** Read only cache holding various information about the current user session */
  get cache() { return this.mServerCache; },
  
  /** Read only bookmark manager for this server */
  get bookmarkManager() { return this.mBookmarkManager; },
  
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
var VUUServerModule =
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
        
      return (new nsVUUServerComponent( )).QueryInterface(aIID);
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
function NSGetModule(aComponentManager, aFileSpec) { return VUUServerModule; }
