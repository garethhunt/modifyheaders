var modifyheaders_optionsDataBoolean = new Array();
var modifyheaders_optionsDataInteger = new Array();
var modifyheaders_optionsDataString  = new Array();

var modifyheaders_action = null;
var modifyheaders_name   = null;
var modifyheaders_value  = null;

// Adds a user agent
function modifyheaders_addHeader()
{
    const pageDocument = document.getElementById("modifyheaders-options-iframe").contentDocument;
    //const headerBox = pageDocument.getElementById("modifyheaders-listbox");
    const headerBox = pageDocument.getElementById("modifyheaders-tree");

    window.openDialog("chrome://modifyheaders/content/options/dialogs/header.xul", "modifyheaders-header-dialog", "centerscreen,chrome,modal", "add");

    // If the name is set
    if(modifyheaders_headerName)
    {
        var newItem = headerBox.appendItem(modifyheaders_headerName, '');

        newItem.setAttribute("action", modifyheaders_headerAction);
        newItem.setAttribute("name", modifyheaders_headerName);
        newItem.setAttribute("value", modifyheaders_headerValue);

        headerBox.ensureElementIsVisible(newItem);
        headerBox.selectItem(newItem);
    }
}

// Handles changing the options page
function modifyheaders_changePage(pageList)
{
    //modifyheaders_storeOptions();

    document.getElementById("modifyheaders-options-iframe").setAttribute("src", pageList.selectedItem.getAttribute("value"));
}

// Deletes a user agent
function modifyheaders_deleteUserAgent()
{
    const pageDocument  = document.getElementById("modifyheaders-options-iframe").contentDocument;
    const userAgentBox  = pageDocument.getElementById("modifyheaders-listbox");
    const selectedIndex = userAgentBox.selectedIndex;
    const selectedItem  = userAgentBox.selectedItem;
    const stringBundle  = document.getElementById("modifyheaders-string-bundle");

    // If an item is selected and the deletion is confirmed
    if(selectedItem && confirm(stringBundle.getString("modifyheaders_deleteConfirmation")))
    {
        userAgentBox.removeChild(selectedItem);
    }
}

// Edits a user agent
function modifyheaders_editUserAgent()
{
    const pageDocument = document.getElementById("modifyheaders-options-iframe").contentDocument;
    const userAgentBox = pageDocument.getElementById("modifyheaders-listbox");
    const selectedItem = userAgentBox.selectedItem;

    // If an item is selected
    if(selectedItem)
    {
        var appName    = "";
        var appVersion = "";
        var platform   = "";

        // If the selected item has an app name attribute
        if(selectedItem.hasAttribute("appname"))
        {
            appName = selectedItem.getAttribute("appname");
        }

        // If the selected item has an app version attribute
        if(selectedItem.hasAttribute("appversion"))
        {
            appVersion = selectedItem.getAttribute("appversion");
        }

        // If the selected item has a platform attribute
        if(selectedItem.hasAttribute("platform"))
        {
            platform = selectedItem.getAttribute("platform");
        }

        window.openDialog("chrome://modifyheaders/content/options/dialogs/user_agent.xul", "modifyheaders-user-agent-dialog", "centerscreen,chrome,modal", "edit", appName, appVersion, selectedItem.label, platform, selectedItem.value);

        // If the description is set
        if(modifyheaders_description)
        {
            selectedItem.label = modifyheaders_description;
            selectedItem.value = modifyheaders_userAgent;

            selectedItem.setAttribute("appname", modifyheaders_appName);
            selectedItem.setAttribute("appversion", modifyheaders_appVersion);
            selectedItem.setAttribute("platform", modifyheaders_platform);

            userAgentBox.ensureElementIsVisible(selectedItem);
        }
    }
}

// Initializes the general page
function modifyheaders_initializeGeneral()
{
    const pageDocument       = document.getElementById("modifyheaders-options-iframe").contentDocument;
    const preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("");

    // If the hide menu preference is set
    if(typeof modifyheaders_optionsDataBoolean["modifyheaders.menu.hide"] != "undefined")
    {
        pageDocument.getElementById("modifyheaders.menu.hide").checked = modifyheaders_optionsDataBoolean["modifyheaders.menu.hide"];
    }
    else if(preferencesService.prefHasUserValue("modifyheaders.menu.hide"))
    {
        pageDocument.getElementById("modifyheaders.menu.hide").checked = preferencesService.getBoolPref("modifyheaders.menu.hide");
    }
    else
    {
        pageDocument.getElementById("modifyheaders.menu.hide").checked = false;
    }

    // If the reset on close preference is set
    if(typeof modifyheaders_optionsDataBoolean["modifyheaders.reset.onclose"] != "undefined")
    {
        pageDocument.getElementById("modifyheaders.reset.onclose").checked = modifyheaders_optionsDataBoolean["modifyheaders.reset.onclose"];
    }
    else if(preferencesService.prefHasUserValue("modifyheaders.reset.onclose"))
    {
        pageDocument.getElementById("modifyheaders.reset.onclose").checked = preferencesService.getBoolPref("modifyheaders.reset.onclose");
    }
    else
    {
        pageDocument.getElementById("modifyheaders.reset.onclose").checked = false;
    }
}

// Initializes the options dialog box
function modifyheaders_initializeOptions()
{
    const preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("");
    const selectedPage       = document.getElementById("modifyheaders-page-list").selectedItem.getAttribute("value");

    // If this is the general page
    if(selectedPage.indexOf("general") != -1)
    {
        modifyheaders_initializeGeneral();
    }
    else if(selectedPage.indexOf("user_agents") != -1)
    {
        modifyheaders_initializeUserAgents();
    }
}

// Initializes the user agents page
function modifyheaders_initializeUserAgents()
{
    const pageDocument       = document.getElementById("modifyheaders-options-iframe").contentDocument;
    const preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("");
    const userAgentBox       = pageDocument.getElementById("modifyheaders-listbox");

    var appName          = null;
    var appNameValue     = null;
    var appVersion       = null;
    var appVersionValue  = null;
    var description      = null;
    var descriptionValue = null;
    var listItem         = null;
    var platform         = null;
    var platformValue    = null;
    var userAgent        = null;
    var userAgentCount   = 0;
    var userAgentValue   = null;

    // If the user agents count preference is set
    if(typeof modifyheaders_optionsDataInteger["modifyheaders.user.agents.count"] != "undefined")
    {
        userAgentCount = modifyheaders_optionsDataInteger["modifyheaders.user.agents.count"];
    }
    else if(preferencesService.prefHasUserValue("modifyheaders.user.agents.count"))
    {
        userAgentCount = preferencesService.getIntPref("modifyheaders.user.agents.count");
    }

    // Loop through the possible user agents
    for(var i = 1; i <= userAgentCount; i++)
    {
	    appName     = "modifyheaders." + i + ".appname";
	    appVersion  = "modifyheaders." + i + ".appversion";
	    description = "modifyheaders." + i + ".description";
	    platform    = "modifyheaders." + i + ".platform";
	    userAgent   = "modifyheaders." + i + ".useragent";

        // If the app name is set
        if(typeof modifyheaders_optionsDataString[appName] != "undefined")
        {
            appNameValue = modifyheaders_trim(modifyheaders_optionsDataString[appName]);
        }
        else if(preferencesService.prefHasUserValue(appName))
        {
            appNameValue = modifyheaders_trim(preferencesService.getCharPref(appName));
        }
        else
        {
            appNameValue = null;
        }

        // If the app version is set
        if(typeof modifyheaders_optionsDataString[appVersion] != "undefined")
        {
            appVersionValue = modifyheaders_trim(modifyheaders_optionsDataString[appVersion]);
        }
        else if(preferencesService.prefHasUserValue(appVersion))
        {
            appVersionValue = modifyheaders_trim(preferencesService.getCharPref(appVersion));
        }
        else
        {
            appVersionValue = null;
        }

        // If the description is set
        if(typeof modifyheaders_optionsDataString[description] != "undefined")
        {
            descriptionValue = modifyheaders_trim(modifyheaders_optionsDataString[description]);
        }
        else if(preferencesService.prefHasUserValue(description))
        {
            descriptionValue = modifyheaders_trim(preferencesService.getCharPref(description));
        }
        else
        {
            descriptionValue = null;
        }

        // If the platform is set
        if(typeof modifyheaders_optionsDataString[platform] != "undefined")
        {
            platformValue = modifyheaders_trim(modifyheaders_optionsDataString[platform]);
        }
        else if(preferencesService.prefHasUserValue(platform))
        {
            platformValue = modifyheaders_trim(preferencesService.getCharPref(platform));
        }
        else
        {
            platformValue = null;
        }

        // If the user agent is set
        if(typeof modifyheaders_optionsDataString[userAgent] != "undefined")
        {
            userAgentValue = modifyheaders_trim(modifyheaders_optionsDataString[userAgent]);
        }
        else if(preferencesService.prefHasUserValue(userAgent))
        {
            userAgentValue = modifyheaders_trim(preferencesService.getCharPref(userAgent));
        }
        else
        {
            userAgentValue = null;
        }

        // If the description is set
        if(descriptionValue)
        {
            listItem = userAgentBox.appendItem(descriptionValue, userAgentValue);

            listItem.setAttribute("appname", appNameValue);
            listItem.setAttribute("appversion", appVersionValue);
            listItem.setAttribute("platform", platformValue);
        }
    }
}

// Moves the selected item down
function modifyheaders_moveDown()
{
    const pageDocument   = document.getElementById("modifyheaders-options-iframe").contentDocument;
    const userAgentBox   = pageDocument.getElementById("modifyheaders-listbox");
    const selectedIndex  = userAgentBox.selectedIndex;
    const selectedItem   = userAgentBox.selectedItem;
    const userAgentCount = userAgentBox.getRowCount();

    // If an item is selected and it is not at the bottom
    if(selectedItem && selectedIndex != userAgentCount - 1)
    {
        userAgentBox.selectItem(userAgentBox.insertBefore(selectedItem, userAgentBox.getNextItem(selectedItem, 2)));
    }
}

// Moves the selected item up
function modifyheaders_moveUp()
{
    const pageDocument  = document.getElementById("modifyheaders-options-iframe").contentDocument;
    const userAgentBox  = pageDocument.getElementById("modifyheaders-listbox");
    const selectedIndex = userAgentBox.selectedIndex;
    const selectedItem  = userAgentBox.selectedItem;

    // If an item is selected and it is not at the top
    if(selectedItem && selectedIndex != 0)
    {
        userAgentBox.selectItem(userAgentBox.insertBefore(selectedItem, userAgentBox.getPreviousItem(selectedItem, 1)));
    }
}

// Resets the user's options
function modifyheaders_resetOptions()
{
    const stringBundle = document.getElementById("modifyheaders-string-bundle");

    // If the reset is confirmed
    if(confirm(stringBundle.getString("modifyheaders_resetConfirmation")))
    {
        const preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("");

        modifyheaders_optionsDataBoolean = new Array();
        modifyheaders_optionsDataInteger = new Array();
        modifyheaders_optionsDataString  = new Array();

        preferencesService.deleteBranch("modifyheaders.");
        modifyheaders_setupDefaultOptions();
        modifyheaders_initializeOptions();
    }
}

// Saves the user's options
function modifyheaders_saveOptions()
{
    const preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("");

    var option      = null;
    var optionValue = null;

    // Make sure current page is stored
    modifyheaders_storeOptions();

    // Loop through the boolean options
    for(option in modifyheaders_optionsDataBoolean)
    {
        preferencesService.setBoolPref(option, modifyheaders_optionsDataBoolean[option]);
    }

    // Loop through the integer options
    for(option in modifyheaders_optionsDataInteger)
    {
        optionValue = modifyheaders_optionsDataInteger[option];

        // If the option value is set
        if(optionValue)
        {
            preferencesService.setIntPref(option, optionValue);
        }
        else if(preferencesService.prefHasUserValue(option))
        {
            preferencesService.clearUserPref(option);
        }
    }

    // Loop through the string options
    for(option in modifyheaders_optionsDataString)
    {
        optionValue = modifyheaders_optionsDataString[option];

        // If the option value is set or the preference currently has a value
        if(optionValue || preferencesService.prefHasUserValue(option))
        {
            preferencesService.setCharPref(option, optionValue);
        }
    }
}

// Stores the user's options to be saved later
function modifyheaders_storeOptions()
{
    const iFrame       = document.getElementById("modifyheaders-options-iframe");
    const iFrameSrc    = iFrame.getAttribute("src");
    const pageDocument = iFrame.contentDocument;

    // If this is the general page
    if(iFrameSrc.indexOf("general") != -1)
    {
        modifyheaders_optionsDataBoolean["modifyheaders.menu.hide"]     = pageDocument.getElementById("modifyheaders.menu.hide").checked;
        modifyheaders_optionsDataBoolean["modifyheaders.reset.onclose"] = pageDocument.getElementById("modifyheaders.reset.onclose").checked;
    }
    else if(iFrameSrc.indexOf("user_agents") != -1)
    {
        const preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("");
        const userAgentBox       = pageDocument.getElementById("modifyheaders-listbox");

        var appName        = null;
        var appVersion     = null;
        var description    = null;
        var listItem       = null;
        var platform       = null;
        var userAgent      = null;
        var userAgentCount = 0;

        // If the user agents count preference is set
        if(preferencesService.prefHasUserValue("modifyheaders.user.agents.count"))
        {
            userAgentCount = preferencesService.getIntPref("modifyheaders.user.agents.count");
        }

        // Loop through the previous user agents
        for(var i = 1; i <= userAgentCount; i++)
        {
            appName     = "modifyheaders." + i + ".appname";
            appVersion  = "modifyheaders." + i + ".appversion";
            description = "modifyheaders." + i + ".description";
            platform    = "modifyheaders." + i + ".platform";
            userAgent   = "modifyheaders." + i + ".useragent";

            modifyheaders_optionsDataString[appName]     = "";
            modifyheaders_optionsDataString[appVersion]  = "";
            modifyheaders_optionsDataString[description] = "";
            modifyheaders_optionsDataString[platform]    = "";
            modifyheaders_optionsDataString[userAgent]   = "";
        }

        userAgentCount = userAgentBox.getRowCount();

        // Loop through the possible user agents
        for(i = 1; i <= userAgentCount; i++)
        {
            appName     = "modifyheaders." + i + ".appname";
            appVersion  = "modifyheaders." + i + ".appversion";
            description = "modifyheaders." + i + ".description";
            listItem    = userAgentBox.getItemAtIndex(i - 1);
            platform    = "modifyheaders." + i + ".platform";
            userAgent   = "modifyheaders." + i + ".useragent";

            // If the list item has an app name attribute
            if(listItem.hasAttribute("appname"))
            {
                modifyheaders_optionsDataString[appName] = modifyheaders_trim(listItem.getAttribute("appname"));
            }

            // If the selected item has an app version attribute
            if(listItem.hasAttribute("appversion"))
            {
                modifyheaders_optionsDataString[appVersion] = modifyheaders_trim(listItem.getAttribute("appversion"));
            }

            // If the selected item has a platform attribute
            if(listItem.hasAttribute("platform"))
            {
                modifyheaders_optionsDataString[platform] = modifyheaders_trim(listItem.getAttribute("platform"));
            }

            modifyheaders_optionsDataString[description] = modifyheaders_trim(listItem.label);
            modifyheaders_optionsDataString[userAgent]   = modifyheaders_trim(listItem.value);
        }

        modifyheaders_optionsDataInteger["modifyheaders.user.agents.count"] = userAgentCount;
    }
}

// Views the default user agent
function modifyheaders_viewDefault()
{
    window.openDialog("chrome://modifyheaders/content/options/dialogs/user_agent.xul", "modifyheaders-user-agent-dialog", "centerscreen,chrome,modal", "default");
}