// Trims leading and trailing spaces from a string
function modifyheaders_trim(string) {

    // If the string is not empty
    if(string) {
        return string.replace(/^\s*|\s*$/g, "");
    } else {
        return "";
    }
}


function getBoolPref(name, value) {

    try {
        var pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        pref = pref.getBranch("extensions.modifyheaders.");
        if (pref.prefHasUserValue(name)) {
            value = pref.getBoolPref(name);
        } else {
            pref.setBoolPref(name, value);
        }
    } catch (ex) {
        alert(ex);
    }
    
    return value;
}


// Opens the modifyheaders interface in a new tab/window
function openModifyHeaders() {

    /* var usetab = getBoolPref("tab", false);
    
    if (usetab) { */
        // Open modifyheaders in a new tab
        gBrowser.selectedTab = gBrowser.addTab('chrome://modifyheaders/content/modifyheaders.xul');
        setTimeout("gURLBar.focus();", 0);
        //gBrowser.selectedTab.setAttribute("image", "chrome://modifyheaders/skin/favicon.ico");
        //var title = document.getElementById("modifyheaders.title").label
        //gBrowser.selectedTab.setAttribute("label", title);
    /* } else {
        // Open LiveHTTPHeaders in a global window
        toOpenWindowByType('global:modifyheaders', 'chrome://modifyheader/content/modifyheaders.xul');
    } */
}