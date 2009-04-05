/* 
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 * 
 * The Original Code is the modifyheaders extension.
 * 
 * The Initial Developer of the Original Code is Gareth Hunt
 * <gareth-hunt@rocketmail.com>. Portions created by the Initial Developer
 * are Copyright (C) 2005 the Initial Developer. All Rights Reserved.
 *
 */

// A logger
var gConsoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);

function modifyheaders_logMessage(aMessage) {
  if (new PreferencesUtil().getPreference('bool', PreferencesUtil.prefLogMsgs))
    gConsoleService.logStringMessage('modifyheaders: ' + aMessage);
}

/* Defines the ModifyHeaders Header object */
function ModifyHeadersHeader() {
  this.aAction   = ""
  this.aName     = ""
  this.aValue    = ""
  this.aComment  = ""
  this.aEnabled  = false
  this.aSelected = true
}

ModifyHeadersHeader.prototype = {
	get action() { return this.aAction },
	set action(action) { this.aAction = action },
	
	get name() { return this.aName },
	set name(name) { this.aName = name },
	
	get value() { return this.aValue },
	set value(value) { this.aValue = value },
  
	get comment() { return this.aComment },
	set comment(comment) { this.aComment = comment },
	
	get enabled() { return this.aEnabled },
	set enabled(enabled) { this.aEnabled = enabled },
	
	get selected() { return this.aSelected },
	set selected(selected) { this.aSelected = selected },
	
	get wrappedJSObject() { return this },
	
	equals: function(obj) {
		return (this.action.toLowerCase() == obj.action.toLowerCase() && this.name.toLowerCase() == obj.name.toLowerCase() && this.value.toLowerCase() == obj.value.toLowerCase()) ? true : false
	},
  
  QueryInterface: function(iid) {
    modifyheaders_logMessage("Entered ModifyHeadersHeader.prototype.QueryInterface: " + iid);
    
    if (!iid.equals(Components.interfaces.mhIHeader) && !iid.equals(Components.interfaces.nsISupports)) {
        throw Components.results.NS_ERROR_NO_INTERFACE
    }
    modifyheaders_logMessage("Exiting ModifyHeadersHeader.prototype.QueryInterface")
    return this
  }
}

/* Defines the modifyheaders service for getting and setting headers */
function ModifyHeadersService() {
  this.headers = new Array()
  this.preferencesUtil = new PreferencesUtil()
  
  // Observer service is used to notify observing ModifyHeadersProxy objects that the headers have been updated
  this.observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService)
  
  this.initiated = false
  this.winOpen = false
}

/*
 * Modify Headers Service
 */
ModifyHeadersService.prototype = {
  get count() {
    if (!this.initiated) {
      this.init()
    }

    modifyheaders_logMessage("Returning the header count: " + this.headers.length)
    return this.headers.length
  },
  set count() { /* Do nothing */ },
  
  get alwaysOn() {
    return this.preferencesUtil.getPreference("bool", PreferencesUtil.prefAlwaysOn)
  },
  
  set alwaysOn(alwaysOn) {
    this.preferencesUtil.setPreference("bool", PreferencesUtil.prefAlwaysOn, alwaysOn)
  },
  
  get openAsTab() {
    return this.preferencesUtil.getPreference("bool", PreferencesUtil.prefOpenAsTab)
  },
  
  set openAsTab(openAsTab) {
    this.preferencesUtil.setPreference("bool", PreferencesUtil.prefOpenAsTab, openAsTab)
  },
  
  get windowOpen() {
    return this.winOpen
  },
  
  set windowOpen(winOpen) {
    this.winOpen = winOpen
  },
  
  // Load the headers from the preferences
  init: function() {
    modifyheaders_logMessage("Entered ModifyHeadersService.init")

    this.headers = new Array()
    
    // Load the headers from the preferences
    var enabled
    var action
    var name
    var value
    var comment
    
   	// Read preferences into headersArray
    var headerCount = this.preferencesUtil.getPreference("int", PreferencesUtil.prefHeaderCount);
    
   	for (var i=0; i < headerCount; i++) {
      name = this.preferencesUtil.getPreference("char", PreferencesUtil.prefHeaderName + i);
      value = this.preferencesUtil.getPreference("char", PreferencesUtil.prefHeaderValue + i);
      action = this.preferencesUtil.getPreference("char", PreferencesUtil.prefHeaderAction + i);
      comment = this.preferencesUtil.getPreference("char", PreferencesUtil.prefHeaderComment + i);
      enabled = this.preferencesUtil.getPreference("bool", PreferencesUtil.prefHeaderEnabled + i);
      
      this.addHeader(name, value, action, comment, enabled);
    }
    
    this.initiated = true;
    modifyheaders_logMessage("Exiting ModifyHeadersService.init");
  },
  
  getHeader: function(index) {
    var objHeader = Components.classes["@modifyheaders.mozdev.org/header;1"].createInstance(Components.interfaces.mhIHeader)
    objHeader.action = this.headers[index]["action"]
    objHeader.name = this.headers[index]["name"]
    objHeader.value = this.headers[index]["value"]
    objHeader.comment = this.headers[index]["comment"]
    objHeader.enabled = this.headers[index]["enabled"]
    
    return objHeader 
  }, 
  
  getHeaders: function(count) {
    modifyheaders_logMessage("Entered ModifyHeadersService.getHeaders")
    
    var objHeader = null
    var aHeaders = new Array()
    
    for (var i=0; i < this.headers.length; i++) {
      objHeader = this.getHeader(i)
      aHeaders[i] = objHeader
    }
    
  	count.value = aHeaders.length
  	modifyheaders_logMessage("Returning the header object")
  	return aHeaders
  },
  
  getHeadersAsXML: function(strHeaderIndices) {
    modifyheaders_logMessage("Entered ModifyHeadersService.getHeadersAsJSONString: " + strHeaderIndices)
    var headerIndices = strHeaderIndices.split(",")
    
    var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser)
    var headersXML = parser.parseFromString("<modifyheaders></modifyheaders>", "text/xml")
    var root = headersXML.documentElement
    
    // Loop over the values
    for (var i=0; i < headerIndices.length; i++) {
      objHeader = this.getHeader(headerIndices[i])
      
      var action = headersXML.createTextNode(objHeader.action)
      var actionElem = headersXML.createElement("action")
      actionElem.appendChild(action) 
      
      var name = headersXML.createTextNode(objHeader.name)
      var nameElem = headersXML.createElement("name")
      nameElem.appendChild(name)
      
      var value = headersXML.createTextNode(objHeader.value)
      var valueElem = headersXML.createElement("value")
      valueElem.appendChild(value)
      
      var comment = headersXML.createTextNode(objHeader.comment)
      var commentElem = headersXML.createElement("comment")
      commentElem.appendChild(comment)
      
      var header = headersXML.createElement("header")
      header.appendChild(actionElem)
      header.appendChild(nameElem)
      header.appendChild(valueElem)
      header.appendChild(commentElem)
      
      root.appendChild(header)
    }
    
    var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Components.interfaces.nsIDOMSerializer)
    
    modifyheaders_logMessage("Exiting ModifyHeadersService.getHeadersAsJSONString")
    // Return a XML string
    return "<?xml version=\"1.0\"?>" + serializer.serializeToString(headersXML)
  },
  
  // Adds a header to the headers array
  addHeader: function(name, value, action, comment, enabled) {
    modifyheaders_logMessage("Entered ModifyHeadersService.addHeader")
    
    // TODO Validate the arguments
    
    // Add the header to the Array
    var header = new Array()
    header["enabled"] = enabled
    header["action"]  = action
    header["name"]    = name
    header["value"]   = value
    header["comment"] = comment
    
    this.headers.push(header)
    
    this.savePreferences()
    modifyheaders_logMessage("Exiting ModifyHeadersService.addHeader")
  },
  
  setHeader: function(index, name, value, action, comment, enabled) {
    modifyheaders_logMessage("Entered ModifyHeadersService.setHeader")
    
    // TODO Validate the arguments
    
    // Update the values
    this.headers[index]["enabled"] = enabled
    this.headers[index]["action"]  = action
    this.headers[index]["name"]    = name
    this.headers[index]["value"]   = value
    this.headers[index]["comment"] = comment
    
    this.savePreferences()
    modifyheaders_logMessage("Exiting ModifyHeadersService.setHeader")
  },
  
  // Remove the header with the specified index
  removeHeader: function(index) {
    modifyheaders_logMessage("Entered ModifyHeadersService.removeHeader")
    this.headers.splice(index, 1)
    this.savePreferences()
    modifyheaders_logMessage("Exiting ModifyHeadersService.removeHeader")
  },
  
  isHeaderEnabled: function(index) {
    return this.headers[index]["enabled"]
  },
  
  setHeaderEnabled: function(index, enabled) {
    this.headers[index]["enabled"] = enabled
    this.savePreferences()
  },
  
  getHeaderAction: function(index) {
    return this.headers[index]["action"]
  },
  
  getHeaderName: function(index) {
    return this.headers[index]["name"]
  },
  
  getHeaderValue: function(index) {
    return this.headers[index]["value"]
  },
  
  getHeaderComment: function(index) {
    return this.headers[index]["comment"]
  },
  
  switchHeaders: function(index1, index2) {
    var header = this.headers[index1]
    this.headers[index1] = this.headers[index2]
    this.headers[index2] = header
    this.savePreferences()
  },
  
  // Persist the headers to the preferences.
  savePreferences: function() {
    // Only save headers if the service has been initiated
    if (this.initiated) {
      // TODO Clear the preferences first
      // This ensures old headers are not maintained in the preferences
      // I'm sure there is a better way than this
      
      // Loop over the headers
      for (var i=0; i < this.count; i++) {
        this.preferencesUtil.setPreference("char", PreferencesUtil.prefHeaderAction + i, this.headers[i]["action"])
        this.preferencesUtil.setPreference("char", PreferencesUtil.prefHeaderName + i, this.headers[i]["name"])
        this.preferencesUtil.setPreference("char", PreferencesUtil.prefHeaderValue + i, this.headers[i]["value"])
        this.preferencesUtil.setPreference("char", PreferencesUtil.prefHeaderComment + i, this.headers[i]["comment"])
        this.preferencesUtil.setPreference("bool", PreferencesUtil.prefHeaderEnabled + i, this.headers[i]["enabled"])
      }
      
      this.preferencesUtil.setPreference("int", PreferencesUtil.prefHeaderCount, this.count)
    }
  },
  
  // Clear the headers from their preferences
  clearPreferences: function() {
    // Loop over the headers
    for (var i=0; i < this.count; i++) {
      this.preferencesUtil.deletePreference(PreferencesUtil.prefHeaderAction + i)
      this.preferencesUtil.deletePreference(PreferencesUtil.prefHeaderEnabled + i)
      this.preferencesUtil.deletePreference(PreferencesUtil.prefHeaderName + i)
      this.preferencesUtil.deletePreference(PreferencesUtil.prefHeaderValue + i)
      this.preferencesUtil.deletePreference(PreferencesUtil.prefHeaderComment + i)
    }
  },
  
  QueryInterface: function(iid) {
    modifyheaders_logMessage("Entered ModifyHeadersService.prototype.QueryInterface: " + iid)
    
    if (!iid.equals(Components.interfaces.nsIModifyheaders) && !iid.equals(Components.interfaces.nsISupports)) {
      throw Components.results.NS_ERROR_NO_INTERFACE
    }
    modifyheaders_logMessage("Exiting ModifyHeadersService.prototype.QueryInterface")
    return this
  }
}

/* Define the modifyheaders proxy object. */
function ModifyHeadersProxy() {
  modifyheaders_logMessage("Entered ModifyHeadersProxy")
  this.headers = new Array()
  this.preferencesUtil = new PreferencesUtil()
  
  this.modifyheadersService = Components.classes[ModifyHeadersModule.serviceContractID].getService(Components.interfaces.nsIModifyheaders)
  modifyheaders_logMessage("Exiting ModifyHeadersProxy")
}

// nsIObserver interface method
ModifyHeadersProxy.prototype.observe = function(subject, topic, data) {
  modifyheaders_logMessage("Entered ModifyHeadersProxy.prototype.observe")
  
  if (topic == 'http-on-modify-request') {
    modifyheaders_logMessage("topic is http-on-modify-request")
    subject.QueryInterface(Components.interfaces.nsIHttpChannel)
    
    if (this.modifyheadersService.windowOpen || this.modifyheadersService.alwaysOn) {
  
      var headerCount = this.modifyheadersService.count
      
      for (var i=0; i < headerCount; i++) {
        modifyheaders_logMessage("iteration: " + i)
        
        if (this.modifyheadersService.isHeaderEnabled(i)) {
          var headerName = this.modifyheadersService.getHeaderName(i)
          
          // This is the default for action = Modify
          var headerValue = this.modifyheadersService.getHeaderValue(i)
          var headerAppend = false
          
          if (this.modifyheadersService.getHeaderAction(i) == "Add") {
            headerAppend = true
          } else if (this.modifyheadersService.getHeaderAction(i) == "Filter") {
            headerValue = ""
          }
          modifyheaders_logMessage("Added header: " + headerName)
          subject.setRequestHeader(headerName, headerValue, headerAppend)
        }
      }
      // TODO Add an optional ModifyHeaders header so that users know the tool is active
      // subject.setRequestHeader("x-modifyheaders", "version 0.4", true)
    }
  } else if (topic == 'app-startup') {
    modifyheaders_logMessage("topic is app-startup")
    
    if ("nsINetModuleMgr" in Components.interfaces) {
      // Should be an old version of Mozilla (before september 15, 2003
      // Do Nothing as these old versions of firefox (firebird, phoenix etc) are not supported
  	} else {
      // Should be a new version of  Mozilla (after september 15, 2003)
      var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService)
      observerService.addObserver(this, "http-on-modify-request", false)
    }
  } else {
    modifyheaders_logMessage("No observable topic defined")
  }
  modifyheaders_logMessage("Exiting ModifyHeadersProxy.prototype.observe")
}

// nsISupports interface method
ModifyHeadersProxy.prototype.QueryInterface = function(iid) {
  modifyheaders_logMessage("Entered ModifyHeadersProxy.prototype.QueryInterface: " + iid)
  
  if (!iid.equals(Components.interfaces.nsIObserver) && !iid.equals(Components.interfaces.nsISupports)) {
    throw Components.results.NS_ERROR_NO_INTERFACE
  }
  modifyheaders_logMessage("Exiting ModifyHeadersProxy.prototype.QueryInterface")
  return this
}


// A utility class for getting and setting user preferences
function PreferencesUtil() {
  this.prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService)
  this.prefService = this.prefService.getBranch("")
}

// Static strings that specify the names of the preferences used by modifyheaders
PreferencesUtil.prefAlwaysOn      = "modifyheaders.config.alwaysOn"
PreferencesUtil.prefHeaderCount   = "modifyheaders.headers.count"
PreferencesUtil.prefHeaderAction  = "modifyheaders.headers.action"
PreferencesUtil.prefHeaderEnabled = "modifyheaders.headers.enabled"
PreferencesUtil.prefHeaderName    = "modifyheaders.headers.name"
PreferencesUtil.prefHeaderValue   = "modifyheaders.headers.value"
PreferencesUtil.prefHeaderComment = "modifyheaders.headers.comment"
PreferencesUtil.prefLogMsgs       = "modifyheaders.config.logMsgs"
PreferencesUtil.prefOpenAsTab     = "modifyheaders.config.openNewTab"

// Convenience method to get a user preference value
PreferencesUtil.prototype.getPreference = function(type, name) {
  var prefValue
  
  if (this.prefService.prefHasUserValue(name)) {
    if (type=='bool') {
      prefValue = this.prefService.getBoolPref(name)
    } else if (type=='char') {
      prefValue = this.prefService.getCharPref(name)
    } else if (type=='int') {
      prefValue = this.prefService.getIntPref(name)
    }

  // Set the preference with a default value
  } else {
    if (type=='bool') {
 	    this.setPreference(type, name, false)
 	    prefValue = false
    } else if (type=='char') {
 	    this.setPreference(type, name, "")
 	    prefValue = ""
    } else if (type=='int') {
      this.setPreference(type, name, 0)
      prefValue = 0
    }
  }
  
  return prefValue;
}

// Convenience method to set a user preference
PreferencesUtil.prototype.setPreference = function(type, name, value) {
  if (type=='bool') {
    this.prefService.setBoolPref(name, value)
  } else if (type=='char') {
    this.prefService.setCharPref(name, value)
  } else if (type=='int') {
    this.prefService.setIntPref(name, value)
  }
}

PreferencesUtil.prototype.deletePreference = function(name) {
  this.prefService.clearUserPref(name);
}

/* ModifyHeadersModule is responsible for the registration of the component */
var ModifyHeadersModule = {

  headerCID: Components.ID("{6b2f2fc7-a26c-4602-a08d-bd6d065a86e3}"),
  headerName: "ModifyHeaders Header Object",
  headerContractID: "@modifyheaders.mozdev.org/header;1",
  
  proxyCID: Components.ID("{0eff9eeb-c51a-4f07-9823-27bc32fdae13}"),
  proxyName: "ModifyHeaders Proxy",
  proxyContractID: "@modifyheaders.mozdev.org/proxy;1",
  
  serviceCID: Components.ID("{feb80fc3-9e72-4fc5-bc72-986957ada6cc}"),
  serviceName: "ModifyHeaders Service",
  serviceContractID: "@modifyheaders.mozdev.org/service;1",
  
  firstTime: true,
  
  // Register the component with the browser
  registerSelf: function (compMgr, fileSpec, location, type) {
    modifyheaders_logMessage("Entered ModifyHeadersModule.registerSelf, firstTime: " + this.firstTime)
    
    if (this.firstTime) {
      modifyheaders_logMessage("This is the firstTime")
      this.firstTime = false
      throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN
    }
    
    var compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
    
    // Register the objects with the component manager
    compMgr.registerFactoryLocation(this.headerCID, this.headerName, this.headerContractID, fileSpec, location, type)
    compMgr.registerFactoryLocation(this.proxyCID, this.proxyName, this.proxyContractID, fileSpec, location, type)
    compMgr.registerFactoryLocation(this.serviceCID, this.serviceName, this.serviceContractID, fileSpec, location, type)
    
    var catman = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager)
    catman.addCategoryEntry("app-startup", this.proxyName, this.proxyContractID, true, true)
    
    modifyheaders_logMessage("Exiting ModifyHeadersModule.registerSelf")
  },
  
  // Removes the component from the app-startup category
  unregisterSelf: function(compMgr, fileSpec, location) {
    var catman = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager)
    catMan.deleteCategoryEntry("app-startup", this.proxyContractID, true)
  },
  
  // Return the Factory object
  getClassObject: function (compMgr, cid, iid) {
    modifyheaders_logMessage("Entered ModifyHeadersModule.getClassObject")
    
    if (!iid.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED
    
    if (cid.equals(this.headerCID)) {
      return {
        createInstance: function(outer, iid) {
          modifyheaders_logMessage("Entered ModifyHeadersFactory.createInstance: " + iid)
          if (outer != null) 
            throw Components.results.NS_ERROR_NO_AGGREGATION
          
          if (iid.equals(Components.interfaces.nsISupports) || iid.equals(Components.interfaces.mhIHeader)) {
            modifyheaders_logMessage("Exiting ModifyHeadersFactory.createInstance")
            modifyheaders_logMessage("Returning ModifyHeadersHeader")
            return new ModifyHeadersHeader()
          }
          
          throw Components.results.NS_ERROR_NO_INTERFACE
        }
      }
    } else if (cid.equals(this.proxyCID)) {
      return {
        createInstance: function(outer, iid) {
          modifyheaders_logMessage("Entered ModifyHeadersFactory.createInstance: " + iid)
          if (outer != null) 
            throw Components.results.NS_ERROR_NO_AGGREGATION
          
          if (iid.equals(Components.interfaces.nsISupports) || iid.equals(Components.interfaces.nsIObserver)) {
            modifyheaders_logMessage("Exiting ModifyHeadersFactory.createInstance")
            modifyheaders_logMessage("Returning ModifyHeadersProxy")
            return new ModifyHeadersProxy()
          }
          
          throw Components.results.NS_ERROR_NO_INTERFACE
        }
      }
    } else if (cid.equals(this.serviceCID)) {
      return {
        createInstance: function(outer, iid) {
          modifyheaders_logMessage("Entered ModifyHeadersFactory.createInstance: " + iid)
          if (outer != null) 
            throw Components.results.NS_ERROR_NO_AGGREGATION
          
          if (iid.equals(Components.interfaces.nsISupports) || iid.equals(Components.interfaces.nsIModifyheaders)) {
            modifyheaders_logMessage("Exiting ModifyHeadersFactory.createInstance")
            modifyheaders_logMessage("Returning ModifyHeadersService")
            return new ModifyHeadersService()
          }
          
          throw Components.results.NS_ERROR_NO_INTERFACE
        }
      }
    }
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
    
  canUnload: function(compMgr) {
    return true
  }
}

/* Entrypoint - registers the component with the browser */
function NSGetModule(compMgr, fileSpec) {
    modifyheaders_logMessage("Entered NSGetModule");
    return ModifyHeadersModule;
}
