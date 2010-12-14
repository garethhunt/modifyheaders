/**
 * @author gareth
 */
ModifyHeaders.Preferences = (function () {
	return {
		openExportWizard: function () {
			window.openDialog("chrome://modifyheaders/content/exportwizard.xul", "modifyheadersExportWizard", "chrome,titlebar,toolbar,resizeable,centerscreen,dialog=no", this);
		},
		openImportWizard: function () {
			alert("Opening Import Wizard");
		}
	}	
})();
