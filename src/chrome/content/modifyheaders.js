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

var ModifyHeaders = {
  open: function () {
    // TODO Determine if Modify Headers is already open and shift to its tab/window if appropriate
    if (this.modifyheadersService.openAsTab) {
      // Open modifyheaders in a new tab
      gBrowser.selectedTab = gBrowser.addTab('chrome://modifyheaders/content/preferences-tab.xul');
    } else if (!this.modifyheadersService.windowOpen) {
      // Open Modify Headers in a resizable dialog
      this.mhWindow = window.openDialog("chrome://modifyheaders/content/preferences.xul", "modifyheaders", "chrome,all,dialog=no");
    } else {
      // The window is open, so shift focus to it
      this.mhWindow.focus();
    }
  },
    
  modifyheadersService: Components.classes["@modifyheaders.mozdev.org/service;1"].getService(Components.interfaces.nsIModifyheaders),
  initialized: false,
  mhWindow: null,
  
  preferences: null,
  
  // Control constants
  headersTree: null,
  actionMenuList: null,
  nameTextbox: null,
  valueTextbox: null,
  commentTextbox: null,
  addButton: null,
  saveButton: null,
  
  // nsITreeView
  headerListTreeView: {
    data: null,        // Tree data
    treeBox: null,     // The tree
    editedRowID: null, // The row currently being edited
    selection: null,   // nsITreeSelection
    
    // Getters and Setters
    set rowCount(i) { throw "rowCount is a readonly property"; },
    get rowCount() { return this.data.length; },
    
    // START nsITreeView interface methods
    canDrop: function (index, orientation) {
      return true;
    },
    // cycleCell : function(row, columnID) { /* do nothing */ },
    cycleHeader: function(columnID, element) {
      /* do nothing */
    },
    
    dragStart: function (event) {
      // Ensure the scollbar or other tree elements are not selected
      if (!(event.target.id == "modifyheaders-tree")) {
          var index = ModifyHeaders.headerListTreeView.selection.currentIndex;
          if (index > -1) { 
            event.dataTransfer.setData("text/plain", index);
          }
      }
      event.stopPropagation();
    },
    
    drop: function(targetRowID, orientation, dataTransfer) {
      var sourceRowID = dataTransfer.getData("text/plain");
      ModifyHeaders.moveRow(sourceRowID, targetRowID, orientation);
    },
    
    getCellProperties: function(row, columnID, properties) { /* do nothing */ },
    getCellText: function(row, column) {
      if (column == "actioncol" || column.id == "actioncol") {
    	return this.data[row].action;
      } else if (column == "namecol" || column.id == "namecol") {
    	return this.data[row].name;
      } else if (column == "valuecol" || column.id == "valuecol") {
    	return this.data[row].value;
      } else if (column == "commentcol" || column.id == "commentcol") {
    	return this.data[row].comment;
      }
      return null;
    },
  //  getCellValue: function(row, columnID) { /* return null; */ },
    getColumnProperties: function(columnID, element, properties) { /* do nothing */ },
    getImageSrc: function(rowIndex, column) {
      if (column == "enabledcol" || column.id == "enabledcol") {
        if (this.data[rowIndex].enabled) {
          return "chrome://modifyheaders/content/enabled.gif";
        } else {
          return "chrome://modifyheaders/content/disabled.gif";
        }
      }
      return null;
    },
    getLevel: function (index) { return 0; },
    getParentIndex: function (rowIndex) { return -1; },
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
    setTree: function(tree) { this.treeBox=tree; }//,
//    toggleOpenState: function(index) { /* do nothing */ },
  },  // End headerListTreeView
  
  activate: function () {
    this.modifyheadersService.active = !this.modifyheadersService.active;
  },
  
  toggleStartButton: function () {
    var startButton = document.getElementById("modifyheaders-start-button");
    
    if (this.modifyheadersService.active) {
      startButton.setAttribute("label", document.getElementById("modifyheadersStringResources").getString("modifyheaders.button.stop"));
      startButton.className = "started";
    } else {
      startButton.setAttribute("label", document.getElementById("modifyheadersStringResources").getString("modifyheaders.button.start"));
      startButton.className = "";
    }
  },
  
  toggleToolbarButton: function () {
    var startToolbarButton = document.getElementById("modifyheaders-toolbar-button-start");
    var stopToolbarButton = document.getElementById("modifyheaders-toolbar-button-stop");
    var addonToolbarButton = document.getElementById("modifyheaders-addonbar-button");
    
    if (this.modifyheadersService.active) {
        startToolbarButton.hidden = true;
        stopToolbarButton.hidden = false;
        addonToolbarButton.image = "chrome://modifyheaders/content/icons/ModifyHeaders-16.png";
    } else {
        startToolbarButton.hidden = false;
        stopToolbarButton.hidden = true;
        addonToolbarButton.image = "chrome://modifyheaders/content/icons/ModifyHeaders-grey-16.png";
    }
  },
    
  start: function() {
    // Initialize the form controls
    this.headersTree = document.getElementById("modifyheaders-tree");
    this.actionMenuList = document.getElementById("action-menulist");
    this.nameTextbox = document.getElementById("headername-text-box");
    this.valueTextbox = document.getElementById("headervalue-text-box");
    this.commentTextbox = document.getElementById("headercomment-text-box");
    this.addButton = document.getElementById("add-header-button");
    this.saveButton = document.getElementById("save-header-button");
    
    // Add the start/stop radio button to the toolbar radiogroup
    // TODO Use an overlay or XBL
    var startStopRadio = document.createElement("radio");
    startStopRadio.setAttribute("id", "modifyheaders-start-button");
    startStopRadio.setAttribute("oncommand", "ModifyHeaders.activate(); return false;");
    document.documentElement._selector.insertBefore(startStopRadio, document.documentElement._selector.firstChild);
    this.toggleStartButton();
    
    // Listen for when the 'active' preference changes
    this.activateListener = new ModifyHeaders.ActivateListener(function (branch, data) {
      if (data = "config.active") {
        ModifyHeaders.toggleStartButton();
      }
    });
    this.activateListener.register();
    
    // Add help radio button to toolbar radiogroup
    // TODO Use an overlay or XBL
    var helpRadio = document.createElement("radio");
    helpRadio.setAttribute("id", "modifyheaders-help-button");
    helpRadio.setAttribute("label", document.getElementById("modifyheadersStringResources").getString("modifyheaders.button.help"));
    helpRadio.setAttribute("oncommand", "ModifyHeaders.openHelp(); return false;");
    
    var helpSeparator = document.createElement("separator");
    helpSeparator.setAttribute("class", "thin");
    helpSeparator.setAttribute("orient", "vertical");
    
    document.documentElement._selector.appendChild(helpSeparator);
    document.documentElement._selector.appendChild(helpRadio);
    
    // Set the data for the treeView
    this.headerListTreeView.data = JSON.parse(this.modifyheadersService.getHeaders());
    
    // Set this view for the treeBoxObject
    this.headersTree.treeBoxObject.view = this.headerListTreeView;
    
    // Configure the preferences service
    this.preferences = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("modifyheaders.");
    this.preferences.QueryInterface(Components.interfaces.nsIPrefBranch2);
    
    // Prepare the Header Names Autocomplete
    this.prepareHeaderNamesList();
    
    this.initialized = true;
  },
  
  stop: function () {
	  this.activateListener.unregister();
  },
  
  toggleWindow: function () {
    document.getElementById("modifyheaders-window").lastSelected = "paneHeaders";
    this.modifyheadersService.windowOpen = !this.modifyheadersService.windowOpen;
  },
  
  refresh: function(index, count) {
    this.headerListTreeView.treeBox.rowCountChanged(index, count);
    this.headerListTreeView.selection.select(this.rowCount-1);
  },
  
  addHeader: function() {
    // TODO Make the enabled default value a preference, true for now
    var header = {
      "action" : document.getElementById("action-menulist").selectedItem.label,
      "name"   : document.getElementById("headername-text-box").value,
      "value"  : document.getElementById("headervalue-text-box").value,
      "comment": document.getElementById("headercomment-text-box").value,
      "enabled": true
    }
    this.headerListTreeView.data.push(header);
    
    // Notify the treeBoxObject that a row has been added,
    // Select the row
    this.headerListTreeView.treeBox.rowCountChanged(this.headerListTreeView.rowCount-1, 1);
    this.headerListTreeView.selection.select(this.headerListTreeView.rowCount-1);
    
    this.clearForm();
    this.storeHeaders();
  },
  
  // Delete the header from the list
  deleteHeader: function() {
    var deleteIndex = this.headerListTreeView.selection.currentIndex;
    
    this.headerListTreeView.data.splice(deleteIndex, 1);
    
    // Notify the treeBoxObject that a row has been deleted
    // Select the next row if there is one
    this.headerListTreeView.treeBox.rowCountChanged(deleteIndex, -1);
    this.headerListTreeView.selection.select(deleteIndex);
    
    this.storeHeaders();
  },
    
  editHeader: function() {
    var selectedRowIndex = this.headerListTreeView.selection.currentIndex
    
    // Set the form values to the value of the selected item
    if (selectedRowIndex > -1) {
      this.actionMenuList.value = this.headerListTreeView.data[selectedRowIndex].action;
      this.nameTextbox.value = this.headerListTreeView.data[selectedRowIndex].name;
      
      if (this.headerListTreeView.data[selectedRowIndex].value != "") {
        this.valueTextbox.value = this.headerListTreeView.data[selectedRowIndex].value;
      }
      if (this.headerListTreeView.data[selectedRowIndex].comment != "") {
        this.commentTextbox.value = this.headerListTreeView.data[selectedRowIndex].comment;
      }
      
      this.headerListTreeView.editedRowID = selectedRowIndex;
      
      // Hide the add button and display the save button
      this.addButton.setAttribute("hidden", "true");
      this.saveButton.setAttribute("hidden", "false");
      
      this.nameTextbox.disabled = false;
      if (this.valueTextbox.value.length > 0) {
        this.valueTextbox.disabled = false;
      }
      this.commentTextbox.disabled = false;
      this.addButton.disabled = false;
      this.saveButton.disabled = false;
    }
  },
  
  saveHeader: function() {
    if (this.headerListTreeView.editedRowID != null) {
    	
      var header = {
        "action" : this.actionMenuList.selectedItem.label,
        "name"   : this.nameTextbox.value,
        "value"  : this.valueTextbox.value,
        "comment": this.commentTextbox.value,
        "enabled": this.headerListTreeView.data[this.headerListTreeView.editedRowID].enabled
      }
      this.headerListTreeView.data[this.headerListTreeView.editedRowID] = header;
      
      // Notify the treeBoxObject that a row has been edited
      this.headerListTreeView.treeBox.invalidateRow(this.headerListTreeView.editedRowID);
      
      // Select the row
      this.headerListTreeView.selection.select(this.headerListTreeView.editedRowID);
      
      // Set the editedRow to null
      this.headerListTreeView.editedRowID = null;
      
      this.clearForm();
      this.storeHeaders();
    }
  },
  
  storeHeaders: function () {
	var data = JSON.stringify(this.headerListTreeView.data);
	this.modifyheadersService.saveHeaders(data);
	this.prepareHeaderNamesList();
  },
  
  clearForm: function() {
    this.actionMenuList.value = "";
    this.nameTextbox.value = "";
    this.valueTextbox.value = "";
    this.commentTextbox.value = "";
    
    this.nameTextbox.disabled = true;
    this.valueTextbox.disabled = true;
    this.commentTextbox.disabled = true;
    
    this.addButton.setAttribute("hidden", "false");
    this.saveButton.setAttribute("hidden", "true");
    this.addButton.disabled = true;
    this.saveButton.disabled = true;
  },
  
  enableHeader: function() {
    // Change the enabled parameter to true
    var enabled = this.headerListTreeView.data[this.headerListTreeView.selection.currentIndex].enabled;
    this.headerListTreeView.data[this.headerListTreeView.selection.currentIndex].enabled = !enabled;
      
    // Notify the treeBoxObject that a row has been edited
    this.headerListTreeView.treeBox.invalidateRow(this.headerListTreeView.selection.currentIndex);
    this.storeHeaders();
  },
  
  // TODO Combine enableAllHeaders and disableAllHeaders into a single method
  enableAllHeaders: function() {
    var selectedIndex = this.headerListTreeView.selection.currentIndex;
    
    for (var i=0; i < this.headerListTreeView.rowCount; i++) {
      this.headerListTreeView.data[i].enabled = true;
      
      // Notify the treeBoxObject that a row has been edited
      this.headerListTreeView.selection.select(i);
      this.headerListTreeView.treeBox.rowCountChanged(i, 0);
    }
    
    // Revert to the previous selectedIndex
    this.headerListTreeView.selection.select(selectedIndex);
    this.storeHeaders();
  },
  
  disableAllHeaders: function() {
    var tempSelectedIndex = this.headerListTreeView.selection.currentIndex;
    
    for (var i=0; i < this.headerListTreeView.rowCount; i++) {
      this.headerListTreeView.data[i].enabled = false;
      
      // Notify the treeBoxObject that a row has been edited
      this.headerListTreeView.selection.select(i);
      this.headerListTreeView.treeBox.rowCountChanged(i, 0);
    }
    
    // Revert to the previous selectedIndex
    this.headerListTreeView.selection.select(tempSelectedIndex);
    this.storeHeaders();
  },
  
  // Orientation is for drag/drop functionality.
  // Other Move commands can fake it using:
  // * Components.interfaces.nsITreeView.DROP_AFTER
  // * Components.interfaces.nsITreeView.DROP_BEFORE
  moveRow: function (sourceRowID, targetRowID, orientation) {    
    var sourceHeader;
    var sourceHeaderRemoved = false;
    
    if (sourceRowID > targetRowID) {
      var removedHeaders = this.headerListTreeView.data.splice(sourceRowID, 1);
      sourceHeader = removedHeaders[0];
      sourceHeaderRemoved = true;
    } else {
      sourceHeader = this.headerListTreeView.data[sourceRowID];
    }
    
    if (orientation == Components.interfaces.nsITreeView.DROP_BEFORE) {
      this.headerListTreeView.data.splice(targetRowID, 0, sourceHeader);
    } else if (orientation == Components.interfaces.nsITreeView.DROP_AFTER) {
      this.headerListTreeView.data.splice((targetRowID+1), 0, sourceHeader);
    } else if (orientation == Components.interfaces.nsITreeView.DROP_ON) {
      Components.utils.reportError("nsITreeView.DROP_ON not supported.");
      // TODO Throw an error ? 
    } else {
      Components.utils.reportError("Incorrect orientation after drop: " + orientation);
      // TODO Throw an error ? 
    }
  	
    if (!sourceHeaderRemoved) {
      this.headerListTreeView.data.splice(sourceRowID, 1);
    }
    
    // Change the selection
    this.headerListTreeView.selection.select(targetRowID);
    this.headerListTreeView.treeBox.invalidate();// Redraw all rows in their new order
    
    // Store the new header arrangement
    this.storeHeaders();
  },
  
  moveRowBottom: function () {
	  if (this.headerListTreeView.selection && this.headerListTreeView.selection.currentIndex != this.headerListTreeView.rowCount - 1) {
        var sourceRowID = this.headerListTreeView.selection.currentIndex;
        var targetRowID = (this.headerListTreeView.rowCount-1);
        this.moveRow(sourceRowID, targetRowID, Components.interfaces.nsITreeView.DROP_AFTER);
	  }
  },
  
  moveRowTop: function () {
    if (this.headerListTreeView.selection && this.headerListTreeView.selection.currentIndex != 0) {
      var sourceRowID = this.headerListTreeView.selection.currentIndex;
      var targetRowID = 0;
      this.moveRow(sourceRowID, targetRowID, Components.interfaces.nsITreeView.DROP_BEFORE);
    }
  },
    
  actionSelected: function() {
    switch(this.actionMenuList.selectedItem.value) {
      case "Add":
      case "Modify":
        this.nameTextbox.disabled = false;
        this.valueTextbox.disabled = false;
        this.commentTextbox.disabled = false;
        this.addButton.disabled = false;
        this.saveButton.disabled = false;
        break
      case "Filter":
        this.nameTextbox.disabled = false;
        this.valueTextbox.value = "";
        this.valueTextbox.disabled = true;
        this.commentTextbox.disabled = false;
        this.addButton.disabled = false;
        this.saveButton.disabled = false;
        break
      default:
        this.clearForm();
    }
  },
  
  prepareHeaderNamesList: function () {
	var headerNames = JSON.parse(this.preferences.getCharPref("autocomplete.name.defaults"));
	
	this.headerListTreeView.data.forEach(function (element, index, array) {
      var name = element.name;
	  if (headerNames.indexOf(name) == -1 && headerNames.indexOf(name.toLowerCase()) == -1) {
		headerNames.push(name);
	  }
	});
	
	// Sort the headers names into alphabetical order
	headerNames.sort();
	
	var headerNamesList = headerNames.map(function (value) {
		return {"value": value};
	});
	
	this.nameTextbox.searchParam = JSON.stringify(headerNamesList);
  },
  
  openHelp: function() {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]. getService(Components.interfaces.nsIWindowMediator);
    var mrw = wm.getMostRecentWindow("navigator:browser");
    mrw.gBrowser.selectedTab = mrw.gBrowser.addTab(document.getElementById("modifyheadersStringResources").getString("modifyheaders.url.help"));
  }
};
