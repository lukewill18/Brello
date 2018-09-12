function search(query) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/search?query=" + query,
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function getInvitations() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/teams/invitations",
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function acceptInvite(teamId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/teams/" + teamId.toString() + "/users",
            method: "PATCH",
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function declineInvite(teamId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/teams/" + teamId.toString() + "/invitation",
            method: "DELETE",
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function getBoardsForPopup() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/boards/all/",
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
    const boardsBtn = $("#boards-btn")
    const boardsPopup = $("#board-popup");

    function displayInvitations(invitations) {
        notificationsPopup.find(".team-invitation").remove();
        if(invitations.length > 0) {
            let temp = ``;
            for(let i = 0; i < invitations.length; ++i) {
                temp += `<div class="team-invitation" data-id=${invitations[i].teamId}><p>${invitations[i].name} has invited you to join the team "<span class="invite-team-name">${invitations[i].teamname}</span>"</p>
                            <button class="btn btn-info accept-btn">Accept</button><button class="btn btn-offer decline-btn">Decline</button>
                        </div>`;
            }   
            notificationsBtn.addClass("notifications-unread");
            notificationsPopup.append(temp);
        }
    }

    getInvitations().then(function(response) {
        displayInvitations(response);
    });

    notificationsPopup.on("click", ".decline-btn", function() {
        const invite = $(this).parent();
        declineInvite(invite.attr("data-id")).then(function(response) {
            invite.remove();
        });
    });

    function fillPopup(teams) {
        boardsPopup.children().remove();
        let temp = ``;
        for(let i = 0; i < teams.length; ++i) {
            if(teams[i].boards[0] === null) continue;
            temp += !teams[i].isPersonal ? `<i class="fas fa-users"></i><h4>${teams[i].teamName}</h4><br>` : `<i class="fas fa-user"></i><h4>Personal Boards</h4><br>`;
            for(let j = 0; j < teams[i].boards.length; ++j) {
                temp += `<div class="board-item board-popup-item" data-id=${teams[i].boards[j].id}>${teams[i].boards[j].title}</div>`;
            }
        }
        boardsPopup.append(temp);
    }

    boardsBtn.click(function() {
        boardsPopup.toggleClass("hidden");
        if(!boardsPopup.hasClass("hidden")) {
            getBoardsForPopup().then(function(teams) {
                fillPopup(teams);
            });
        }
    });

    $("body").click(function(e) {
        if(!$(e.target).is(notificationsPopup) && !$(e.target).is(notificationsBtn) && !$(e.target).parent().is(notificationsPopup) && !$(e.target).parent().parent().is(notificationsPopup)) {
            notificationsPopup.addClass("hidden");
        }
        if(!$(e.target).is(searchbar) && !($(e.target).is(searchIcon)) && !($(e.target).is(matchArea)) && !($(e.target).parent().is(matchArea))) {
            matchArea.addClass("hidden");
        }
        if(!$(e.target).is(boardsPopup) && !$(e.target).is(boardsBtn) && !$(e.target).parent().is(boardsPopup)) {
            boardsPopup.addClass("hidden");
        }
    });

    function openBoard(board_id) {
        window.location.pathname = "boards/" + board_id;
    }

    $("body").on("click", ".board-item, .board-link", function() {
        openBoard($(this).attr("data-id"));
    });


    function displayBoardMatches(boards) {
        if(boards.length === 0) {
            boardMatches.addClass("hidden");
        }
        else {
            let temp = ``;
            for(let i = 0; i < boards.length; ++i) {
                temp += `<div class="match board-match" data-id=${boards[i].match.id}>${boards[i].match.title}</div>`;
            }
            boardMatches.append(temp);
            boardMatches.removeClass("hidden");
        }
    }

    function displayCardMatches(cards) {
        if(cards.length === 0) {
            cardMatches.addClass("hidden");
        }
        else {
            let temp = ``;
            for(let i = 0; i < cards.length; ++i) {
                temp += `<div class="match card-match" data-id=${cards[i].match.id} data-board-id=${cards[i].match.boardId}>${cards[i].match.name} 
                <span class="card-match-context"> from <span class="card-match-context-board-title">${cards[i].match.boardTitle}</span></span></div>`;
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
                if(results.boards.length === 0 && results.cards.length === 0)
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
        notificationsBtn.removeClass("notifications-unread");
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

