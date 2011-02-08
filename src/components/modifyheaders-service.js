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
if (!ModifyHeaders)
	var ModifyHeaders = {};

if (!ModifyHeaders.Header) {
	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
	
	ModifyHeaders.Header = function () {
		this.aAction   = "";
		this.aName     = "";
		this.aValue    = "";
		this.aComment  = "";
		this.aEnabled  = false;
		this.aSelected = true;
	};
	
	ModifyHeaders.Header.prototype = {
		classDescription: "Modify Headers Header",
		classID:          Components.ID("{6b2f2fc7-a26c-4602-a08d-bd6d065a86e3}"),
		contractID:       "@modifyheaders.mozdev.org/header;1",
		
		QueryInterface: XPCOMUtils.generateQI([Components.interfaces.mhIHeader]),

		get action () { return this.aAction },
		set action (action) { this.aAction = action },
		
		get name () { return this.aName },
		set name (name) { this.aName = name },
		
		get value () { return this.aValue },
		set value (value) { this.aValue = value },
		 
		get comment () { return this.aComment },
		set comment (comment) { this.aComment = comment },
		
		get enabled () { return this.aEnabled },
		set enabled (enabled) { this.aEnabled = enabled },
		
		get selected () { return this.aSelected },
		set selected (selected) { this.aSelected = selected },
		
		equals: function (obj) {
			return (this.action.toLowerCase() == obj.action.toLowerCase() && this.name.toLowerCase() == obj.name.toLowerCase() && this.value.toLowerCase() == obj.value.toLowerCase()) ? true : false;
		}
	};
}

if (!ModifyHeaders.Service) {
	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
	
	ModifyHeaders.Service = function () {
		this.configuration = {
			headers: []
		};
		this.preferencesUtil = new ModifyHeaders.PreferencesUtil();
		this.initiated = false;
		this.winOpen = false;
	};
	
	ModifyHeaders.Service.prototype = {
		classDescription: "Modify Headers Service",
		classID:          Components.ID("{feb80fc3-9e72-4fc5-bc72-986957ada6cc}"),
		contractID:       "@modifyheaders.mozdev.org/service;1",
		
		QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIModifyheaders]),
		
		get count () {
			if (!this.initiated) {
				this.init();
			}
			return this.configuration.headers.length;
		},
		set count (c) { /* Do nothing */ },
		
		get alwaysOn () {
			return this.preferencesUtil.getPreference("bool", this.preferencesUtil.prefAlwaysOn);
		},
		
		set alwaysOn (alwaysOn) {
			this.preferencesUtil.setPreference("bool", this.preferencesUtil.prefAlwaysOn, alwaysOn);
		},
		
		get openAsTab () {
			return this.preferencesUtil.getPreference("bool", this.preferencesUtil.prefOpenAsTab);
		},
		 
		set openAsTab (openAsTab) {
			this.preferencesUtil.setPreference("bool", this.preferencesUtil.prefOpenAsTab, openAsTab);
		},
		
		get windowOpen () {
			return this.winOpen;
		},
		
		set windowOpen (winOpen) {
			this.winOpen = winOpen;
		},
		
		// Load the headers from the preferences
		init: function () {
			if (!this.initiated) {
				var profileDir = Components.classes["@mozilla.org/file/directory_service;1"].
				getService(Components.interfaces.nsIProperties).
				get("ProfD", Components.interfaces.nsIFile);
				
				// Get the modifyheaders configuration file
				this.configFile = this.initConfigFile();
				
				// Load the configuration data
				if (this.configFile.exists()) {
					try {
						var data = new String();
						var fiStream = Components.classes["@mozilla.org/network/file-input-stream;1"].
							createInstance(Components.interfaces.nsIFileInputStream);
						var siStream = Components.classes["@mozilla.org/scriptableinputstream;1"].
							createInstance(Components.interfaces.nsIScriptableInputStream);
						fiStream.init(this.configFile, 1, 0, false);
						siStream.init(fiStream);
						data += siStream.read(-1);
						siStream.close();
						fiStream.close();
						this.configuration = JSON.parse(data);
					} catch(e) {
						Components.utils.reportError(e);
					}
				}
				
				// Attempt to migrate headers if none found before
				if (this.configuration.headers.length == 0 && !this.preferencesUtil.getPreference("bool", this.preferencesUtil.prefMigratedHeaders)) {
					this.migrateHeaders();
				}
				
				this.initiated = true;
			}
		},
		
		initConfigFile: function () {
			dump("\nEntered ModifyHeaders.initConfigFile()");
	        // Get the configuration file
			var theFile = null;
			
	        try {
	            theFile = Components.classes["@mozilla.org/file/directory_service;1"].
	                     getService(Components.interfaces.nsIProperties).
	                     get("ProfD", Components.interfaces.nsIFile);
	            theFile.append("modifyheaders.conf");
	        } catch (e) {
	            Components.utils.reportError(e);
	        }

	        return theFile;
	        dump("\nExiting ModifyHeaders.initConfigFile()");
		},
		
		migrateHeaders: function () {
			// Read the preferences
			var headers = new Array();
			var headerCount = this.preferencesUtil.getPreference("int", this.preferencesUtil.prefHeaderCount);
		
			for (var i=0; i < headerCount; i++) {
				var header = {
					name: this.preferencesUtil.getPreference("char", this.preferencesUtil.prefHeaderName + i),
					value: this.preferencesUtil.getPreference("char", this.preferencesUtil.prefHeaderValue + i),
					action: this.preferencesUtil.getPreference("char", this.preferencesUtil.prefHeaderAction + i),
					comment: this.preferencesUtil.getPreference("char", this.preferencesUtil.prefHeaderComment + i),
					enabled: this.preferencesUtil.getPreference("bool", this.preferencesUtil.prefHeaderEnabled + i)
				};
				
				// Write to headers array
				headers.push(header);
			}
			
			// Write to configuration
			this.configuration.headers = headers;
			
			// Write to file
			this.saveConfiguration();
			
			// Set migrated preference
			this.preferencesUtil.setPreference("bool", this.preferencesUtil.prefMigratedHeaders, true)
		},
		  
		getHeader: function (index) {
			var objHeader = Components.classes["@modifyheaders.mozdev.org/header;1"].createInstance(Components.interfaces.mhIHeader);
			objHeader.action = this.configuration.headers[index]["action"];
			objHeader.name = this.configuration.headers[index]["name"];
			objHeader.value = this.configuration.headers[index]["value"];
			objHeader.comment = this.configuration.headers[index]["comment"];
			objHeader.enabled = this.configuration.headers[index]["enabled"];
			
			return objHeader;
		}, 
		
		getHeaders: function (count) {
			var objHeader = null;
			var aHeaders = new Array();
			
			for (var i=0; i < this.headers.length; i++) {
				objHeader = this.getHeader(i);
				aHeaders[i] = objHeader;
			}
			
			count.value = aHeaders.length;
			return aHeaders;
		},
		
		// Adds a header to the headers array
		addHeader: function (name, value, action, comment, enabled) {
			// TODO Validate the arguments
			
			// Add the header to the Array
			/* var header = new Array();
			header["enabled"] = enabled;
			header["action"]  = action;
			header["name"]    = name;
			header["value"]   = value;
			header["comment"] = comment; */
			var header = {
				enabled: enabled,
				action: action,
				name: name,
				value: value,
				comment: comment
			};
			
			this.configuration.headers.push(header);
			
			//this.savePreferences();
			this.saveConfiguration();
		},
		
		setHeader: function (index, name, value, action, comment, enabled) {
			// TODO Validate the arguments
			
			// Update the values
			this.configuration.headers[index]["enabled"] = enabled;
			this.configuration.headers[index]["action"]  = action;
			this.configuration.headers[index]["name"]    = name;
			this.configuration.headers[index]["value"]   = value;
			this.configuration.headers[index]["comment"] = comment;
			
			//this.savePreferences();
			this.saveConfiguration();
		},
		
		// Remove the header with the specified index
		removeHeader: function (index) {
			this.configuration.headers.splice(index, 1);
			//this.savePreferences();
			this.saveConfiguration();
		},
		
		isHeaderEnabled: function (index) {
			return this.configuration.headers[index]["enabled"];
		},
		
		setHeaderEnabled: function (index, enabled) {
			this.configuration.headers[index]["enabled"] = enabled;
			//this.savePreferences();
			this.saveConfiguration();
		},
		
		getHeaderAction: function (index) {
			return this.configuration.headers[index]["action"];
		},
		
		getHeaderName: function (index) {
			return this.configuration.headers[index]["name"];
		},
		
		getHeaderValue: function (index) {
			return this.configuration.headers[index]["value"];
		},
		
		getHeaderComment: function (index) {
			return this.configuration.headers[index]["comment"];
		},
		
		switchHeaders: function (index1, index2) {
			var header = this.configuration.headers[index1];
			this.configuration.headers[index1] = this.headers[index2];
			this.configuration.headers[index2] = header;
			//this.savePreferences();
			this.saveConfiguration();
		},
		
		// Save configuration file
		saveConfiguration: function () {
			var data = JSON.stringify(this.configuration);

	        try {
	            var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
	                createInstance(Components.interfaces.nsIFileOutputStream);
	            var flags = 0x02 | 0x08 | 0x20; // wronly | create | truncate
	            foStream.init(this.configFile, flags, 0664, 0);
	            foStream.write(data, data.length);
	            foStream.close();
	    	} catch (e) {
	    		// TODO Work out a way of handling or reporting the error
	            Components.utils.reportError(e);
		    }
		},
		
		// Persist the headers to the preferences.
		/*savePreferences: function () {
			// Only save headers if the service has been initiated
			if (this.initiated) {
				// TODO Clear the preferences first
				// This ensures old headers are not maintained in the preferences
				// I'm sure there is a better way than this
				
				// Loop over the headers
				for (var i=0; i < this.count; i++) {
					this.preferencesUtil.setPreference("char", this.preferencesUtil.prefHeaderAction + i, this.headers[i]["action"]);
					this.preferencesUtil.setPreference("char", this.preferencesUtil.prefHeaderName + i, this.headers[i]["name"]);
					this.preferencesUtil.setPreference("char", this.preferencesUtil.prefHeaderValue + i, this.headers[i]["value"]);
					this.preferencesUtil.setPreference("char", this.preferencesUtil.prefHeaderComment + i, this.headers[i]["comment"]);
					this.preferencesUtil.setPreference("bool", this.preferencesUtil.prefHeaderEnabled + i, this.headers[i]["enabled"]);
				}
				
				this.preferencesUtil.setPreference("int", this.preferencesUtil.prefHeaderCount, this.count);
			}
		},*/

		// Clear the headers from their preferences
		/*clearPreferences: function () {
			// Loop over the headers
			for (var i=0; i < this.count; i++) {
				this.preferencesUtil.deletePreference(this.preferencesUtil.prefHeaderAction + i);
				this.preferencesUtil.deletePreference(this.preferencesUtil.prefHeaderEnabled + i);
				this.preferencesUtil.deletePreference(this.preferencesUtil.prefHeaderName + i);
				this.preferencesUtil.deletePreference(this.preferencesUtil.prefHeaderValue + i);
				this.preferencesUtil.deletePreference(this.preferencesUtil.prefHeaderComment + i);
			}
		}*/
	};
}

if (!ModifyHeaders.Proxy) {
	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
	
	ModifyHeaders.Proxy = function () {
		this.modifyheadersService = Components.classes["@modifyheaders.mozdev.org/service;1"].getService(Components.interfaces.nsIModifyheaders);
	};
	
	ModifyHeaders.Proxy.prototype = {
		classDescription: "Modify Headers Proxy",
		classID:          Components.ID("{0eff9eeb-c51a-4f07-9823-27bc32fdae13}"),
		contractID:       "@modifyheaders.mozdev.org/proxy;1",
		
		QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIObserver]),
		
		_xpcom_categories: [{
			category: "profile-after-change",
			entry: "Modify Headers Proxy"
		}],
					
		// nsIObserver interface method
		observe: function (subject, topic, data) {
			if (topic == 'http-on-modify-request') {
				subject.QueryInterface(Components.interfaces.nsIHttpChannel);
				
				if (this.modifyheadersService.windowOpen || this.modifyheadersService.alwaysOn) {
					var headerCount = this.modifyheadersService.count;
					
					for (var i=0; i < headerCount; i++) {
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
							subject.setRequestHeader(headerName, headerValue, headerAppend);
						}
					}
					// TODO Add an optional ModifyHeaders header so that users know the tool is active
					// subject.setRequestHeader("x-modifyheaders", "version 0.4", true)
				}
			} else if (topic == 'profile-after-change') {
				if ("nsINetModuleMgr" in Components.interfaces) {
					// Should be an old version of Mozilla (before september 15, 2003
					// Do Nothing as these old versions of firefox (firebird, phoenix etc) are not supported
				} else {
					// Should be a new version of  Mozilla (after september 15, 2003)
					var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
					observerService.addObserver(this, "http-on-modify-request", false);
				}
			} else {
				//dump("\nNo observable topic defined");
			}
		}
	};
}

if (!ModifyHeaders.PreferencesUtil) {
	ModifyHeaders.PreferencesUtil = function () {
		this.prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		this.prefService = this.prefService.getBranch("");
		this.prefAlwaysOn        = "modifyheaders.config.alwaysOn";
		this.prefHeaderCount     = "modifyheaders.headers.count";
		this.prefHeaderAction    = "modifyheaders.headers.action";
		this.prefHeaderEnabled   = "modifyheaders.headers.enabled";
		this.prefHeaderName      = "modifyheaders.headers.name";
		this.prefHeaderValue     = "modifyheaders.headers.value";
		this.prefHeaderComment   = "modifyheaders.headers.comment";
		this.prefMigratedHeaders = "modifyheaders.config.migrated";
		this.prefOpenAsTab       = "modifyheaders.config.openNewTab";
	};
	
	ModifyHeaders.PreferencesUtil.prototype = {
		getPreference: function (type, name) {
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
		},

		// Convenience method to set a user preference
		setPreference: function (type, name, value) {
			if (type=='bool') {
				this.prefService.setBoolPref(name, value);
			} else if (type=='char') {
				this.prefService.setCharPref(name, value);
			} else if (type=='int') {
				this.prefService.setIntPref(name, value);
			}
		},
		
		deletePreference: function (name) {
			this.prefService.clearUserPref(name);
		}
	};
}

/* Entry point - registers the component with the browser */
if (XPCOMUtils.generateNSGetFactory) {
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([ModifyHeaders.Service,ModifyHeaders.Header,ModifyHeaders.Proxy]);
} else {
    var NSGetModule = XPCOMUtils.generateNSGetModule([ModifyHeaders.Service,ModifyHeaders.Header,ModifyHeaders.Proxy]);
}
