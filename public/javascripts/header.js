$(function() {
    const header = $("#header");
    const linktohome = $("#linktohome");
    const siteTitle = $("#header h3");
    const notificationsBtn = $("#notifications-btn");
    const notificationsPopup = $("#notifications-popup");
    const searchbar = $("#searchbar");
    const searchIcon = $("#search-icon");
    const matchList = $("#match-list");

    $("body").click(function(e) {
        if(!$(e.target).is(notificationsPopup) && !$(e.target).is(notificationsBtn)) {
            notificationsPopup.addClass("hidden");
        }
        if(!$(e.target).is(searchbar) && !($(e.target).is(searchIcon))) {
            matchList.addClass("hidden");
        }
    });

    notificationsBtn.click(function() {
        notificationsPopup.toggleClass("hidden");
    });
    
    linktohome.click(function() {
        window.location.pathname = "boards";
    });
    siteTitle.click(function() {
        window.location.pathname = "boards";
    });
});

