/**
 * Written by Anthony Gabel on 3 August 2005.
 *
 * Implementation for a SERVICE (singleton) that stores information
 * related to the different Utopia servers.
 */


const COMPONENT_CONTRACTID = "@mozilla.org/vuu/servers-service;1";
const COMPONENT_CID = Components.ID("{1c5b2340-1d55-463c-9957-5036500c4913}");
const COMPONENT_IID = Components.interfaces.nsIVUUServersService;
const COMPONENT_NAME = "VUU Servers JS Component (Service)";

/**
 * Constructor.
 */
function nsVUUServersServiceComponent( )
{
  // no code
}

/**
 * Adds required variables / functions to the prototype.
 */
nsVUUServersServiceComponent.prototype =
{
  /** Read only part of a location's href that identifies it as being a Swirve site */
  mSWIRVE_HREF: "swirve.com",
  get SWIRVE_HREF() { return this.mSWIRVE_HREF; },
  
  mIP_ADDRESS_START: "206.104.8.",
  get IP_ADDRESS_START() { return this.mIP_ADDRESS_START; },

  /** whether this service has been initialized yet (available servers set up) */
  mInitialized: false,
  get initialized() { return this.mInitialized; },
  set initialized(aInitialized) { return this.mInitialized = aInitialized; },

  /** Internal only actual array of servers */
  mServers: new Array(),

  /** Read only number of servers managed */
  get numServers() { return this.mServers.length; },

  /**
   * Adds a new server to the list of servers managed by this service
   *
   * param:  aName - String - Human readable name of the server
   * param:  aHrefID - String - Part of a href that identifies this server
   * param:  aIPAddress - String - IP Address of this server
   * param:  aSidebarElementID - String - Partial ID of the sidebar elements
   *         used to display army return times and spell duration in the sidebar.
   * return: TRUE if server added without error; FALSE otherwise
   */
  addNewServer: function (aName, aHrefID, aIPAddress, aSidebarElementID)
  {
    var server = Components.classes["@mozilla.org/vuu/server;1"]
      .createInstance(Components.interfaces.nsIVUUServer);

    server.name = aName;
    server.hrefID = aHrefID;
    server.ipAddress = aIPAddress;
    server.sidebarElementID = aSidebarElementID;
    
    // TODO - This is a crappy kludge until until I finally fix up preference naming for each server.
    // They should determine the name from their server number (eg. bFriendKingdom Bookmarks)
    // However, I should also change these bookmarks too allow for user defined colours / meanings.
    // Until I do this will have to do.
    if (server.hrefID == "gen")
    {
      server.bookmarkManager.initialize(
        "genesisFriendKingdomBookmarks", "genesisFoeKingdomBookmarks", "genesisInterestKingdomBookmarks",
        "genesisFriendProvinceBookmarks", "genesisFoeProvinceBookmarks", "genesisInterestProvinceBookmarks");
    }
    else if (server.hrefID == "wol")
    {
      server.bookmarkManager.initialize(
        "friendKingdomBookmarks", "foeKingdomBookmarks", "interestKingdomBookmarks",
        "friendProvinceBookmarks", "foeProvinceBookmarks", "interestProvinceBookmarks");
    }
    else if (server.hrefID == "b")
    {
      server.bookmarkManager.initialize(
        "server2FriendKingdomBookmarks", "server2FoeKingdomBookmarks", "server2InterestKingdomBookmarks",
        "server2FriendProvinceBookmarks", "server2FoeProvinceBookmarks", "server2InterestProvinceBookmarks");
    }
    
    this.mServers.push(server);
    
    return true;
  },
  
  /**
   * Returns the 'aIndex'ed server managed by this service. Indexes start at 0 and
   * are available in the order that the servers were added to this service.
   * param:  aIndex - long - index of the server to return
   * return: nsIVUUServer - if a matching server is found
   *         NULL - if no matching server is found
   */
  getServerByIndex: function (aIndex)
  {    
    return this.mServers[aIndex];
  },
  
  /**
   * Returns a server by examination of the given href.
   * param:  aHref - String - location.href (url) from which to search for a server
   * return: nsIVUUServer - if a matching server is found
   *         NULL - if no matching server is found
   */
  getServerByHref: function (aHref)
  {
    var serverHrefID = aHref.substring(aHref.indexOf("//") + 2, aHref.indexOf("."));
    var i = 0;
    
    // check if of the form (online webpage) "http://wol.swirve.com/"
    for (i = 0; i < this.mServers.length; i++)
    {
      if (serverHrefID == this.mServers[i].hrefID)
      {
        return this.mServers[i];
      }
    }
    
    // check if of the form (IP address) "http://xxx.xxx.xxx.xxx/"
    if (aHref.indexOf(this.mIP_ADDRESS_START) != -1)
    {
      for (i = 0; i < this.mServers.length; i++)
      {
        if (aHref.indexOf(this.mServers[i].ipAddress) != -1)
        {
          return this.mServers[i];
        }
      }
    }
    
    // check if contains server hrefID (for offline) eg. "wol.swirve.com"
    for (i = 0; i < this.mServers.length; i++)
    {
      if (aHref.indexOf(this.mServers[i].hrefID) != -1)
      {
        return this.mServers[i];
      }
    }
    
    return null;
  },
  
  /**
   * Returns a server with 'hrefID' matching 'aHrefID'
   * param:  aHref - String - hrefID of server to find (ie. 'wol', 'b', 'gen', etc.)
   * return: nsIVUUServer - if a matching server is found
   *         NULL - if no matching server is found
   */
  getServerByHrefID: function(aHrefID)
  {
    for (var i = 0; i < this.mServers.length; i++)
    {
      if (aHrefID.trim() == this.mServers[i].hrefID)
      {
        return this.mServers[i];
      }
    }
    
    return null;
  },
  
  /**
   * Returns a server determined by whether a server's cached kingdom
   * and island numbers match 'aKingdom' and 'aIsland'
   * param:  aKingdom - String - kingdom number to match
   * param:  aIsland - String - island number to match
   * return: nsIVUUServer - if a matching server is found
   *         NULL - if no matching server is found
   */
  getServerByKingdomIsland: function(aKingdom, aIsland)
  {
    for (var i = 0; i < this.mServers.length; i++)
    {
      if (aKingdom == this.mServers[i].cache.kingdom
          && aIsland == this.mServers[i].cache.island)
      {
        return this.mServers[i];
      }
    }
    
    return null;
  },
  
  /**
   * Returns a server determined by whether a server's cached kingdom
   * and island numbers appear in 'aHref's boardId (if it has one)
   * Used to determine if in-game utopia forums are being accessed
   * param:  aHref - string - href to search for correct boardId (boardid=xx-yy)
   * return: nsIVUUServer - if a matching server is found
   *         NULL - if no matching server is found
   */
  getServerByForumHref: function(aHref)
  {
    var regex = /boardid=(\d{1,2})-(\d{1,2})&/;
    var execArray = regex.exec(aHref);

    if (execArray)
    {
      for (var i = 0; i < this.mServers.length; i++)
      {
        if (execArray[2] == this.mServers[i].cache.kingdom
            && execArray[1] == this.mServers[i].cache.island)
        {
          return this.mServers[i];
        }
      }
    }
    
    return null;
  },
  
  /**
   * Saves kingdom bookmarks from all servers.
   */
  saveKingdomBookmarks: function ()
  {
    for (var i = 0; i < mServers.length; i++)
    {
      mServers[i].bookmarkManager.saveKingdomBookmarks();
    }
  },
  
  /**
   * Saves province bookmarks from all servers.
   */
  saveProvinceBookmarks: function ()
  {
    for (var i = 0; i < mServers.length; i++)
    {
      mServers[i].bookmarkManager.saveProvinceBookmarks();
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
var VUUServersModule =
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
        
      return (new nsVUUServersServiceComponent( )).QueryInterface(aIID);
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
function NSGetModule(aComponentManager, aFileSpec) { return VUUServersModule; }

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
