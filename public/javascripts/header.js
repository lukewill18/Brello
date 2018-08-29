$(function() {
    const header = $("#header");
    const linktohome = $("#linktohome");
    const siteTitle = $("#header h3");
    const notificationsBtn = $("#notifications-btn");
    const notificationsPopup = $("#notifications-popup");
    const searchbar = $("#searchbar");
    const matchList = $("#match-list");

    searchbar.keydown(function() {
        matchList.find(".match").remove();
        let query = $(this).val();
        let matches = boards.filter(function(b) {
            return b.name.includes(query);
        });
        if(matches.length > 0) {
            let temp = ``;
            for(let i = 0; i < matches.length; ++i) {
                temp += `<div class="match" data-index=${boards.indexOf(matches[i])}>${matches[i].name}</div>`
            }
            matchList.append(temp);
            matchList.removeClass("hidden");
        }
        else {
            matchList.addClass("hidden");
        }
    });

    $("body").on("click", ".match", function() {
        openBoard(boards[$(this).attr("data-index")]);
        searchbar.val("");
        searchbar.blur();
        matchList.addClass("hidden");
    });
    
    $("body").click(function(e) {
        if(!$(e.target).is(notificationsPopup) && !$(e.target).is(notificationsBtn)) {
            notificationsPopup.addClass("hidden");
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

