// Loads the extension home page in a new tab
function modifyheaders_visitHomePage()
{
    const newTab = window.opener.getBrowser().addTab("http://www.garethhunt.com/");

    window.opener.getBrowser().selectedTab = newTab;
    window.close();
}