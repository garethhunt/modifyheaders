/**
 * @author gareth
 */
ModifyHeaders.Preferences = (function () {
	return {
		openExportWizard: function () {
			window.openDialog("chrome://modifyheaders/content/exportwizard.xul", "modifyheadersExportWizard", "chrome,modal,titlebar,toolbar,resizeable,centerscreen,dialog=no", this);
		},
		openImportWizard: function () {
			var retVals ={
				importedHeaderCount: 0
			}
			var importDialog = window.openDialog("chrome://modifyheaders/content/importwizard.xul", "modifyheadersImportWizard", "chrome,modal,titlebar,toolbar,resizeable,centerscreen,dialog=no", this, retVals);
			ModifyHeaders.treeBox.rowCountChanged(0, retVals.importedHeaderCount);
			ModifyHeaders.treeSelection.select(this.rowCount-1);
		}
	}	
})();
