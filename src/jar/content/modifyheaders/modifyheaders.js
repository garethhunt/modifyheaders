// Constants for use within the ModifyHeaders class
const prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("");

var oModifyHeaders;

// This stops startModifyHeaders() from being run twice.
var initialized = false;

function startModifyHeaders() {
	if (!initialized) {
		oModifyHeaders = new ModifyHeaders();
		oModifyHeaders.start();
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.addObserver(oModifyHeaders,"http-on-modify-request",false);
		
		initialized = true;
	}
}

function stopModifyHeaders() {
    var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    observerService.removeObserver(oModifyHeaders,"http-on-modify-request");
    oModifyHeaders = null;
}


// ModifyHeaders object definition
function ModifyHeaders() {
}

ModifyHeaders.prototype = {

	// Control constants
	headersTree: null,
    actionMenuList: null,
    nameTextbox: null,
    valueTextbox: null,
    addButton: null,
    saveButton: null,

	// The names of the preference variables
	prefCount: "modifyheaders.headers.count",
	prefAction: "modifyheaders.headers.action",
	prefEnabled: "modifyheaders.headers.enabled",
	prefName: "modifyheaders.headers.name",
	prefValue: "modifyheaders.headers.value",

    // nsITreeView interface properties
    rows: new Array(),
    treeSelection: null, // nsiTreeSelection
    treeBox: null, // The tree
    
    editedRowID: null, // The row currently being edited
    
    // Getters and Setters
    set rowCount(i) { throw "rowCount is a readonly property"; },
    get rowCount() { return this.rows.length; },
    
    set selection(s) { this.treeSelection = s; },
    get selection() { return this.treeSelection; },
    
    // START nsITreeView interface methods
//    canDropBeforeAfter: function(index, before) { return false; },
//    canDropOn : function(index) { return false; },
//    cycleCell : function(row, columnID) { /* do nothing */ },
//    cycleHeader: function(columnID, element) { /* do nothing */ },
//    drop: function(row, orientation) { /* do nothing */ return false; },
    getCellProperties: function(row, columnID, properties) { /* do nothing */ },
    getCellText: function(row, columnID) {
		var key = columnID.substring(0, columnID.lastIndexOf("col"));
		if (this.rows[row] == null) {
		    return null;
		} else {
		    return this.rows[row][key];
		}
	},
//    getCellValue: function(row, columnID) { /* return null; */ },
    getColumnProperties: function(columnID, element, properties) { /* do nothing */ },
    getImageSrc: function(rowIndex, columnID) {
    	if (columnID == "enabledcol") {
    		var imageSrc;
    	
    		if (this.rows[rowIndex]["enabled"]) {
    			imageSrc = "chrome://modifyheaders/content/enabled.gif";
    		} else {
    			imageSrc = "chrome://modifyheaders/content/disabled.gif";
    		}
    		return imageSrc;
    	}
    	
    	return null;
    },
//    getLevel: function(index) { return 0; },
//    getParentIndex: function(rowIndex) { return 0; },
//    getProgressMode: function(rowIndex, columnID) { /* return 0; */ },
    getRowProperties: function(rowIndex, properties) { /* do nothing */ },
//    hasNextSibling: function(rowIndex, afterIndex) { return false; },
    isContainer: function(index) { return false; },
//    isContainerEmpty: function(index) { return false; },
//    isContainerOpen: function(index) { /* return false; */ },
//    isEditable: function(rowIndex, columnID) { return false; },
    isSeparator: function(index) { return false; },
    isSorted: function(index) { /* return false; */ },
//    performAction: function(action) { /* do nothing */ },
//    performActionOnCell: function(action, rowIndex, columnID) { /* do nothing */ },
//    performActionOnRow: function(action, rowIndex) { /* do nothing */ },
//    selectionChanged: function() { /* do nothing */ },
//    setCellText: function(rowIndex, columnID, value) { /* do nothing */ },
    setTree: function(tree) { this.treeBox=tree; },
//    toggleOpenState: function(index) { /* do nothing */ },
    // END nsITreeView interface methods
    
    
    // Observer interface method
    observe: function(subject,topic,data) {
    
        if (topic == 'http-on-modify-request') {
            subject.QueryInterface(Components.interfaces.nsIHttpChannel);
            //subject.setRequestHeader("x-up-calling-line-id", "27824998448", false);
            //subject.setRequestHeader("x-up-calling-line-id", "27829944778", false);
            
			for (var i=0; i < this.rowCount; i++) {
				if (this.rows[i]["enabled"]) {
					subject.setRequestHeader(this.rows[i]["name"], this.rows[i]["value"], false);
				}
			}
        }
    },
    
    start: function() {
        this.initializeHeaders();
        
        // Initialize the form controls
        this.headersTree = document.getElementById("modifyheaders-tree");
        this.actionMenuList = document.getElementById("action-menulist");
        this.nameTextbox = document.getElementById("headername-text-box");
        this.valueTextbox = document.getElementById("headervalue-text-box");
        this.addButton = document.getElementById("add-header-button");
        this.saveButton = document.getElementById("save-header-button");
        
        // Set this view for the treeBoxObject
        this.headersTree.treeBoxObject.view = this;
    },
    
    /*
     * Get the specified preference.  If it doesn't exist, create it and return the default value.
     */
    getPreference: function(type, name) {
        var prefValue;
    
        if (prefService.prefHasUserValue(name)) {
            if (type=='bool') {
                prefValue = prefService.getBoolPref(name);
            } else if (type=='char') {
                prefValue = prefService.getCharPref(name);
            } else if (type=='int') {
                prefValue = prefService.getIntPref(name);
            }
        
        // Set the preference with a default value
        } else {
            if (type=='bool') {
            	this.setPreference(type, name, false);
            	return false;
            } else if (type=='char') {
            	this.setPreference(type, name, "");
            	return "";
            } else if (type=='int') {
            	this.setPreference(type, name, 0);
            	return 0;
            }
        }
        
        return prefValue;
    },
    
    setPreference: function(type, name, value) {
            if (type=='bool') {
                prefService.setBoolPref(name, value);
            } else if (type=='char') {
                prefService.setCharPref(name, value);
            } else if (type=='int') {
                prefService.setIntPref(name, value);
            }
    },
    
    // Persist the rows to the preferences.
    savePreferences: function() {
    
    	// Loop over the rows
    	for (var i=0; i < this.rows.length; i++) {
    		this.setPreference("char", this.prefAction + i, this.rows[i]["action"]);
    		this.setPreference("char", this.prefName + i, this.rows[i]["name"]);
    		this.setPreference("char", this.prefValue + i, this.rows[i]["value"]);
    		this.setPreference("bool", this.prefEnabled + i, this.rows[i]["enabled"]);
    	}
    	
   		this.setPreference("int", this.prefCount, this.rows.length);
    },
    
    // Clear the rows from there preferences
    clearPreferences: function() {
    	// Loop over the rows
    	for (var i=0; i < this.rows.length; i++) {
    	    prefService.clearUserPref(this.prefAction + i);
    	    prefService.clearUserPref(this.prefEnabled + i);
    	    prefService.clearUserPref(this.prefName + i);
    	    prefService.clearUserPref(this.prefValue + i);
    	}
    },
    
    addHeader: function() {
    
    	// Values
    	// TODO Make the enabled default value a preference
	    var enabled = false;
	    var action = document.getElementById("action-menulist").selectedItem.label;
	    var name = document.getElementById("headername-text-box").value;
    	var value = document.getElementById("headervalue-text-box").value;
    	
    	// Add the header information to the Array
		this.addHeaderToStack(enabled, action, name, value);
		
		// Save the preferences
		this.savePreferences();
		
		// Notify the treeBoxObject that a row has been added,
		// Select the row
		this.treeBox.rowCountChanged(this.rowCount-1, 1);
		this.treeSelection.select(this.rowCount-1);
        
        this.clearForm();
    },
    
    addHeaderToStack: function(enabled, action, name, value) {

    	var header = new Array();
    	header["enabled"] = enabled;
    	header["action"] = action;
    	header["name"] = name;
    	header["value"] = value;
    	
    	this.rows.push(header);
    },
    
    deleteHeader: function() {
    
        var deleteIndex = this.treeSelection.currentIndex;

        this.clearPreferences();
        this.rows.splice(deleteIndex, 1);
        this.savePreferences();
        
        // Notify the treeBoxObject that a row has been deleted
        // Select the next row if there is one
        this.treeBox.rowCountChanged(deleteIndex, -1);
        this.treeSelection.select(deleteIndex);
    },
    
    editHeader: function() {
        var selectedRowIndex = this.treeSelection.currentIndex;
        
        if (selectedRowIndex > -1) {
            //this.actionMenuList = this.rows[selectedRowIndex]["action"];
            this.nameTextbox.value = this.rows[selectedRowIndex]["name"];
            this.valueTextbox.value = this.rows[selectedRowIndex]["value"];
            
            this.editedRowID = selectedRowIndex;
            
            // Hide the add button and display the save button
            this.addButton.setAttribute("hidden", "true");
            this.saveButton.setAttribute("hidden", "false");
        }
    },
    
    saveHeader: function() {
    
    	if (this.editedRowID != null) {
	    	//this.rows[this.editedRowID]["action"] = this.actionMenuList.selectedItem.label;
    		this.rows[this.editedRowID]["name"] = this.nameTextbox.value;
    		this.rows[this.editedRowID]["value"] = this.valueTextbox.value;

			// Save the preferences
			this.savePreferences();

			// Notify the treeBoxObject that a row has been edited
			this.treeBox.rowCountChanged(this.editedRowID, 0);

			// Select the row
			this.treeSelection.select(this.editedRowID);

            // Set the editedRow to null
            this.editedRowID = null;

            this.clearForm();
		}
    },
    
    clearForm: function() {
    	this.nameTextbox.value = "";
    	this.valueTextbox.value = "";

        this.saveButton.setAttribute("hidden", "true");
        this.addButton.setAttribute("hidden", "false");

		// Ensure that the selected index is set back to null
        var selectedRowIndex = null;
    },
    
    initializeHeaders: function() {
    	var enabled;
    	var action;
    	var name;
    	var value;
    	
   		// Read preferences into headersArray
   		this.getPreference("int", this.prefCount);
    	
   		var headerCount = this.getPreference("int", this.prefCount);
   		
   		for (var i=0; i < headerCount; i++) {
			enabled = this.getPreference("bool", this.prefEnabled + i);
			action = this.getPreference("char", this.prefAction + i);
			name = this.getPreference("char", this.prefName + i);
			value = this.getPreference("char", this.prefValue + i);
			
			this.addHeaderToStack(enabled, action, name, value);
   		}
    },
    
    enableHeader: function() {
    	// Change the enabled parameter to true
    	var enabled = this.rows[this.treeSelection.currentIndex]["enabled"];
    	
    	this.rows[this.treeSelection.currentIndex]["enabled"] = !enabled;

		// Save the preferences
		this.savePreferences();
    	
		// Notify the treeBoxObject that a row has been edited
		this.treeSelection.select(this.treeSelection.currentIndex);
		this.treeBox.rowCountChanged(this.treeSelection.currentIndex, 0);
    },
    
    
    moveRowDown: function() {
    
    	if (this.treeSelection && this.treeSelection.currentIndex != this.rowCount - 1) {
    		var header = this.rows[this.treeSelection.currentIndex];
    		
    		this.rows[this.treeSelection.currentIndex] = this.rows[this.treeSelection.currentIndex + 1];
    		this.rows[this.treeSelection.currentIndex + 1] = header;

			// Save the preferences
			this.savePreferences();
			
			// Change the selection
			this.treeSelection.select(this.treeSelection.currentIndex + 1);
			this.treeBox.rowCountChanged(this.selection.currentIndex, 0);
    	}
    },
    
    moveRowUp: function() {
    
    	if (this.treeSelection && this.treeSelection.currentIndex != 0) {
    		var selectedIndex = this.treeSelection.currentIndex;
    	
    		var header = this.rows[this.treeSelection.currentIndex];
    		
    		this.rows[this.treeSelection.currentIndex] = this.rows[this.treeSelection.currentIndex - 1];
    		this.rows[this.treeSelection.currentIndex - 1] = header;

			// Save the preferences
			this.savePreferences();
			
			// Change the selection
			this.treeSelection.select(this.treeSelection.currentIndex - 1);
			this.treeBox.rowCountChanged(this.selection.currentIndex - 1, 0);
    	}
    }
};
