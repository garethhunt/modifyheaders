var oModifyHeaders = new ModifyHeaders();

function initConfig() {
	// Get the current value
	var openNewTab = oModifyHeaders.getPreference("bool", PREF_OPEN_NEW_TAB);
	
	//alert(openNewTab);
	
	// Set the checkbox
	document.getElementById("modifyheaders-open-in-new-tab").checked = openNewTab;
}

function toggleOpenNewTab() {
	// Get the current value
	var openAsTab = oModifyHeaders.getPreference("bool", PREF_OPEN_NEW_TAB);
	
	// Set the inverse of the current value for the preference
	oModifyHeaders.setPreference("bool", PREF_OPEN_NEW_TAB, !openAsTab);
}
