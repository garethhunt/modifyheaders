/**
 * @author gareth
 */

var ModifyHeaders = {};

ModifyHeaders.ExportImport = (function () {
	return {
		JSON: null,
		wizard: undefined,
		
		init: function (action) {
			Components.utils.import("resource://modifyheaders/JSON.js", ModifyHeaders.ExportImport);
			this.modifyheadersService = Components.classes["@modifyheaders.mozdev.org/service;1"].getService(Components.interfaces.nsIModifyheaders);
			
			for (var i = 0; i < this.modifyheadersService.count; i++) {
				action.selectedRows[i] = false;
			}
		}
	}
})();