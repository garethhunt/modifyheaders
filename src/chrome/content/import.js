/**
 * @author gareth
 */
ModifyHeaders.ExportImport.ImportWizard = (function () {
	return {
		initiated: false,
		importedConfig: [],
		selectedRows: [],
		
		init: function () {
			if (!this.initiated) {
				ModifyHeaders.ExportImport.init(this);
				ModifyHeaders.ExportImport.wizard = document.getElementById("modifyheaders-import-wizard");
				ModifyHeaders.ExportImport.wizard.canAdvance = false;
				this.retVal = window.arguments[1];
				this.initiated = true;
			}
		},
			
		openFileBrowser: function () {
	        var fpicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
		    var mode = fpicker.modeOpen;
	        var fpHeadStr = "Select location from which to load Modify Headers configuration";
		    
	        fpicker.init(window, fpHeadStr, mode);
		    
	        var showResult = fpicker.show();
	        if (showResult == fpicker.returnOK) {
	        	this.theFile = fpicker.file;
		        document.getElementById("file-path").value = this.theFile.path;
		        ModifyHeaders.ExportImport.wizard.canAdvance = true;
	        }
		},
		
		loadHeaders: function () {
	        var cancel = false,
	        	data = new String();

	        if (this.theFile.exists()) {
	            try {
	                var fiStream = Components.classes["@mozilla.org/network/file-input-stream;1"].
	                    createInstance(Components.interfaces.nsIFileInputStream);
	                var siStream = Components.classes["@mozilla.org/scriptableinputstream;1"].
	                    createInstance(Components.interfaces.nsIScriptableInputStream);
	                fiStream.init(this.theFile, 1, 0, false);
	                siStream.init(fiStream);
	                data += siStream.read(-1);
	                siStream.close();
	                fiStream.close();
	                
	                var tempConfig = this.isJSON(data) || this.isXML(data) || null;
	                
	                tempConfig.forEach(function (header) {
	                	this.importedConfig.push(header);
	                }, this);
	                
	                // If the file is verified, the wizard can advance
	                if (this.importedConfig == null) {
	                	ModifyHeaders.ExportImport.wizard.canAdvance = false;
	                	document.getElementById("error").hidden = false;
	                	cancel = true;
	                } else {
	                	ModifyHeaders.ExportImport.wizard.canAdvance = true;
	                	document.getElementById("error").hidden = true;
	                }
	            } catch(e) {
	                Components.utils.reportError(e);
	            }
	        } else {
	        	ModifyHeaders.ExportImport.wizard.canAdvance = false;
               	document.getElementById("error").hidden = false; // TODO Display a different error message
	            Components.utils.reportError("Error: File does not exist");
	            cancel = true;
	        }
	        return !cancel
		},
		
		isJSON: function (data) {
			var config = false;
			
			try {
				config = JSON.parse(data);
			} catch (e) {
				// Do nothing
			}
			
			return config;
		},
		
		isXML: function (data) {
			var config = false,
				header = null,
				characters = "",
				xmlReader = Components.classes["@mozilla.org/saxparser/xmlreader;1"]
				.createInstance(Components.interfaces.nsISAXXMLReader);

			xmlReader.contentHandler = {
				startDocument: function() {},
				endDocument: function() {},
				
				startElement: function(uri, localName, qName, attributes) {
					switch (localName) {
						case "modifyheaders":
							config = new Array();
							break;
						case "header":
							header = {};
							break;
						case "action":
						case "name":
						case "value":
						case "comment":
							characters = "";
							break;
						default:
							throw "Invalid element: " + localName;
					}
				},
				
				endElement: function(uri, localName, qName) {
					switch (localName) {
						case "modifyheaders":
							break;
						case "header":
							if (config && (config instanceof Array) && (header != null)) {
								config.push(header);
							} else {
								throw "No configuration to add header";
							}
							break;
						case "action":
							this.addHeaderProperty("action");
							break;
						case "name":
							this.addHeaderProperty("name");
							break;
						case "value":
							this.addHeaderProperty("value");
							break;
						case "comment":
							this.addHeaderProperty("comment");
							break;
						default:
							throw "End Element: " + localName;
					}
				},
				
				addHeaderProperty: function (prop) {
					if (header != null) {
						header[prop] = characters;
					} else {
						throw "Invalid header (" +  prop + ")"
					}
				},
				
				characters: function(value) {
					characters = value;
				},
				
				processingInstruction: function(target, data) {},
				ignorableWhitespace: function(whitespace) {},
				startPrefixMapping: function(prefix, uri) {},
				endPrefixMapping: function(prefix) {},
				
				// nsISupports
				QueryInterface: function(iid) {
					if (!iid.equals(Components.interfaces.nsISupports) &&
						!iid.equals(Components.interfaces.nsISAXContentHandler))
							throw Components.results.NS_ERROR_NO_INTERFACE;
					return this;
				}
			};
			
			try {
				xmlReader.parseFromString(data, "text/xml");
			} catch (e) {
                Components.utils.reportError(e);
			}
			
			return config;
		},

		showSelectHeaders: function () {
			document.getElementById("select-headers-tree").view = ModifyHeaders.ExportImport.ImportWizard.selectHeadersTreeView;
			ModifyHeaders.ExportImport.ImportWizard.headersSelected();
		},
		
		selectAllHeaders: function (checkBox) {
			for (var i = 0; i < ModifyHeaders.ExportImport.ImportWizard.importedConfig.length; i++) {
				ModifyHeaders.ExportImport.ImportWizard.selectedRows[i] = !checkBox.checked;
			}
			ModifyHeaders.ExportImport.wizard.canAdvance = !checkBox.checked;
		},
		
		headersSelected: function () {
			var trueCount = 0;
			
			for (var i = 0; i < ModifyHeaders.ExportImport.ImportWizard.importedConfig.length; i++) {
				if (ModifyHeaders.ExportImport.ImportWizard.selectedRows[i]) {
					trueCount++;
				}
			}
			ModifyHeaders.ExportImport.wizard.canAdvance = (trueCount > 0) ? true : false;
			document.getElementById("select-all-headers").checked = (trueCount == ModifyHeaders.ExportImport.ImportWizard.importedConfig.length) ? true : false;
		},
		
		selectHeadersTreeView: {
	        selection: null,
	        get rowCount() {
	        	return ModifyHeaders.ExportImport.ImportWizard.importedConfig.length;
	        },
	        getCellText: function(row,column) {
	        	if (column == "col-select" || column.id == "col-select") {
	        		return "";
	        	} else if (column == "col-action" || column.id == "col-action") {
	        		return ModifyHeaders.ExportImport.ImportWizard.importedConfig[row].action;
	            } else if (column == "col-header-name" || column.id == "col-header-name") {
	        		return ModifyHeaders.ExportImport.ImportWizard.importedConfig[row].name;
	            } else if (column == "col-header-value" || column.id == "col-header-value") {
	        		return ModifyHeaders.ExportImport.ImportWizard.importedConfig[row].value;
	            } else if (column == "col-comment" || column.id == "col-comment") {
	        		return ModifyHeaders.ExportImport.ImportWizard.importedConfig[row].comment;
	            }
	            return null;
	        },
	        getCellValue: function (row,column) {
	        	if (column == "col-select" || column.id == "col-select") {
	        		return ModifyHeaders.ExportImport.ImportWizard.selectedRows[row];
	        	}
	        	return null;
	        },
	        setCellValue: function (row, column, value) {
	        	if (column == "col-select" || column.id == "col-select") {
	        		ModifyHeaders.ExportImport.ImportWizard.selectedRows[row] = (value == "false" ? false : true);
	        		ModifyHeaders.ExportImport.ImportWizard.headersSelected();
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
		},
		
		showConfirm: function () {
			var count = 0;
			for (var i = 0; i < ModifyHeaders.ExportImport.ImportWizard.importedConfig.length; i++) {
				if (ModifyHeaders.ExportImport.ImportWizard.selectedRows[i]) {
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
			confirmFilePath.appendChild(document.createTextNode(this.theFile.path));
		},
		
		import: function () {
			var importHeaders = [],
				exportHeadersJson = "",
				count = 0;
			
			var headers = JSON.parse(ModifyHeaders.ExportImport.modifyheadersService.getHeaders());
			
			for (var i = 0; i < ModifyHeaders.ExportImport.ImportWizard.importedConfig.length; i++) {
				// If selected, get the header from the importedConfig
				if (ModifyHeaders.ExportImport.ImportWizard.selectedRows[i]) {
					var header = {
						action  : ModifyHeaders.ExportImport.ImportWizard.importedConfig[i].action,
						name    : ModifyHeaders.ExportImport.ImportWizard.importedConfig[i].name,
						value   : ModifyHeaders.ExportImport.ImportWizard.importedConfig[i].value,
						comment : ModifyHeaders.ExportImport.ImportWizard.importedConfig[i].comment
					};
					headers.push(header);
					count++;
				}
			}
			ModifyHeaders.ExportImport.modifyheadersService.saveHeaders(JSON.stringify(headers));
			this.retVal.importedHeaderCount = count;
		}
	}
})();