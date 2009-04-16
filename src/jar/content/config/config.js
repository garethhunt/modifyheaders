// Config needs access to the modify headers service
const modifyheadersService = Components.classes["@modifyheaders.mozdev.org/service;1"].getService(Components.interfaces.nsIModifyheaders)

var Config = {
  // Inits the Config tab
  init: function() {
    document.getElementById("modifyheaders-always-on").checked = modifyheadersService.alwaysOn
    document.getElementById("modifyheaders-open-in-new-tab").checked = modifyheadersService.openAsTab
    
    //ImportExport.init()
  },
  
  // Toggles a preference that determines whether to keep ModifyHeaders always on.
  toggleAlwaysOn: function() {
    var alwaysOn = modifyheadersService.alwaysOn
    modifyheadersService.alwaysOn = !alwaysOn
  },
  
  // Toggles a preference that determines whether to open as a tab or window.
  toggleOpenAsTab: function() {
    var openAsTab = modifyheadersService.openAsTab
    modifyheadersService.openAsTab = !openAsTab
  }
}

/*
 * Class provides functions and manages data for the Import/Export wizard
 */
var ImportExport = {
  actionSelectNextBtn: null,
  browseContent: null,
  cancelActionSelectBtn: null,
  filePath: null,
  headerList: null,
  myHeaders: null,
  newHeaders: null,
  strings: null,
  theFile: null,

  init: function() {
    this.actionSelectNextBtn = document.getElementById("actionSelectNext")
    this.cancelActionSelectBtn = document.getElementById("cancelActionSelect")
    this.browseContent = document.getElementById("browseContent")
    this.filePath = document.getElementById("filePath")
    this.headerList = document.getElementById("selectHeaderList")
    this.myHeaders = modifyheadersService.getHeaders({})
    this.strings = document.getElementById("stringResources")
    document.getElementById("importExportWizard").selectedIndex = 0
  },
  
  actionSelected: function() {
    this.init()
    this.resetBrowseContent()
    document.getElementById("filePath").disabled = false
    document.getElementById("fileButton").disabled = false
  },
  
  browseForFile: function() {
    var nsIFilePicker = Components.interfaces.nsIFilePicker
    var fpicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker)
    
    // Default values, assumes export
    var mode = fpicker.modeSave
    var fpHeadStr = this.strings.getString("modifyheaders.export.select.file")
    
    if (document.getElementById("importExportAction").selectedItem == document.getElementById("importHeaders")) {
      mode = fpicker.modeOpen
      fpHeadStr = this.strings.getString("modifyheaders.import.select.file")
    }
    
    fpicker.defaultExtension = this.strings.getString("modifyheaders.export.import.default.fileext")
    fpicker.defaultString = this.strings.getString("modifyheaders.export.import.default.filename")
    fpicker.init(window, fpHeadStr, mode)
    fpicker.appendFilters(nsIFilePicker.filterXML)
    
    var showResult = fpicker.show()
    if (showResult == fpicker.returnOK || showResult == fpicker.returnReplace) {
      this.theFile = fpicker.file
      this.filePath.value = fpicker.file.path
      
      // Load the file if importing
      if (document.getElementById("importExportAction").selectedItem == document.getElementById("importHeaders")) {
        this.importHeaders()
      }
    }
    this.canAdvanceFromSelectFile()
  },
  
  canAdvanceFromSelectFile: function() {
    if (this.browseContent.className == "errorText") {
      return
    } else if ((document.getElementById("importExportAction").selectedItem == document.getElementById("importHeaders")) && (this.newHeaders.length == 0)) {
      this.browseContent.className = "errorText"
      this.browseContent.value = this.strings.getString("modifyheaders.import.no.headers")
      this.reset()
    } else {
      this.resetBrowseContent()
      this.actionSelectNextBtn.disabled = false
      this.cancelActionSelectBtn.disabled = false
    }
  },
  
  advance: function() {
    switch (document.getElementById("importExportWizard").selectedIndex) {
      case "0":
        this.advanceToSelectHeaders()
        break
      case "1":
        this.advanceToFinish()
        break
      default:
        alert("Unable to advance, invalid index: " + document.getElementById("importExportWizard").selectedIndex)
    }
  },
  
  advanceToSelectHeaders: function() {
    while (this.headerList.hasChildNodes()) {
      this.headerList.removeChild(this.headerList.lastChild)
    }
    
    // If (export), display myHeaders, else, display newHeaders
    if (document.getElementById("importExportAction").selectedItem == document.getElementById("exportHeaders")) {
      for (var i=0; i < this.myHeaders.length; i++) {
        var headerCb = document.createElement("checkbox")
        headerCb.setAttribute("id", i)
        headerCb.setAttribute("label", this.myHeaders[i].action + " : " + this.myHeaders[i].name + " : " + this.myHeaders[i].value)
        headerCb.setAttribute("checked", this.myHeaders[i].selected)
        headerCb.addEventListener("CheckboxStateChange", ImportExport.toggleSelectHeader, true)
        this.headerList.appendChild(headerCb)
      }
    } else {
      for (var i=0; i < this.newHeaders.length; i++) {
        var headerCb = document.createElement("checkbox")
        headerCb.setAttribute("id", i)
        headerCb.setAttribute("label", this.newHeaders[i].action + " : " + this.newHeaders[i].name + " : " + this.newHeaders[i].value)
        headerCb.setAttribute("checked", true)
        headerCb.addEventListener("CheckboxStateChange", ImportExport.toggleSelectHeader, true)
        this.newHeaders[i].selected = true
        this.headerList.appendChild(headerCb)
      }
    }
    
    document.getElementById("importExportWizard").selectedIndex = 1
  },
  
  /* The checkboxes have an event listener set that calls this function, when (un)checked */
  toggleSelectHeader: function(event) {
    var index = event.target.getAttribute("id")
    if (document.getElementById("importExportAction").selectedItem == document.getElementById("exportHeaders")) {
      ImportExport.myHeaders[index].selected = event.target.checked
    } else {
      ImportExport.newHeaders[index].selected = event.target.checked
    }
  },
  
  /*
   * Toggles selection of the headers
   */
  toggleSelectAll: function() {
    var toggleAllCb = document.getElementById("toggleAllHeaders")
    var cbNode = this.headerList.firstChild
    
    do {
      cbNode.checked = !toggleAllCb.checked
      cbNode = cbNode.nextSibling
    } while (cbNode != null)
  },
  
  advanceToFinish: function() {
    if (document.getElementById("importExportAction").selectedItem == document.getElementById("exportHeaders")) {
      var strNewHeaders = ""
      // Loop over the header checkboxes
      for (var i=0; i < this.myHeaders.length; i++) {
        if (this.myHeaders[i].selected) {
          strNewHeaders = strNewHeaders.concat(i, ",")
        }
      }
      
      if (strNewHeaders.lastIndexOf(",") == strNewHeaders.length-1) {
        strNewHeaders = strNewHeaders.substr(0, strNewHeaders.length-1)
      }
      
      this.exportHeaders(strNewHeaders)
    } else {
      for (var i=0; i < this.newHeaders.length; i++) {
        if (this.newHeaders[i].selected) {
          modifyheadersService.addHeader(this.newHeaders[i].name, this.newHeaders[i].value, this.newHeaders[i].action, this.newHeaders[i].comment, false)
        }
      }
      // Refresh the header display, if import called from main window
      // wrappedJSObject is used to access the protected object
      if (window.parent.location == "chrome://modifyheaders/content/modifyheaders.xul") {
        // Seamonkey does not wrap the javascript object to protect it
        if (window.parent.wrappedJSObject == null) {
          // This works for Seamonkey
          window.parent.refreshHeaderTree(this.myHeaders.length, this.newHeaders.length)
        } else {
          // This works for Firefox
          window.parent.wrappedJSObject.refreshHeaderTree(this.myHeaders.length, this.newHeaders.length)
        }
      }
    }
    
    var finishContent = document.getElementById("finishPageContent")
    
    if (document.getElementById("importExportAction").selectedItem == document.getElementById("exportHeaders")) {
      finishContent.value = this.strings.getString("modifyheaders.export.finish")
    } else {
      finishContent.value = this.strings.getString("modifyheaders.import.finish")
    }
  
    document.getElementById("importExportWizard").selectedIndex = 2
  },
  
  cancel: function() {
    this.reset()
    document.getElementById("importExportWizard").selectedIndex = 0
  },
  
  finish: function() {
    this.reset()
    document.getElementById("importExportWizard").selectedIndex = 0
  },
  
  reset: function() {
    document.getElementById("filePath").value = ""
    document.getElementById("filePath").disabled = true
    document.getElementById("fileButton").disabled = true
    document.getElementById("cancelActionSelect").disabled = true
    document.getElementById("actionSelectNext").disabled = true
    document.getElementById("importExportAction").selectedItem = null
  },
  
  resetBrowseContent: function() {
    this.browseContent.className = ""
    this.browseContent.value = ""
  },
  
  exportHeaders: function(strNewHeaders) {
    // Create the file, 0 = NORMAL_FILE_TYPE
    if (this.theFile.exists()) {
      this.theFile.remove(false)
    }
    this.theFile.create(0,420)
  
    var nsIFileOutputStream = Components.interfaces.nsIFileOutputStream
    var outStrm = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(nsIFileOutputStream)
    
    // 0x02 = PR_WRONLY - Write only
    outStrm.init(this.theFile, 0x02, 420, 0)
    
    // Convert the strNewHeaders to a XML string and write to the output
    var xmlNewHeaders = modifyheadersService.getHeadersAsXML(strNewHeaders)
    outStrm.write(xmlNewHeaders, xmlNewHeaders.length)
    outStrm.close()
  },
  
  importHeaders: function() {
    var nsIFileInputStream = Components.interfaces.nsIFileInputStream
    var nsIScriptableInputStream = Components.interfaces.nsIScriptableInputStream
    var inStrm = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(nsIFileInputStream)
    var scStrm = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(nsIScriptableInputStream)
    var buf // Buffer to read in chars
    var data = ""
    
    // 0x01 = PR_RDONLY - Read only
    inStrm.init(this.theFile, 0x01, 00004, nsIFileInputStream.CLOSE_ON_EOF)
    
    var parser = new DOMParser()
    var xmlHeaders = parser.parseFromStream(inStrm, null, inStrm.available(), "text/xml")
    
    var tempHeaders = this.processImportedXML(xmlHeaders)
    
    if (tempHeaders == null) {
      return
    }
    
    // Init newHeaders
    this.newHeaders = Array()
    
    // Loop over the tempHeaders and test for any duplicates of existing headers
    for (var i=0; i < tempHeaders.length; i++) {
      if (!this.testForDuplicate(tempHeaders[i])) {
        this.newHeaders.push(tempHeaders[i])
      }
    }
  },
  
  processImportedXML: function(xmlHeaders) {
    var root = xmlHeaders.documentElement
    var outHeaders = new Array()
    
    // Loop over the children of the document element and import headers
    for (var i=0; i < root.childNodes.length; i++) {
      var headerNode = root.childNodes.item(i)
      
      // Each header has 4 sub-nodes (action, name, value, comment)
			if (headerNode.nodeName != "header" | headerNode.childNodes.length != 4) {
        this.browseContent.className = "errorText"
				var errorMsg = this.strings.getString("modifyheaders.import.unexpected.format")
				
				if (headerNode != null) {
					errorMsg = errorMsg + ": " + headerNode.nodeName + " " + i + ", " + headerNode.nodeValue
				} else {
					errorMsg = errorMsg + ": &lt;header&gt; " + i + " node is null"
				}
				
        this.browseContent.value = errorMsg
        return null
      }
      
      // Instantiate a new header
      var header = new Object()
      
      for (var j=0; j < headerNode.childNodes.length; j++) {
        var node = headerNode.childNodes.item(j)
        
        switch (node.nodeName) {
          case "action":
            if (node.firstChild) {
              header.action = node.firstChild.nodeValue
            } else {
              header.action = "modify"
              var actionError = new Error("No action set for the header, setting to 'modify'")
              throw actionError
            }
            break
          case "name":
            header.name = ""
					  if (node.firstChild) {
							header.name = node.firstChild.nodeValue
						}
            break
          case "value":
            header.value = ""
            if (node.firstChild){
              header.value = node.firstChild.nodeValue
            }
            break
          case "comment":
            header.comment = ""
            if (node.firstChild){
              header.comment = node.firstChild.nodeValue
            }
            break
          default:
            this.browseContent.className = "errorText"
						var errorMsg = this.strings.getString("modifyheaders.import.unexpected.format")

						if (node != null) {
							errorMsg = errorMsg + ": header " + i + ", " + node.nodeName + ", " + node.nodeValue
						} else {
							errorMsg = errorMsg + ": header " + i + " node is null"
						}
            this.browseContent.value = errorMsg
            return null
        }
      }
      outHeaders.push(header)
    }
    return outHeaders
  },
  
  testForDuplicate: function(objHeader) {
    // Loop over the exising headers
    // Return true if objHeader is a duplicate, otherwise false
    for (var i=0; i < this.myHeaders.length; i++) {
      if (this.myHeaders[i].equals(objHeader)) {
        return true
      }
    }
    return false // objHeader does not match any of the headers
  }
}
