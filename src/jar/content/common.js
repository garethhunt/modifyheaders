const PREF_OPEN_NEW_TAB = "modifyheaders.config.openNewTab";
var oModifyHeaders = new ModifyHeaders();


// Trims leading and trailing spaces from a string
function modifyheaders_trim(string) {

    // If the string is not empty
    if(string) {
        return string.replace(/^\s*|\s*$/g, "");
    } else {
        return "";
    }
}


function getBoolPref(name, defaultValue) {

    try {
        if (pref.prefHasUserValue(name)) {
            value = pref.getBoolPref(name);
        } else {
            pref.setBoolPref(name, defaultValue);
        }
    } catch (ex) {
        alert(ex);
    }
    
    return value;
}


// Opens the modifyheaders interface in a new tab/window
function openModifyHeaders() {

    //var openAsTab = getBoolPref(PREF_OPEN_NEW_TAB, false);
	var openAsTab = oModifyHeaders.getPreference("bool", PREF_OPEN_NEW_TAB);
    
    if (openAsTab) {
        // Open modifyheaders in a new tab
        gBrowser.selectedTab = gBrowser.addTab('chrome://modifyheaders/content/modifyheaders.xul');
        setTimeout("gURLBar.focus();", 0);
        //gBrowser.selectedTab.setAttribute("image", "chrome://modifyheaders/skin/favicon.ico");
        //var title = document.getElementById("modifyheaders.title").label
        //gBrowser.selectedTab.setAttribute("label", title);
    } else {
        // Open Modify Headers in a global window
        window.open("chrome://modifyheaders/content/modifyheaders.xul", "modifyheaders", "chrome,centerscreen,resizable");
    }
}