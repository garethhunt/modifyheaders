/**
 * @author gareth
 */

ModifyHeaders.ExportImport.ExportWizard = (function () {
	return {
		initiated: false,
		selectedRows: [],
		
		init: function () {
			if (!this.initiated) {
				ModifyHeaders.ExportImport.init(this);
				ModifyHeaders.ExportImport.wizard = document.getElementById("modifyheaders-export-wizard");
				ModifyHeaders.ExportImport.wizard.canAdvance = false;
				document.getElementById("select-headers-tree").view = ModifyHeaders.ExportImport.ExportWizard.selectHeadersTreeView;
				this.initiated = true;
			}
		},
			
		openFileBrowser: function () {
	        var fpicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
	        fpicker.defaultString = "modifyheaders.json";
		    fpicker.appendFilter("Modify Headers Configuration", "modifyheaders.conf");
		    
		    var mode = fpicker.modeSave;
	        var fpHeadStr = "Select location to save Modify Headers configuration";
		    
	        fpicker.init(window, fpHeadStr, mode);
		    
	        var showResult = fpicker.show();
	        if (showResult == fpicker.returnOK || showResult == fpicker.returnReplace) {
	        	ModifyHeaders.ExportImport.theFile = fpicker.file;
		        document.getElementById("file-path").value = ModifyHeaders.ExportImport.theFile.path;
		        ModifyHeaders.ExportImport.wizard.canAdvance = true;
	        }
		},

		showSelectHeaders: function () {
			ModifyHeaders.ExportImport.ExportWizard.headersSelected();
		},
		
		showConfirm: function () {
			// TODO Modify the view to include the selected file path and list of selected headers
			var count = 0;
			for (var i = 0; i < ModifyHeaders.ExportImport.modifyheadersService.count; i++) {
				if (ModifyHeaders.ExportImport.ExportWizard.selectedRows[i]) {
					count++;
				}
			}
			var confirmHeaderCount = document.getElementById("confirm-header-count");
			var confirmFilePath = document.getElementById("confirm-file-path");
				
			while (confirmHeaderCount.firstChild) {
				confirmHeaderCount.removeChild(confirmHeaderCount.firstChild);
			}
			while (confirmFilePath.firstChild) {
				confirmFilePath.removeChild(confirmFilePath.firstChild);
			}
			confirmHeaderCount.appendChild(document.createTextNode(count));
			confirmFilePath.appendChild(document.createTextNode(ModifyHeaders.ExportImport.theFile.path));
		},
		
		selectAllHeaders: function (checkBox) {
			for (var i = 0; i < ModifyHeaders.ExportImport.modifyheadersService.count; i++) {
				ModifyHeaders.ExportImport.ExportWizard.selectedRows[i] = !checkBox.checked;
			}
			ModifyHeaders.ExportImport.wizard.canAdvance = !checkBox.checked;
		},
		
		headersSelected: function () {
			var trueCount = 0;
			
			for (var i = 0; i < ModifyHeaders.ExportImport.modifyheadersService.count; i++) {
				if (ModifyHeaders.ExportImport.ExportWizard.selectedRows[i]) {
					trueCount++;
				}
			}
			ModifyHeaders.ExportImport.wizard.canAdvance = (trueCount > 0) ? true : false;
			document.getElementById("select-all-headers").checked = (trueCount == ModifyHeaders.ExportImport.modifyheadersService.count) ? true : false;
		},
		
		saveConfiguration: function () {
			var exportHeaders = [],
				exportHeadersJson = "";
			
			for (var i = 0; i < ModifyHeaders.ExportImport.ExportWizard.selectHeadersTreeView.rowCount; i++) {
				// If selected, get the header from the service
				if (ModifyHeaders.ExportImport.ExportWizard.selectedRows[i]) {
					var header =  {
						action:  ModifyHeaders.ExportImport.modifyheadersService.getHeaderAction(i),
						name:    ModifyHeaders.ExportImport.modifyheadersService.getHeaderName(i),
						value:   ModifyHeaders.ExportImport.modifyheadersService.getHeaderValue(i),
						comment: ModifyHeaders.ExportImport.modifyheadersService.getHeaderComment(i)
					};
					exportHeaders.push(header);
				}
			}
			exportHeadersJson = ModifyHeaders.ExportImport.JSON.stringify(exportHeaders);
			
			// Save the JS object to the specified file
			try {
	            var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
	                createInstance(Components.interfaces.nsIFileOutputStream);
	            var flags = 0x02 | 0x08 | 0x20; // wronly | create | truncate
	            foStream.init(ModifyHeaders.ExportImport.theFile, flags, 0664, 0);
	            foStream.write(exportHeadersJson, exportHeadersJson.length);
	            foStream.close();
	        } catch (e) {
	            Components.utils.reportError(e);
	        }
		},
		
		selectHeadersTreeView: {
	        selection: null,
	        get rowCount() {
	        	return ModifyHeaders.ExportImport.modifyheadersService.count;
	        },
	        getCellText: function(row,column) {
	        	if (column == "col-select" || column.id == "col-select") {
	        		return "";
	        	} else if (column == "col-action" || column.id == "col-action") {
	                return ModifyHeaders.ExportImport.modifyheadersService.getHeaderAction(row);
	            } else if (column == "col-header-name" || column.id == "col-header-name") {
	                return ModifyHeaders.ExportImport.modifyheadersService.getHeaderName(row);
	            } else if (column == "col-header-value" || column.id == "col-header-value") {
	                return ModifyHeaders.ExportImport.modifyheadersService.getHeaderValue(row);
	            } else if (column == "col-comment" || column.id == "col-comment") {
	                return ModifyHeaders.ExportImport.modifyheadersService.getHeaderComment(row);
	            }
	            return null;
	        },
	        getCellValue: function (row,column) {
	        	if (column == "col-select" || column.id == "col-select") {
	        		return ModifyHeaders.ExportImport.ExportWizard.selectedRows[row];
	        	}
	        	return null;
	        },
	        setCellValue: function (row, column, value) {
	        	if (column == "col-select" || column.id == "col-select") {
	        		ModifyHeaders.ExportImport.ExportWizard.selectedRows[row] = (value == "false" ? false : true);
	        		ModifyHeaders.ExportImport.ExportWizard.headersSelected();
	        	}
	        },
	        setTree: function(treebox) { this.treeBox = treebox; },
	        isContainer: function(row) { return false; },
	        isEditable: function (row, column) {
	        	if (column == "col-select" || column.id == "col-select") {
	        		return true;
	        	}
	        	return false;
	        },
	        isSeparator: function(row) { return false; },
	        isSorted: function() { return false; },
	        getLevel: function(row) { return 0; },
	        getImageSrc: function(row,col) { return null; },
	        getRowProperties: function(row,props) {},
	        getCellProperties: function(row,col,props) {},
	        getColumnProperties: function(colid,col,props) {},
	        refresh: function(index) {
	            this.treeBox.invalidateRow(index);
	        }
		}
	}
})();