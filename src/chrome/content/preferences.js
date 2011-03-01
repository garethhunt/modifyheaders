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
			ModifyHeaders.headerListTreeView.data = JSON.parse(ModifyHeaders.modifyheadersService.getHeaders());
			ModifyHeaders.headerListTreeView.treeBox.rowCountChanged(0, retVals.importedHeaderCount);
			ModifyHeaders.headerListTreeView.selection.select(ModifyHeaders.headerListTreeView.rowCount-1);
		}
	}	
})();
