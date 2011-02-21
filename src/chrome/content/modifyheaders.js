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
    if (this.modifyheadersService.openAsTab) {
      // Open modifyheaders in a new tab
      // TODO Determine if Modify Headers is already open and shift to its tab if appropriate
      gBrowser.selectedTab = gBrowser.addTab('chrome://modifyheaders/content/preferences-tab.xul');
      //gBrowser.selectedTab.setAttribute("image", "chrome://modifyheaders/skin/favicon.ico");
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

  // Control constants
  headersTree: null,
  actionMenuList: null,
  nameTextbox: null,
  valueTextbox: null,
  commentTextbox: null,
  addButton: null,
  saveButton: null,

  // nsITreeView interface properties
  treeSelection: null, // nsiTreeSelection
  treeBox: null, // The tree
  editedRowID: null, // The row currently being edited
  
  // Getters and Setters
  set rowCount(i) { throw "rowCount is a readonly property"; },
  get rowCount() { return this.modifyheadersService.count; },
  
  set selection(s) { this.treeSelection = s; },
  get selection() { return this.treeSelection; },
  
  // START nsITreeView interface methods
  canDrop: function (index, orientation) {
    return true;
  },
  // cycleCell : function(row, columnID) { /* do nothing */ },
  cycleHeader: function(columnID, element) {
    /* do nothing */
  },
  
  dragDrop: {
    dragStart: function (event) {
      var index = ModifyHeaders.treeSelection.currentIndex;
      if (index > -1) { 
        event.dataTransfer.setData("text/plain", index);
      }
      event.stopPropagation();
    }
  },
  
  drop: function(targetRowID, orientation, dataTransfer) {
    var sourceRowID = dataTransfer.getData("text/plain");
    this.modifyheadersService.moveHeader(sourceRowID, targetRowID, orientation);
    // TODO Handle any errors
  },
  
  // drop: function(row, orientation) { /* do nothing */ return false; },
  getCellProperties: function(row, columnID, properties) { /* do nothing */ },
  getCellText: function(row, column) {
    if (column == "actioncol" || column.id == "actioncol") {
      return this.modifyheadersService.getHeaderAction(row);
    } else if (column == "namecol" || column.id == "namecol") {
      return this.modifyheadersService.getHeaderName(row);
    } else if (column == "valuecol" || column.id == "valuecol") {
      return this.modifyheadersService.getHeaderValue(row);
    } else if (column == "commentcol" || column.id == "commentcol") {
      return this.modifyheadersService.getHeaderComment(row);
    }
    return null;
  },
//  getCellValue: function(row, columnID) { /* return null; */ },
  getColumnProperties: function(columnID, element, properties) { /* do nothing */ },
  getImageSrc: function(rowIndex, column) {
    if (column == "enabledcol" || column.id == "enabledcol") {
      if (this.modifyheadersService.isHeaderEnabled(rowIndex)) {
        return "chrome://modifyheaders/content/enabled.gif";
      } else {
        return "chrome://modifyheaders/content/disabled.gif";
      }
    }
    return null;
  },
  getLevel: function (index) { return 0; },
  getParentIndex: function (rowIndex) { return -1; },
//  getProgressMode: function(rowIndex, columnID) { /* return 0; */ },
  getRowProperties: function(rowIndex, properties) { /* do nothing */ },
//  hasNextSibling: function(rowIndex, afterIndex) { return false; },
  isContainer: function(index) { return false; },
//  isContainerEmpty: function(index) { return false; },
//  isContainerOpen: function(index) { /* return false; */ },
//  isEditable: function(rowIndex, columnID) { return false; },
  isSeparator: function(index) { return false; },
  isSorted: function(index) { /* return false; */ },
//  performAction: function(action) { /* do nothing */ },
//  performActionOnCell: function(action, rowIndex, columnID) { /* do nothing */ },
//  performActionOnRow: function(action, rowIndex) { /* do nothing */ },
//  selectionChanged: function() { /* do nothing */ },
//  setCellText: function(rowIndex, columnID, value) { /* do nothing */ },
  setTree: function(tree) { this.treeBox=tree; },
//  toggleOpenState: function(index) { /* do nothing */ },
  // END nsITreeView interface methods
    
  start: function() {
    // Initialize the form controls
    this.headersTree = document.getElementById("modifyheaders-tree");
    this.actionMenuList = document.getElementById("action-menulist");
    this.nameTextbox = document.getElementById("headername-text-box");
    this.valueTextbox = document.getElementById("headervalue-text-box");
    this.commentTextbox = document.getElementById("headercomment-text-box");
    this.addButton = document.getElementById("add-header-button");
    this.saveButton = document.getElementById("save-header-button");
    
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
    
    // Set this view for the treeBoxObject
    this.headersTree.treeBoxObject.view = this;
    this.initialized = true;
  },
  
  toggleWindow: function () {
  document.getElementById("modifyheaders-window").lastSelected = "paneHeaders";
    this.modifyheadersService.windowOpen = !this.modifyheadersService.windowOpen;
  },
  
  refresh: function(index, count) {
    this.treeBox.rowCountChanged(index, count);
    this.treeSelection.select(this.rowCount-1);
  },
  
  addHeader: function() {
    // Values
    // TODO Make the enabled default value a preference, true for now
    var enabled = true;
    var action = document.getElementById("action-menulist").selectedItem.label;
    var name = document.getElementById("headername-text-box").value;
    var value = document.getElementById("headervalue-text-box").value;
    var comment = document.getElementById("headercomment-text-box").value;
    
    this.modifyheadersService.addHeader(name, value, action, comment, enabled);
    
    // Notify the treeBoxObject that a row has been added,
    // Select the row
    this.treeBox.rowCountChanged(this.rowCount-1, 1);
    this.treeSelection.select(this.rowCount-1);
    
    this.clearForm();
  },
  
  // Delete the header from the list
  deleteHeader: function() {
    var deleteIndex = this.treeSelection.currentIndex;
    
    this.modifyheadersService.removeHeader(deleteIndex);
    
    // Notify the treeBoxObject that a row has been deleted
    // Select the next row if there is one
    this.treeBox.rowCountChanged(deleteIndex, -1);
    this.treeSelection.select(deleteIndex);
  },
    
  editHeader: function() {
    var selectedRowIndex = this.treeSelection.currentIndex
    
    // Set the form values to the value of the selected item
    if (selectedRowIndex > -1) {
      this.actionMenuList.value = this.modifyheadersService.getHeaderAction(selectedRowIndex);
      this.nameTextbox.value = this.modifyheadersService.getHeaderName(selectedRowIndex);
      if (this.modifyheadersService.getHeaderValue(selectedRowIndex) != "") {
        this.valueTextbox.value = this.modifyheadersService.getHeaderValue(selectedRowIndex);
      }
      if (this.modifyheadersService.getHeaderComment(selectedRowIndex) != "") {
        this.commentTextbox.value = this.modifyheadersService.getHeaderComment(selectedRowIndex);
      }
      
      this.editedRowID = selectedRowIndex;
      
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
  
    if (this.editedRowID != null) {
      var index = this.editedRowID;
      var name = this.nameTextbox.value;
      var value = this.valueTextbox.value;
      var comment = this.commentTextbox.value;
      var action = this.actionMenuList.selectedItem.label;
      var enabled = this.modifyheadersService.isHeaderEnabled(index);
      
      this.modifyheadersService.setHeader(index, name, value, action, comment, enabled);
      
      // Notify the treeBoxObject that a row has been edited
      this.treeBox.invalidateRow(this.editedRowID);
      
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
    this.commentTextbox.value = "";
    
    this.nameTextbox.disabled = true;
    this.valueTextbox.disabled = true;
    this.commentTextbox.disabled = true;
    
    this.addButton.setAttribute("hidden", "false");
    this.saveButton.setAttribute("hidden", "true");
    this.addButton.disabled = true;
    this.saveButton.disabled = true;
    
    // Ensure that the selected index is set back to null
    var selectedRowIndex = null;
  },
  
  enableHeader: function() {
    // Change the enabled parameter to true
    var enabled = this.modifyheadersService.isHeaderEnabled(this.treeSelection.currentIndex);
    
    this.modifyheadersService.setHeaderEnabled(this.treeSelection.currentIndex, !enabled);
      
    // Notify the treeBoxObject that a row has been edited
    this.treeBox.invalidateRow(this.treeSelection.currentIndex);
  },
  
  enableAllHeaders: function() {
    var tempSelectedIndex = this.treeSelection.currentIndex;
    
    for (var i=0; i < this.modifyheadersService.count; i++) {
      this.modifyheadersService.setHeaderEnabled(i, true);
      
      // Notify the treeBoxObject that a row has been edited
      this.treeSelection.select(i);
      this.treeBox.rowCountChanged(i, 0);
    }
    
    // Revert to the previous selectedIndex
    this.treeSelection.select(tempSelectedIndex);
  },
  
  disableAllHeaders: function() {
    var tempSelectedIndex = this.treeSelection.currentIndex;
    
    for (var i=0; i < this.modifyheadersService.count; i++) {
      this.modifyheadersService.setHeaderEnabled(i, false);
      
      // Notify the treeBoxObject that a row has been edited
      this.treeSelection.select(i);
      this.treeBox.rowCountChanged(i, 0);
    }
    
    // Revert to the previous selectedIndex
    this.treeSelection.select(tempSelectedIndex);
  },
  
  // TODO Remove moveRowDown once drag/drop is implemented
  moveRowDown: function() {
    if (this.treeSelection && this.treeSelection.currentIndex != this.rowCount - 1) {
      var selectedIndex = this.treeSelection.currentIndex;
      this.modifyheadersService.switchHeaders(selectedIndex, selectedIndex + 1);
      
      // Change the selection
      this.treeSelection.select(this.treeSelection.currentIndex + 1);
      this.treeBox.rowCountChanged(this.selection.currentIndex, 0);
    }
  },
  
  // TODO Remove moveRowUp once drag/drop is implemented
  moveRowUp: function() {
    if (this.treeSelection && this.treeSelection.currentIndex != 0) {
    
      var selectedIndex = this.treeSelection.currentIndex;
      this.modifyheadersService.switchHeaders(selectedIndex, selectedIndex - 1);
      this.treeSelection.select(this.treeSelection.currentIndex - 1);
      this.treeBox.rowCountChanged(this.selection.currentIndex-1, 0);
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
  
  openHelp: function() {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]. getService(Components.interfaces.nsIWindowMediator);
    var mrw = wm.getMostRecentWindow("navigator:browser");
    mrw.gBrowser.selectedTab = mrw.gBrowser.addTab(document.getElementById("modifyheadersStringResources").getString("modifyheaders.url.help"));
  }
};
