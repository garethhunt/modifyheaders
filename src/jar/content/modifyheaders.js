// Constants for use within the ModifyHeaders class
const modifyheadersService = Components.classes["@modifyheaders.mozdev.org/service;1"].getService(Components.interfaces.nsIModifyheaders);

var oModifyHeaders;

// This stops startModifyHeaders() from being run twice.
// TODO Place this as a property of the oModifyHeaders class
var initialized = false;

// Opens the modifyheaders interface in a new tab/window
function openModifyHeaders() {

    if (modifyheadersService.openAsTab) {
        // Open modifyheaders in a new tab
        gBrowser.selectedTab = gBrowser.addTab('chrome://modifyheaders/content/modifyheaders.xul');
        setTimeout("gURLBar.focus();", 0);
        //gBrowser.selectedTab.setAttribute("image", "chrome://modifyheaders/skin/favicon.ico");
        //var title = document.getElementById("modifyheaders.title").label
        //gBrowser.selectedTab.setAttribute("label", title);
    } else {
        // Open Modify Headers in a global window
        window.open("chrome://modifyheaders/content/modifyheaders.xul", "modifyheaders", "chrome,centerscreen,resizable,scrollbars");
    }
}

function startModifyHeaders() {
	if (!initialized) {
		oModifyHeaders = new ModifyHeaders();
		oModifyHeaders.start();
		initialized = true;
		modifyheadersService.windowOpen = true;
	}
}

function stopModifyHeaders() {
    oModifyHeaders = null;
	modifyheadersService.windowOpen = false;
}

function refreshHeaderTree(index, count) {
    oModifyHeaders.refresh(index, count)
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

    // nsITreeView interface properties
    treeSelection: null, // nsiTreeSelection
    treeBox: null, // The tree
    editedRowID: null, // The row currently being edited
    
    // Getters and Setters
    set rowCount(i) { throw "rowCount is a readonly property"; },
    //get rowCount() { return this.rows.length; },
    get rowCount() { return modifyheadersService.count; },
    
    set selection(s) { this.treeSelection = s; },
    get selection() { return this.treeSelection; },
    
    // START nsITreeView interface methods
//    canDropBeforeAfter: function(index, before) { return false; },
//    canDropOn : function(index) { return false; },
//    cycleCell : function(row, columnID) { /* do nothing */ },
    cycleHeader: function(columnID, element) {
        /* do nothing */
        alert("Cycling: " + columnID);
    },
//    drop: function(row, orientation) { /* do nothing */ return false; },
    getCellProperties: function(row, columnID, properties) { /* do nothing */ },
    getCellText: function(row, column) {
        if (column == "actioncol" || column.id == "actioncol") {
            return modifyheadersService.getHeaderAction(row);
        } else if (column == "namecol" || column.id == "namecol") {
            return modifyheadersService.getHeaderName(row);
        } else if (column == "valuecol" || column.id == "valuecol") {
            return modifyheadersService.getHeaderValue(row);
        }
        
        return null;
	},
//    getCellValue: function(row, columnID) { /* return null; */ },
    getColumnProperties: function(columnID, element, properties) { /* do nothing */ },
    getImageSrc: function(rowIndex, column) {
    	if (column == "enabledcol" || column.id == "enabledcol") {
    		if (modifyheadersService.isHeaderEnabled(rowIndex)) {
    			return "chrome://modifyheaders/content/enabled.gif";
    		} else {
    			return "chrome://modifyheaders/content/disabled.gif";
    		}
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
    
    start: function() {
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
    
    refresh: function(index, count) {
        this.treeBox.rowCountChanged(index, count)
        this.treeSelection.select(this.rowCount-1)
    },
    
    addHeader: function() {
    
    	// Values
    	// TODO Make the enabled default value a preference, true for now
	    var enabled = true;
	    var action = document.getElementById("action-menulist").selectedItem.label;
	    var name = document.getElementById("headername-text-box").value;
    	var value = document.getElementById("headervalue-text-box").value;
    	
    	modifyheadersService.addHeader(name, value, action, enabled);
    	
		// Notify the treeBoxObject that a row has been added,
		// Select the row
		this.treeBox.rowCountChanged(this.rowCount-1, 1);
		this.treeSelection.select(this.rowCount-1);
        
        this.clearForm();
    },
    
    // Delete the header from the list
    deleteHeader: function(mesg) {
    	if (confirm(mesg)) {
    
	        var deleteIndex = this.treeSelection.currentIndex;
	        
	        modifyheadersService.removeHeader(deleteIndex);

	        // Notify the treeBoxObject that a row has been deleted
	        // Select the next row if there is one
	        this.treeBox.rowCountChanged(deleteIndex, -1);
	        this.treeSelection.select(deleteIndex);
        }
    },
    
    editHeader: function() {
        var selectedRowIndex = this.treeSelection.currentIndex;
        
        // Set the form values to the value of the selected item
        if (selectedRowIndex > -1) {
            this.actionMenuList.value = modifyheadersService.getHeaderAction(selectedRowIndex);
            this.nameTextbox.value = modifyheadersService.getHeaderName(selectedRowIndex);
            this.valueTextbox.value = modifyheadersService.getHeaderValue(selectedRowIndex);
            
            this.editedRowID = selectedRowIndex;
            
            // Hide the add button and display the save button
            this.addButton.setAttribute("hidden", "true");
            this.saveButton.setAttribute("hidden", "false");
        }
    },
    
    saveHeader: function() {
    
    	if (this.editedRowID != null) {
    	    
    	    var index = this.editedRowID;
    	    var name = this.nameTextbox.value;
    	    var value = this.valueTextbox.value;
    	    var action = this.actionMenuList.selectedItem.label;
    	    var enabled = modifyheadersService.isHeaderEnabled(index);
    	    
    	    modifyheadersService.setHeader(index, name, value, action, enabled);
    	
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
    	this.actionMenuList.value = "";
    	this.nameTextbox.value = "";
    	this.valueTextbox.value = "";

        this.saveButton.setAttribute("hidden", "true");
        this.addButton.setAttribute("hidden", "false");

		// Ensure that the selected index is set back to null
        var selectedRowIndex = null;
    },
    
    enableHeader: function() {
    	// Change the enabled parameter to true
    	var enabled = modifyheadersService.isHeaderEnabled(this.treeSelection.currentIndex);
    	
    	modifyheadersService.setHeaderEnabled(this.treeSelection.currentIndex, !enabled);
    	
		// Notify the treeBoxObject that a row has been edited
		this.treeSelection.select(this.treeSelection.currentIndex);
		this.treeBox.rowCountChanged(this.treeSelection.currentIndex, 0);
    },
    
    enableAllHeaders: function() {
    	var tempSelectedIndex = this.treeSelection.currentIndex;
    
    	for (var i=0; i < modifyheadersService.count; i++) {
            modifyheadersService.setHeaderEnabled(i, true);
            
            // Notify the treeBoxObject that a row has been edited
            this.treeSelection.select(i);
            this.treeBox.rowCountChanged(i, 0);
        }
        
        // Revert to the previous selectedIndex
        this.treeSelection.select(tempSelectedIndex);
    },
    
    disableAllHeaders: function() {
        var tempSelectedIndex = this.treeSelection.currentIndex;
        
        for (var i=0; i < modifyheadersService.count; i++) {
            modifyheadersService.setHeaderEnabled(i, false);
            
            // Notify the treeBoxObject that a row has been edited
            this.treeSelection.select(i);
            this.treeBox.rowCountChanged(i, 0);
        }
        
        // Revert to the previous selectedIndex
        this.treeSelection.select(tempSelectedIndex);
    },
    
    moveRowDown: function() {
    	if (this.treeSelection && this.treeSelection.currentIndex != this.rowCount - 1) {
            var selectedIndex = this.treeSelection.currentIndex;
            
    	    modifyheadersService.switchHeaders(selectedIndex, selectedIndex + 1);
			
			// Change the selection
			this.treeSelection.select(this.treeSelection.currentIndex + 1);
			this.treeBox.rowCountChanged(this.selection.currentIndex, 0);
    	}
    },
    
    moveRowUp: function() {
    	if (this.treeSelection && this.treeSelection.currentIndex != 0) {
        
            var selectedIndex = this.treeSelection.currentIndex;
            
    	    modifyheadersService.switchHeaders(selectedIndex, selectedIndex - 1);
            
			this.treeSelection.select(this.treeSelection.currentIndex - 1);
			this.treeBox.rowCountChanged(this.selection.currentIndex-1, 0);
    	}
    }
};
