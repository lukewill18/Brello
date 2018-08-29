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

function loadPersonalBoards(personalBoards) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/boards/personal",
            success: function(response) {
                if(response.hasOwnProperty("error")) {
                    resolve([]);
                    return;
                }
                displayPersonalBoards(response, personalBoards);
                resolve(response);
            }
        });
    });
}

function getTeamBoards(team_id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/boards/team/" + team_id.toString(),
            success: function(response) {
                resolve(response);
            }
        });
    });
}

function loadTeamBoards(teamBoards) {
    return new Promise(function(resolve, reject) {
        let temp = ``;
        $.ajax({
            url: "http://localhost:3000/teams/",
            success: function(response) {
                let promises = [];
                for(let i = 0; i < response.length; ++i) {
                    promises.push(getTeamBoards(response[i].id));
                }
                Promise.all(promises).then(function(team_boards_list) {
                    for(let i = 0; i < team_boards_list.length; ++i) {
                        temp += `<div class="row team-boards-row" data-name="${response[i].name}" data-id=${response[i].id}}>
                        <i class="fas fa-users"></i> <h5>${response[i].name}</h5> <br>`
                        for(let j = 0; j < team_boards_list[i].length; ++j) {
                            temp += `<div class="board-item board-box" data-id=${team_boards_list[i][j].id}>${team_boards_list[i][j].title}</div>`;
                        }
                        temp += `<div class="create-board-item board-box"><p>Create new board...</p></div>
                        </div>`
                    }
                    teamBoards.append(temp);
                    let boards = [];
                    for(let i = 0; i < team_boards_list.length; ++i) {
                        boards = boards.concat(team_boards_list[[i]]);
                    }
                    resolve(boards);
                });
            }
        });
    });
}

function getAllBoards(recentBoards, personalBoards, teamBoards) {
    return new Promise(function(resolve, reject) {
        let promises = [];
        promises.push(loadPersonalBoards(personalBoards));
        promises.push(loadTeamBoards(teamBoards));
        Promise.all(promises).then(function(resolves) {
            resolve(resolves[0].concat(resolves[1]));
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
            url: "http://localhost:3000/teams/" + team_name,
            success: function(response) {
                resolve(response);
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
                console.log(id);
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
    let new_lists = 0; 
    let boards = [];

    getAllBoards(recentBoards, personalBoards, teamBoards).then(function(resolve) {
        console.log(resolve);
        boards = resolve;
        linktohome.addClass("hidden");
        new_lists = 0;
        recentBoards.find(".board-item").remove();
        displayMostRecentBoards();
    });
    //header.removeClass("hidden");
   

    function openBoard(board) {
        current_board = board;
        window.location.hash = "#list-view";
       // renderLists(board);
    }

    boardPage.on("click", ".board-item", function() {
        let name = $(this)[0].textContent;
        let board = boards.find(function(b) {
            return b.name == name;
        });
        openBoard(board);
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
        if(boardTitleEntry.val() != "") {
            let board_name = boardTitleEntry.val();
            let team_name = boardTeamEntry.val();
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