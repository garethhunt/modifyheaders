if (typeof(ModifyHeaders) == "undefined") {
	var ModifyHeaders = {};
}

/**
 * This code is based on the Simple Autocomplete component:
 *  https://developer.mozilla.org/en/How_to_implement_custom_autocomplete_search_component
 *  
 * Thank you to Mozilla for providing a great example
 */
if (typeof(ModifyHeaders.Autocomplete) == "undefined") {
	ModifyHeaders.Autocomplete = {};
}

if (typeof(ModifyHeaders.Autocomplete.Result) == "undefined") {
	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
	
	ModifyHeaders.Autocomplete.Result = function (searchString, searchResult,
			defaultIndex, errorDescription, results, comments) {
		
		this._searchString = searchString;
		this._searchResult = searchResult;
		this._defaultIndex = defaultIndex;
		this._errorDescription = errorDescription;
		this._results = results;
		this._comments = comments;
	};
	
	ModifyHeaders.Autocomplete.Result.prototype = {
		_searchString: "",
		_searchResult: 0,
		_defaultIndex: 0,
		_errorDescription: "",
		_results: [],
		_comments: [],
		
		// The original search string
		get searchString() {
			return this._searchString;
		},
		
		// The result code of this result object, either:
		//         RESULT_IGNORED   (invalid searchString)
		//         RESULT_FAILURE   (failure)
		//         RESULT_NOMATCH   (no matches found)
		//         RESULT_SUCCESS   (matches found)
		get searchResult() {
			return this._searchResult;
		},
		
		// Index of the default item that should be entered if none is selected
		get defaultIndex() {
			return this._defaultIndex;
		},

		// A string describing the cause of a search failure
		get errorDescription() {
			return this._errorDescription;
		},
		
		// The number of matches
		get matchCount() {
			return this._results.length;
		},
		
		getLabelAt: function(index) {
			return this._results[index];
		},
		
		// Get the value of the result at the given index
		getValueAt: function(index) {
			return this._results[index];
		},
		
		// Get the comment of the result at the given index
		getCommentAt: function(index) {
			return this._comments[index];
		},
		
		// Get the style hint for the result at the given index
		getStyleAt: function(index) {
			if (!this._comments[index])
				return null;  // not a category label, so no special styling
			
			if (index == 0)
				return "suggestfirst";  // category label on first line of results
			
			return "suggesthint";   // category label on any other line of results
		},
		
		// Get the image for the result at the given index
		// The return value is expected to be an URI to the image to display
		getImageAt : function (index) {
			return "";
		},
		
		// Remove the value at the given index from the autocomplete results.
		// If removeFromDb is set to true, the value should be removed from
		// persistent storage as well.
		removeValueAt: function(index, removeFromDb) {
			this._results.splice(index, 1);
			this._comments.splice(index, 1);
		},
		
		QueryInterface: function(aIID) {
			if (!aIID.equals(Components.interfaces.nsIAutoCompleteResult)
					&& !aIID.equals(Components.interfaces.nsISupports))
				throw Components.results.NS_ERROR_NO_INTERFACE;
			return this;
		}
	};
}

if (typeof(ModifyHeaders.Autocomplete.Search) == "undefined") {
	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
	
	ModifyHeaders.Autocomplete.Search = function () {};
	
	ModifyHeaders.Autocomplete.Search.prototype = {
		
		// XPCOMUtils
		classDescription: "Modify Headers Auto-complete",
		classID:          Components.ID("{86e57f10-469a-11e0-9207-0800200c9a66}"),
		contractID:       "@mozilla.org/autocomplete/search;1?name=modifyheaders-autocomplete",
		
		QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIAutoCompleteSearch]),
		
		_xpcom_factory: {
			singleton: null,
			createInstance: function (aOuter, aIID) {
				if (aOuter != null)
					throw Components.results.NS_ERROR_NO_AGGREGATION;
				if (this.singleton == null)
					this.singleton = new ModifyHeaders.Autocomplete.Search();
				return this.singleton.QueryInterface(aIID);
			}
		},
		
		/*
		 * Search for a given string and notify a listener (either synchronously
		 * or asynchronously) of the result
		 *
		 * @param searchString - The string to search for
		 * @param searchParam - An extra parameter
		 * @param previousResult - A previous result to use for faster searchinig
		 * @param listener - A listener to notify when the search is complete
		 */
		startSearch: function(searchString, searchParam, result, listener) {
			// This autocomplete source assumes the developer attached a JSON string
			// to the the "autocompletesearchparam" attribute or "searchParam" property
			// of the <textbox> element. The JSON is converted into an array and used
			// as the source of match data. Any values that match the search string
			// are moved into temporary arrays and passed to the AutoCompleteResult
			if (searchParam.length > 0) {
				var searchResults = JSON.parse(searchParam);
				var results = [];
				var comments = [];
				for (i=0; i<searchResults.length; i++) {
					if (searchResults[i].value.toLowerCase().indexOf(searchString.toLowerCase()) == 0) {
						results.push(searchResults[i].value);
						if (searchResults[i].comment)
							comments.push(searchResults[i].comment);
						else
							comments.push(null);
					}
				}
				var newResult = new ModifyHeaders.Autocomplete.Result(searchString, Components.interfaces.nsIAutoCompleteResult.RESULT_SUCCESS, 0, "", results, comments);
				listener.onSearchResult(this, newResult);
			}
		},

		stopSearch: function() {}
	};
}

// Component initialization
if (XPCOMUtils.generateNSGetFactory) {
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([ModifyHeaders.Autocomplete.Search]);
} else {
    var NSGetModule = XPCOMUtils.generateNSGetModule([ModifyHeaders.Autocomplete.Search]);
}
