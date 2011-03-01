/**
 * @author Gareth Hunt
 */
var ModifyHeaders = {};

ModifyHeaders.ExportImport = (function () {
	return {
		wizard: undefined,
		
		init: function (action) {
			this.modifyheadersService = Components.classes["@modifyheaders.mozdev.org/service;1"].getService(Components.interfaces.nsIModifyheaders);
			
			var headers = JSON.parse(this.modifyheadersService.getHeaders());
			
			for (var i = 0; i < headers.length; i++) {
				action.selectedRows[i] = false;
			}
		}
	}
})();