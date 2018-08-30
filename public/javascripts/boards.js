function displayPersonalBoards(boards, personalBoards) {
    let personals = boards.filter(function(b) {
        return b.teamId == null;
    });
    let p_temp = ``;
    for(let i = 0; i < personals.length; ++i) {
        p_temp += `<div class="board-item board-box" data-id=${personals[i].id}>${personals[i].title}</div>`;
    }
    $(p_temp).insertBefore(personalBoards.find(".create-board-item"));
}

function displayTeamBoards(teams, teamBoards, boardTeamEntry) {
    let temp = ``;
    for(let i = 0; i < teams.length; ++i) {
        boardTeamEntry.append(`<option value=${teams[i].teamName}>${teams[i].teamName}</option>`);
        temp += `<div class="row team-boards-row" data-name="${teams[i].teamName}" data-id=${teams[i].teamId}>
                    <i class="fas fa-users"></i> <h5>${teams[i].teamName}</h5> <br>`;
        for(let j = 0; j < teams[i].boards.length; ++j) {
            temp += `<div class="board-item board-box" data-id=${teams[i].boards[j].id}>${teams[i].boards[j].title}</div>`;
        }
        temp += `<div class="create-board-item board-box"><p>Create new board...</p></div>
            </div>`;
    }
    teamBoards.append(temp);
}

function displayAllBoards(response, personalBoards, teamBoards, boardTeamEntry) {
    let personals = response.find(function(o) {
        return o.teamId == null;
    });
    if(personals)
        displayPersonalBoards(personals.boards, personalBoards);
    let teams = response.filter(function(o) {
        return o.teamId != null;
    });
    displayTeamBoards(teams, teamBoards, boardTeamEntry);
}

function getAllBoards(personalBoards, teamBoards, boardTeamEntry) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/boards/all",
            success: function(response) {
                for(let i = 0; i < response.length; ++i) {
                    if(response[i].boards[0] == null)
                        response[i].boards = [];
                }
                displayAllBoards(response, personalBoards, teamBoards, boardTeamEntry);
                let all_boards = [];
                for(let i = 0; i < response.length; ++i) {
                    all_boards = all_boards.concat(response[i].boards);
                }
                resolve(all_boards);
            },
            error: function(thrown) {
                resolve([]);
            }  
        });
    });
    
}

function createTeam(name) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/teams/",
            method: "POST",
            data: {name: name},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function getTeamId(team_name) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/teams/id/" + team_name,
            success: function(response) {
                resolve(response[0].id);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function sendCreateBoardRequest(data) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/boards/",
            method: "POST",
            data: data,
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function createBoard(board_name, team_name) {
    return new Promise(function(resolve, reject) {
        if(team_name.toLowerCase() == "no team") {
            sendCreateBoardRequest({name: board_name}).then(function(created) {
                resolve(created);
            });
        }
        else {
            getTeamId(team_name).then(function(id) {
                sendCreateBoardRequest({name: board_name, teamId: id}).then(function(created) {
                    resolve(created);
                });
            });
        }
    });
}

$(function() {
    //const header = $("#header");
    const linktohome = $("#linktohome");
    const boardPage = $("#board-page");
    const searchbar = $("#searchbar");
    const matchList = $("#match-list");
    const recentBoards = boardPage.find("#recently-viewed-boards-row");
    const personalBoards = boardPage.find("#personal-boards-row");
    const teamBoards = boardPage.find("#team-rows-container");
    const createTeamBtn = boardPage.find("#create-new-team-link");
    const createTeamText = createTeamBtn.find("p");
    const createTeamPopup = boardPage.find("#create-new-team-popup");
    const createTeamName = createTeamPopup.find("#new-team-name");
    const createTeamDesc = createTeamPopup.find("#new-team-desc");
    const addBoardModalContainer = boardPage.find("#add-board-modal-container");
    const addBoardModal = addBoardModalContainer.find("#add-board-modal");
    const addBoardForm = addBoardModal.find("#add-board-form");
    const createBoardBtn = addBoardModal.find("#create-board-btn");
    const boardTitleEntry = addBoardModal.find("#board-title-entry");
    const boardTeamEntry = addBoardModal.find("#team-dropdown");
    const finishTeamCreationBtn = createTeamPopup.find("#create-new-team-btn");
    let boards = [];

    searchbar.keyup(function() {
        matchList.find(".match").remove();
        let query = $(this).val();
        let matches = boards.filter(function(b) {
            return b.title.includes(query);
        });
        if(matches.length > 0) {
            let temp = ``;
            for(let i = 0; i < matches.length; ++i) {
                temp += `<div class="match" data-index=${boards.indexOf(matches[i])}>${matches[i].title}</div>`
            }
            matchList.append(temp);
            matchList.removeClass("hidden");
        }
        else {
            matchList.addClass("hidden");
        }
    });

    $("body").on("click", ".match", function() {
        openBoard(boards[$(this).attr("data-index")].id);
        searchbar.val("");
        searchbar.blur();
        matchList.addClass("hidden");
    });

    getAllBoards(personalBoards, teamBoards, boardTeamEntry).then(function(resolve) {
        boards = resolve;
        linktohome.addClass("hidden");
        recentBoards.find(".board-item").remove();
        displayMostRecentBoards();
    });
    //header.removeClass("hidden");
   

    function openBoard(board_id) {
        window.location.pathname = "lists/" + board_id;
       // renderLists(board);
    }

    boardPage.on("click", ".board-item", function() {
        openBoard($(this).attr("data-id"));
    });
    
    function hideCreateTeamPopup() {
        createTeamPopup.addClass("hidden");
        createTeamName.val("");
        createTeamDesc.val("");
        finishTeamCreationBtn.removeClass("btn-ready");
    }

    boardPage.click(function(e) {
        if(!($(e.target).is(createTeamPopup) || $(e.target).is(createTeamBtn) || $(e.target).is(createTeamText) || $(e.target).parent().is(createTeamPopup) || 
            $(e.target).parent().parent().is(createTeamPopup))) {
            hideCreateTeamPopup();
        }
    });

    createTeamBtn.click(function() {
        createTeamPopup.removeClass("hidden");
        createTeamName.focus();
    });

    createTeamPopup.find("#create-team-close").click(hideCreateTeamPopup);

    function hideAddBoardModal() {
        addBoardModalContainer.addClass("hidden");
        boardTitleEntry.val("");
    }

    addBoardModal.find("#add-board-close").click(hideAddBoardModal);
    
    boardPage.on("click", ".create-board-item", function() {
        addBoardModalContainer.removeClass("hidden");
        let teamname = $(this).parent().attr("data-name");
        if(teamname) {
            boardTeamEntry.val(teamname);
        }
        else
            boardTeamEntry.val("No team");
        //
        boardTitleEntry.focus();
    });

    addBoardModalContainer.click(function(e) {
        if($(e.target).is(addBoardModalContainer))
            hideAddBoardModal();
    });

    boardTitleEntry.keyup(function() {
        if($(this).val() != "")
            createBoardBtn.addClass("btn-ready");
        else {
            createBoardBtn.removeClass("btn-ready");
        }
    });

    addBoardForm.on("submit", function(e) {
        e.preventDefault();
        if(boardTitleEntry.val() != "" && boardTeamEntry.val() != "") {
            let board_name = boardTitleEntry.val();
            let team_name = $("#team-dropdown option:selected").text();
            createBoard(board_name, team_name).then(function(created) {
                boards.push(created);
                let temp = `<div class="board-item board-box" data-id=${created.id}>${created.title}</div>`;
                if(team_name.toLowerCase() == "no team") {
                    $(temp).insertBefore(personalBoards.find(".create-board-item"));
                }
                else {
                    $(temp).insertBefore(teamBoards.find("[data-name='" + team_name + "']").find(".create-board-item"));
                }
                hideAddBoardModal();
            });
          
        }
    });

    createTeamName.keyup(function() {
        if($(this).val() != "")
            finishTeamCreationBtn.addClass("btn-ready");
        else {
            finishTeamCreationBtn.removeClass("btn-ready");
        }
    });

    finishTeamCreationBtn.click(function() {
        if(createTeamName.val() != "") {
            let team_name = createTeamName.val();
            let team_desc = createTeamDesc.val();
            createTeam(team_name).then(function(team) {
                let temp = $(`<div class="row team-boards-row" data-name="${team.name}" data-id=${team.id}>
                <i class="fas fa-users"></i> <h5>${team.name}</h5> <br>
                <div class="create-board-item board-box"><p>Create new board...</p></div>
                </div>`)
                teamBoards.append(temp);
                boardTeamEntry.append(`<option value=${team.name}>${team.name}</option>`)
                hideCreateTeamPopup();
            });/*
            teams.push({
                name: team_name,
                description: team_desc,
                members: [],
                boards: [],
            });*/

          
        }
    });

    function displayMostRecentBoards() {
        let copy = boards.slice(0);
        copy.sort(function(a, b) {
            return a.lastViewed < b.lastViewed;
        });
        let topFour = copy.slice(0, 4);
        let temp = ``;
        for(let i = 0; i < topFour.length; ++i) {
            temp += `<div class="board-item board-box" data-id="${topFour[i].id}">${topFour[i].title}</div>`;
        }
        recentBoards.append(temp);
    }
});