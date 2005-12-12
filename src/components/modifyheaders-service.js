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

/* Components defined in this file */
const MODIFYHEADERS_PROXY_NAME = "ModifyHeaders Proxy";
const MODIFYHEADERS_PROXY_CID = Components.ID("{0eff9eeb-c51a-4f07-9823-27bc32fdae13}");
const MODIFYHEADERS_PROXY_CONTRACTID = "@modifyheaders.mozdev.org/proxy;1";

const MODIFYHEADERS_SERVICE_NAME = "ModifyHeaders Service";
const MODIFYHEADERS_SERVICE_CID = Components.ID("{4ed50bbc-0bc2-466c-ab02-8af097cfd020}");
const MODIFYHEADERS_SERVICE_CONTRACTID = "@modifyheaders.mozdev.org/service;1";


/* define the modifyheaders service for getting and setting headers */
function ModifyHeadersService() {
    this.headers = new Array();
    this.preferencesUtil = new PreferencesUtil();
    
    // Observer service is used to notiry observing ModifyHeadersProxy objects that the headers have been updated
    this.observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    
    this.initiated = false;
    this.winOpen = false;
}

/*
 * Modify Headers Service
 */
ModifyHeadersService.prototype = {
    get count() {
        if (!this.initiated) {
            this.init();
        }
    
        modifyheaders_logMessage("Returning the header count: " + this.headers.length);
        return this.headers.length;
    },
    set count() { /* Do nothing */ },
    
    get alwaysOn() {
        return this.preferencesUtil.getPreference("bool", PreferencesUtil.prefAlwaysOn);
    },
    
    set alwaysOn(alwaysOn) {
        this.preferencesUtil.setPreference("bool", PreferencesUtil.prefAlwaysOn, alwaysOn);
    },
    
    get openAsTab() {
        return this.preferencesUtil.getPreference("bool", PreferencesUtil.prefOpenAsTab);
    },
    
    set openAsTab(openAsTab) {
        this.preferencesUtil.setPreference("bool", PreferencesUtil.prefOpenAsTab, openAsTab);
    },
    
    get windowOpen() {
        return this.winOpen;
    },
    
    set windowOpen(winOpen) {
        this.winOpen = winOpen;
    },
    
    // Load the headers from the preferences
    init: function() {
        modifyheaders_logMessage("Entered ModifyHeadersService.init");

        this.headers = new Array();
        
        // Load the headers from the preferences
        var enabled;
        var action;
        var name;
        var value;
        
       	// Read preferences into headersArray
        var headerCount = this.preferencesUtil.getPreference("int", PreferencesUtil.prefHeaderCount);
        
       	for (var i=0; i < headerCount; i++) {
            name = this.preferencesUtil.getPreference("char", PreferencesUtil.prefHeaderName + i);
            value = this.preferencesUtil.getPreference("char", PreferencesUtil.prefHeaderValue + i);
            action = this.preferencesUtil.getPreference("char", PreferencesUtil.prefHeaderAction + i);
            enabled = this.preferencesUtil.getPreference("bool", PreferencesUtil.prefHeaderEnabled + i);
            
            this.addHeader(name, value, action, enabled);
        }
        
        this.initiated = true;
        modifyheaders_logMessage("Exiting ModifyHeadersService.init");
    },
    
    // Adds a header to the headers array
    addHeader: function(name, value, action, enabled) {
        modifyheaders_logMessage("Entered ModifyHeadersService.addHeader");
        
        // Validate the arguments
        // TODO
        
        // Add the header to the Array
        var header = new Array();
        header["enabled"] = enabled;
        header["action"] = action;
        header["name"] = name;
        header["value"] = value;
        
        this.headers.push(header);
        
        this.savePreferences();
        modifyheaders_logMessage("Exiting ModifyHeadersService.addHeader");
    },
    
    setHeader: function(index, name, value, action, enabled) {
        modifyheaders_logMessage("Entered ModifyHeadersService.setHeader");
        
        // Validate the arguments
        // TODO
        
        // Update the values
        this.headers[index]["enabled"] = enabled;
        this.headers[index]["action"] = action;
        this.headers[index]["name"] = name;
        this.headers[index]["value"] = value;
        
        this.savePreferences();
        modifyheaders_logMessage("Exiting ModifyHeadersService.setHeader");
    },
    
    // Remove the header with the specified index
    removeHeader: function(index) {
        modifyheaders_logMessage("Entered ModifyHeadersService.removeHeader");
        this.headers.splice(index, 1);
        this.savePreferences();
        modifyheaders_logMessage("Exiting ModifyHeadersService.removeHeader");
    },
    
    isHeaderEnabled: function(index) {
        return this.headers[index]["enabled"];
    },
    
    setHeaderEnabled: function(index, enabled) {
        this.headers[index]["enabled"] = enabled;
        this.savePreferences();
    },
    
    getHeaderAction: function(index) {
        return this.headers[index]["action"];
    },
    
    getHeaderName: function(index) {
        return this.headers[index]["name"];
    },
    
    getHeaderValue: function(index) {
        return this.headers[index]["value"];
    },
    
    switchHeaders: function(index1, index2) {
        var header = this.headers[index1];
        
        this.headers[index1] = this.headers[index2];
        this.headers[index2] = header;
        
        this.savePreferences();
    },
    
    
    // Persist the headers to the preferences.
    savePreferences: function() {
    
        // Only save headers if the service has been initiated
        if (this.initiated) {
        
            // TODO Clear the preferences first
            
            // Loop over the headers
            for (var i=0; i < this.count; i++) {
                this.preferencesUtil.setPreference("char", PreferencesUtil.prefHeaderAction + i, this.headers[i]["action"]);
                this.preferencesUtil.setPreference("char", PreferencesUtil.prefHeaderName + i, this.headers[i]["name"]);
                this.preferencesUtil.setPreference("char", PreferencesUtil.prefHeaderValue + i, this.headers[i]["value"]);
                this.preferencesUtil.setPreference("bool", PreferencesUtil.prefHeaderEnabled + i, this.headers[i]["enabled"]);
            }
            
            this.preferencesUtil.setPreference("int", PreferencesUtil.prefHeaderCount, this.count);
        }
    },
    
    // Clear the headers from there preferences
    clearPreferences: function() {
        // Loop over the headers
        for (var i=0; i < this.count; i++) {
            this.preferencesUtil.deletePreference(PreferencesUtil.prefHeaderAction + i);
            this.preferencesUtil.deletePreference(PreferencesUtil.prefHeaderEnabled + i);
            this.preferencesUtil.deletePreference(PreferencesUtil.prefHeaderName + i);
            this.preferencesUtil.deletePreference(PreferencesUtil.prefHeaderValue + i);
        }
    }
}


/* Define the modifyheaders proxy object. */
function ModifyHeadersProxy() {
    modifyheaders_logMessage("Entered ModifyHeadersProxy");
    this.headers = new Array();
    this.preferencesUtil = new PreferencesUtil();
    
    this.modifyheadersService = Components.classes[MODIFYHEADERS_SERVICE_CONTRACTID].getService(Components.interfaces.nsIModifyheaders);
    modifyheaders_logMessage("Exiting ModifyHeadersProxy");
}

// nsIObserver interface method
ModifyHeadersProxy.prototype.observe = function(subject, topic, data) {
    modifyheaders_logMessage("Entered ModifyHeadersProxy.prototype.observe");

    if (topic == 'http-on-modify-request') {
        modifyheaders_logMessage("topic is http-on-modify-request");
        
        subject.QueryInterface(Components.interfaces.nsIHttpChannel);
        
        if (this.modifyheadersService.windowOpen || this.modifyheadersService.alwaysOn) {
        
            var headerCount = this.modifyheadersService.count;
            
            for (var i=0; i < headerCount; i++) {
                modifyheaders_logMessage("iteration: " + i);
                
                if (this.modifyheadersService.isHeaderEnabled(i)) {
                    var headerName = this.modifyheadersService.getHeaderName(i);
                    
                    // This is the default for action = Modify
                    var headerValue = this.modifyheadersService.getHeaderValue(i);
                    var headerAppend = false;
                    
                    if (this.modifyheadersService.getHeaderAction(i) == "Add") {
                        headerAppend = true;
                    } else if (this.modifyheadersService.getHeaderAction(i) == "Filter") {
                        headerValue = "";
                    }
                    
                    modifyheaders_logMessage("Added header: " + headerName);
                    subject.setRequestHeader(headerName, headerValue, headerAppend);
                }
            }
            
            // TODO Add an optional ModifyHeaders header so that users know the tool is active
            //subject.setRequestHeader("x-modifyheaders", "version 0.4", true);
        }
        
    } else if (topic == 'app-startup') {
        modifyheaders_logMessage("topic is app-startup");
        
        if ("nsINetModuleMgr" in Components.interfaces) {
	        // Should be an old version of Mozilla (before september 15, 2003
	        // Do Nothing as these old versions of firefox (firebird, phoenix etc) are not supported
    	} else {
	        // Should be a new version of  Mozilla (after september 15, 2003)
            var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
            observerService.addObserver(this, "http-on-modify-request", false);
	    }
    } else {
        modifyheaders_logMessage("No observable topic defined");
    }
    
    modifyheaders_logMessage("Exiting ModifyHeadersProxy.prototype.observe");
}

// nsISupports interface method
ModifyHeadersProxy.prototype.QueryInterface = function(iid) {
    modifyheaders_logMessage("Entered ModifyHeadersProxy.prototype.QueryInterface");
    
    if (!iid.equals(nsIModifyheaders) && !iid.equals(Components.interfaces.nsISupports)) {
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    
    modifyheaders_logMessage("Exiting ModifyHeadersProxy.prototype.QueryInterface");
    return this;
}


// A utility class for getting and setting user preferences
function PreferencesUtil() {
    this.prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    this.prefService = this.prefService.getBranch("");
}

// Static strings that specify the names of the preferences used by modifyheaders
PreferencesUtil.prefHeaderCount = "modifyheaders.headers.count";
PreferencesUtil.prefHeaderAction = "modifyheaders.headers.action";
PreferencesUtil.prefHeaderEnabled = "modifyheaders.headers.enabled";
PreferencesUtil.prefHeaderName = "modifyheaders.headers.name";
PreferencesUtil.prefHeaderValue = "modifyheaders.headers.value";
PreferencesUtil.prefAlwaysOn = "modifyheaders.config.alwaysOn";
PreferencesUtil.prefOpenAsTab = "modifyheaders.config.openNewTab";

// Convenience method to get a user preference value
PreferencesUtil.prototype.getPreference = function(type, name) {
    var prefValue;
    
    if (this.prefService.prefHasUserValue(name)) {
        if (type=='bool') {
            prefValue = this.prefService.getBoolPref(name);
        } else if (type=='char') {
            prefValue = this.prefService.getCharPref(name);
        } else if (type=='int') {
            prefValue = this.prefService.getIntPref(name);
        }
    
    // Set the preference with a default value
    } else {
        modifyheaders_logMessage("Preference '" + name + "' does not exist, so setting the preference with a default value");
        if (type=='bool') {
       	    this.setPreference(type, name, false);
       	    prefValue = false;
        } else if (type=='char') {
       	    this.setPreference(type, name, "");
       	    prefValue = "";
        } else if (type=='int') {
            this.setPreference(type, name, 0);
            prefValue = 0;
        }
    }
    
    return prefValue;
}

// Convenience method to set a user preference
PreferencesUtil.prototype.setPreference = function(type, name, value) {
    if (type=='bool') {
        this.prefService.setBoolPref(name, value);
    } else if (type=='char') {
        this.prefService.setCharPref(name, value);
    } else if (type=='int') {
        this.prefService.setIntPref(name, value);
    }
}

PreferencesUtil.prototype.deletePreference = function(name) {
    this.prefService.clearUserPref(name);
}


/*
 * Factory object, is called to generate a new instance of the ModifyHeadersProxy object
 */
var ModifyHeadersFactory = new Object();

ModifyHeadersFactory.createInstance = function (outer, iid) {
    modifyheaders_logMessage("Entered ModifyHeadersFactory.createInstance");
    if (outer != null)
        throw Components.results.NS_ERROR_NO_AGGREGATION;

    if (iid.equals(Components.interfaces.nsIObserver)) {
        modifyheaders_logMessage("Exiting ModifyHeadersFactory.createInstance");
        return new ModifyHeadersProxy();
    } else if (iid.equals(Components.interfaces.nsIModifyheaders)) {
        modifyheaders_logMessage("Exiting ModifyHeadersFactory.createInstance");
        return new ModifyHeadersService();
    }

    throw Components.results.NS_ERROR_NO_INTERFACE;

}


/* ModifyHeadersModule is responsible for the registration of the component */
var ModifyHeadersModule = new Object();

ModifyHeadersModule.firstTime = true;

// Register the component with the browser
ModifyHeadersModule.registerSelf = function (compMgr, fileSpec, location, type) {
    modifyheaders_logMessage("Entered ModifyHeadersModule.registerSelf");
    modifyheaders_logMessage("firstTime: " + this.firstTime);
    
    if (this.firstTime) {
        modifyheaders_logMessage("This is the firstTime");
        this.firstTime = false;
        throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
    }

    var compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);

    // Register the service factory object
    compMgr.registerFactoryLocation(MODIFYHEADERS_SERVICE_CID,
                                    MODIFYHEADERS_SERVICE_NAME,
                                    MODIFYHEADERS_SERVICE_CONTRACTID, 
                                    fileSpec, location, type);

    // Register the proxy factory object
    compMgr.registerFactoryLocation(MODIFYHEADERS_PROXY_CID,
                                    MODIFYHEADERS_PROXY_NAME,
                                    MODIFYHEADERS_PROXY_CONTRACTID, 
                                    fileSpec, location, type);

    var catman = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager);
    catman.addCategoryEntry("app-startup",
                            MODIFYHEADERS_PROXY_NAME,
                            MODIFYHEADERS_PROXY_CONTRACTID,
                            true, true);

    modifyheaders_logMessage("Exiting ModifyHeadersModule.registerSelf");
}

// Removes the component from the app-startup category
ModifyHeadersModule.unregisterSelf = function(compMgr, fileSpec, location) {
    var catman = Components.classes["@mozilla.org/categorymanager;1"] .getService(Components.interfaces.nsICategoryManager);
    catMan.deleteCategoryEntry("app-startup", MODIFYHEADERS_CONTRACTID, true);
}

// Return the Factory object
ModifyHeadersModule.getClassObject = function (compMgr, cid, iid) {
    modifyheaders_logMessage("Entered ModifyHeadersModule.getClassObject");
    
    if (!iid.equals(Components.interfaces.nsIFactory))
        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    
    // Check that the component ID is the Modifyheaders Proxy
    if (cid.equals(MODIFYHEADERS_PROXY_CID) || cid.equals(MODIFYHEADERS_SERVICE_CID)) {
        modifyheaders_logMessage("Exiting ModifyHeadersModule.getClassObject");
        return ModifyHeadersFactory;
    }
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
}

ModifyHeadersModule.canUnload = function(compMgr) {
    return true;
}


/* Entrypoint - registers the component with the browser */
function NSGetModule(compMgr, fileSpec) {
    modifyheaders_logMessage("Entered NSGetModule");
    return ModifyHeadersModule;
}


// A logger
var gConsoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);

function modifyheaders_logMessage(aMessage) {
    // Uncomment this to activate debugging messages
    // gConsoleService.logStringMessage('modifyheaders: ' + aMessage);
}
