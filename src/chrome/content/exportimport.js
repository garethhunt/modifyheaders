/**
 * @author gareth
 */

var ModifyHeaders = {};

ModifyHeaders.ExportImport = (function () {
	return {
		wizard: undefined,
		
		init: function (action) {
			this.modifyheadersService = Components.classes["@modifyheaders.mozdev.org/service;1"].getService(Components.interfaces.nsIModifyheaders);
			for (var i = 0; i < this.modifyheadersService.count; i++) {
				action.selectedRows[i] = false;
			}
		}
	}
})();