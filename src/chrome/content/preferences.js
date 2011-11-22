/**
 * @author Gareth Hunt
 */
var ModifyHeaders = ModifyHeaders || {};

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

ModifyHeaders.ActivateListener = (function (callback) {
	var listener = {
		register: function () {
			var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
			this._branch = prefService.getBranch("modifyheaders.");
			this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
			this._branch.addObserver("", this, false);
		},
		
		unregister: function () {
			if (!this._branch) return;  
		    this._branch.removeObserver("", this);
		},
		
		observe: function (subject, topic, data) {
			if (topic == 'nsPref:changed') {
			    this._callback(this._branch, data);
			}
		}
	}
	listener._callback = callback;
	return listener;
});
