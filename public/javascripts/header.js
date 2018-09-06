function search(query) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/search?query=" + query,
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

$(function() {
    const header = $("#header");
    const linktohome = $("#linktohome");
    const siteTitle = $("#header h3");
    const notificationsBtn = $("#notifications-btn");
    const notificationsPopup = $("#notifications-popup");
    const searchbar = $("#searchbar");
    const searchIcon = $("#search-icon");
    const matchArea = $("#match-area");
    const boardMatches = matchArea.find("#board-matches");
    const cardMatches = matchArea.find("#card-matches");
    const userIcon = $("#header-user-icon");

    $("body").click(function(e) {
        if(!$(e.target).is(notificationsPopup) && !$(e.target).is(notificationsBtn)) {
            notificationsPopup.addClass("hidden");
        }
        if(!$(e.target).is(searchbar) && !($(e.target).is(searchIcon)) && !($(e.target).is(matchArea)) && !($(e.target).parent().is(matchArea))) {
            matchArea.addClass("hidden");
        }
    });

    function displayBoardMatches(boards) {
        if(boards === null) {
            boardMatches.addClass("hidden");
        }
        else {
            let temp = ``;
            for(let i = 0; i < boards.length; ++i) {
                temp += `<div class="match board-match" data-id=${boards[i].id}>${boards[i].title}</div>`;
            }
            boardMatches.append(temp);
            boardMatches.removeClass("hidden");
        }
    }

    function displayCardMatches(cards) {
        if(cards === null) {
            cardMatches.addClass("hidden");
        }
        else {
            let temp = ``;
            for(let i = 0; i < cards.length; ++i) {
                temp += `<div class="match card-match" data-id=${cards[i].id} data-board-id=${cards[i].boardId}>${cards[i].name} 
                <span class="card-match-context"> from <span class="card-match-context-board-title">${cards[i].boardTitle}</span></span></div>`;
            }
            cardMatches.append(temp);
            cardMatches.removeClass("hidden");
        }
    }

    searchbar.on("keyup click", function() {
        const query = $(this).val();
        if(query.trim() === "")
            matchArea.addClass("hidden");
        else {
            search(query).then(function(results) {
                if(results.boards === null && results.cards === null)
                    matchArea.addClass("hidden");
                else {
                    matchArea.find(".match").remove();
                    matchArea.removeClass("hidden");
                    displayBoardMatches(results.boards);
                    displayCardMatches(results.cards);
                }   
            });
        }
    });

    $("body").on("click", ".match", function() {
        searchbar.val("");
        searchbar.blur();
        matchArea.addClass("hidden");
        
        if($(this).hasClass("board-match")) {
            window.location.pathname = "boards/" + $(this).attr("data-id");
        }
        else {
            window.location.hash = "#" + $(this).attr("data-id");
            window.location.pathname = "boards/" + $(this).attr("data-board-id");
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
    userIcon.click(function() {
        window.location.pathname = "";
    });
    
});

