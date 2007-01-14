// Import/Export needs access to the modify headers service
const modifyheadersService = Components.classes["@modifyheaders.mozdev.org/service;1"].getService(Components.interfaces.nsIModifyheaders)
var initialised = false
var exportWiz
var filePath
var myHeaders  // Holds the headers to export or compare to import
var newHeaders // Hold the headers to import
var strNewHeaders // String of header indices to import
var theFile    // Holds the file reference
var strings
var browseContent // Displays messages once file browsing is complete

function init() {
    if (!initialised) {
        exportWiz = document.getElementById("modifyheaders-import-export")
        filePath = document.getElementById("filePath")
        browseContent = document.getElementById("browseContent")
        strings = document.getElementById("stringResources")
        document.getElementById("action").selectedItem = document.getElementById("aExport") // Initialise the action radio group
        initialised = true
    }
}

function initPageSelectAction() {
    init() // Init needs to be called from here as the wizard 'onload' is fired after the wizardpage 'onpageshow' event 
    exportWiz.canAdvance = true
}

function initPageSelectFile() {
    exportWiz.canAdvance = false
    myHeaders = modifyheadersService.getHeaders({})
}

// Browse for the file to import or export
function browseForFile() {
    var nsIFilePicker = Components.interfaces.nsIFilePicker
    var fpicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker)
    
    // Default values, assumes export
    var mode = fpicker.modeSave
    var fpHeadStr = strings.getString("modifyheaders.export.select.file")
    
    if (document.getElementById("action").value == "import") {
        mode = fpicker.modeOpen
        fpHeadStr = strings.getString("modifyheaders.import.select.file")
    }
    
    fpicker.init(window, fpHeadStr, mode)
    fpicker.appendFilters(nsIFilePicker.filterText)
    
    var showResult = fpicker.show()
    if (showResult == fpicker.returnOK || showResult == fpicker.returnReplace) {
        theFile = fpicker.file
        filePath.value = fpicker.file.path
        
        // Load the file if importing
        if (document.getElementById("action").value == "import") {
    	    importHeaders()
        }
    }
    canAdvanceFromSelectFile()
}

function canAdvanceFromSelectFile() {
    if ((document.getElementById("action").value == "import") && (newHeaders.length == 0)) {
        browseContent.className = "errorText"
        browseContent.value = strings.getString("modifyheaders.import.no.headers")
        exportWiz.canAdvance = false
    } else {
        browseContent.className = ""
        browseContent.value = ""
        exportWiz.canAdvance = (filePath.textLength > 0)
    }
}

// Display the headers to be selected
function initPageSelectHeaders() {

    var headerList = document.getElementById("selectHeaderList")
    
    while (headerList.hasChildNodes()) {
        headerList.removeChild(headerList.lastChild)
    }

    // If (export), display myHeaders, else, display newHeaders
    if (document.getElementById("action").selectedItem == document.getElementById("aExport")) {
        for (var i=0; i < myHeaders.length; i++) {
            var headerCb = document.createElement("checkbox")
            headerCb.setAttribute("id", i)
            headerCb.setAttribute("label", myHeaders[i].action + " : " + myHeaders[i].name + " : " + myHeaders[i].value)
            headerCb.setAttribute("checked", myHeaders[i].selected)
            headerCb.addEventListener("CheckboxStateChange", toggleSelectHeader, true)
            headerList.appendChild(headerCb)
        }
    } else {
        for (var i=0; i < newHeaders.length; i++) {
            var headerCb = document.createElement("checkbox")
            headerCb.setAttribute("id", i)
            headerCb.setAttribute("label", newHeaders[i].action + " : " + newHeaders[i].name + " : " + newHeaders[i].value)
            headerCb.setAttribute("checked", newHeaders[i].selected)
            headerCb.addEventListener("CheckboxStateChange", toggleSelectHeader, true)
            headerList.appendChild(headerCb)
        }
    }
}

/* The checkboxes have an event listener set that calls this function, when (un)checked */
function toggleSelectHeader(event) {
    var index = event.target.getAttribute("id")
    if (document.getElementById("action").selectedItem == document.getElementById("aExport")) {
        myHeaders[index].selected = event.target.checked
    } else {
        newHeaders[index].selected = event.target.checked
    }
}

/*
 * Toggles selection of the headers
 */
function toggleSelectAll() {
    var toggleAllCb = document.getElementById("toggleAllHeaders")
    var headerList = document.getElementById("selectHeaderList")
    var cbNode = headerList.firstChild
    
    do {
        cbNode.checked = !toggleAllCb.checked
        cbNode = cbNode.nextSibling
    } while (cbNode != null)
}

/*
 * Complete the import/export
 */
function finishImportExport() {
    var headerList = document.getElementById("selectHeaderList")

    if (document.getElementById("action").selectedItem == document.getElementById("aExport")) {
        strNewHeaders = ""
        // Loop over the header checkboxes
        for (var i=0; i < myHeaders.length; i++) {
            if (myHeaders[i].selected) {
                strNewHeaders = strNewHeaders.concat(i, ",")
            }
        }
        
        if (strNewHeaders.lastIndexOf(",") == strNewHeaders.length-1) {
        	strNewHeaders = strNewHeaders.substr(0, strNewHeaders.length-1)
        }
        
        exportHeaders()
    } else {
        for (var i=0; i < newHeaders.length; i++) {
            if (newHeaders[i].selected) {
                modifyheadersService.addHeader(newHeaders[i].name, newHeaders[i].value, newHeaders[i].action, false)
            }
        }
        // Refresh the header display, if import called from main window
        // wrappedJSObject is used to access the protected object
        if (window.opener.parent.location == "chrome://modifyheaders/content/modifyheaders.xul") {
            // Seamonkey does not wrap the javascript object to protect it
            if (window.opener.parent.wrappedJSObject == null) {
                // This works for Seamonkey
                window.opener.parent.refreshHeaderTree(myHeaders.length, newHeaders.length)
            } else {
                // This works for Firefox
                window.opener.parent.wrappedJSObject.refreshHeaderTree(myHeaders.length, newHeaders.length)
            }
        }
    }
    exportWiz.canRewind = false
    exportWiz.getButton("cancel").disabled = true
    
    var finishContent = document.getElementById("finishPageContent")
    
    if (document.getElementById("action").selectedItem == document.getElementById("aExport")) {
        finishContent.value = strings.getString("modifyheaders.export.finish")
    } else {
        finishContent.value = strings.getString("modifyheaders.import.finish")
    }
}

function exportHeaders() {
    // Create the file, 0 =  NORMAL_FILE_TYPE
    if (theFile.exists()) {
        theFile.remove(false)
    }
    theFile.create(0,420)

    var nsIFileOutputStream = Components.interfaces.nsIFileOutputStream
    var outStrm = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(nsIFileOutputStream)
    
    // 0x02 = PR_WRONLY - Write only
    outStrm.init(theFile, 0x02, 420, 0)
    
    // Convert the strNewHeaders to a JSON string and write to the output
    var jsonNewHeaders = modifyheadersService.getHeadersAsJSONString(strNewHeaders)
    outStrm.write(jsonNewHeaders, jsonNewHeaders.length)
    outStrm.close()
}

function importHeaders() {
    var nsIFileInputStream = Components.interfaces.nsIFileInputStream
    var nsIScriptableInputStream = Components.interfaces.nsIScriptableInputStream
    var inStrm = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(nsIFileInputStream)
    var scStrm = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(nsIScriptableInputStream)
    var buf // Buffer to read in chars
    var data = ""
    
    // 0x01 = PR_RDONLY - Read only
    inStrm.init(theFile, 0x01, 00004, nsIFileInputStream.CLOSE_ON_EOF)
    scStrm.init(inStrm)
    while (scStrm.available() > 0) {
    	buf = scStrm.read(4096)
    	data += buf
    }
    
    var tempHeaders = eval(data)
    newHeaders = Array()
    
    // Loop over the tempHeaders and test for any duplicates of existing headers
    for (var i=0; i < tempHeaders.length; i++) {
        if (!testForDuplicate(tempHeaders[i])) {
        	newHeaders.push(tempHeaders[i])
        }
    }
}

function testForDuplicate(objHeader) {
    // Loop over the exising headers
    // Return true if objHeader is a duplicate, otherwise false
    for (var i=0; i < myHeaders.length; i++) {
        if (myHeaders[i].equals(objHeader)) {
            return true
        }
    }
    return false // objHeader does not match any of the headers
}
