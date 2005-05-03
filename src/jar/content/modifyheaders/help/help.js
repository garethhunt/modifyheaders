var helpBrowser;

const RDF = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
const NC = "http://home.netscape.com/NC-rdf#";
const NC_LINK = RDF.GetResource(NC + "link");

function modifyheaders_help_init() {
	helpBrowser = document.getElementById("modifyheaders-help-content");
}


// The tree object is passed into the function
function modifyheaders_help_loadURI(treeObj) {

	try {
		var resource = treeObj.view.getResourceAtIndex(treeObj.currentIndex);
		var link = treeObj.database.GetTarget(resource, NC_LINK, true);
		if (link) {
			link = link.QueryInterface(Components.interfaces.nsIRDFLiteral);
			helpBrowser.webNavigation.loadURI(link.Value, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
		}
	} catch (e) {
	}// when switching between tabs a spurious row number is returned.
}
	