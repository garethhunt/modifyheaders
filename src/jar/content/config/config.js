// Config needs access to the modify headers service
const modifyheadersService = Components.classes["@modifyheaders.mozdev.org/service;1"].getService(Components.interfaces.nsIModifyheaders);

// Inits the Config tab
function initConfig() {
    document.getElementById("modifyheaders-always-on").checked = modifyheadersService.alwaysOn;
    document.getElementById("modifyheaders-open-in-new-tab").checked = modifyheadersService.openAsTab;
}

// Toggles a preference that determines whether to keep ModifyHeaders always on.
function toggleAlwaysOn() {
    var alwaysOn = modifyheadersService.alwaysOn;
    modifyheadersService.alwaysOn = !alwaysOn;
}

// Toggles a preference that determines whether to open as a tab or window.
function toggleOpenAsTab() {
    var openAsTab = modifyheadersService.openAsTab;
    modifyheadersService.openAsTab = !openAsTab;
}

// Starts the import/export wizard
function openImportExportWizard() {
    window.open("chrome://modifyheaders/content/config/importexport.xul", "modifyheaders-import-export", "chrome,centerscreen,resizable");
}

