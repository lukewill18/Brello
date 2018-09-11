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
                    <i class="fas fa-users"></i> <h5>${teams[i].teamName}</h5> <button class="btn btn-info add-members-btn">Add members</button><br>`;
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

function getRecentBoards() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/boards/recent",
            success: function(response) {
               resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
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

function findUsersWithName(name, team_members) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/users/search?name=" + name.toString() + "&exclude=" + team_members.join(","),
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function getTeamMembers(teamId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/teams/" + teamId.toString() + "/users",
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function inviteUserToTeam(userId, teamId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/teams/" + teamId.toString() + "/invitation",
            method: "POST",
            data: {userId},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function getTeamBoards(teamId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/boards/team/" + teamId.toString(),
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
    const linktohome = $("#linktohome");
    const boardPage = $("#board-page");
    const recentBoards = boardPage.find("#recently-viewed-boards-row");
    const personalBoards = boardPage.find("#personal-boards-row");
    const teamBoards = boardPage.find("#team-rows-container");
    const createTeamBtn = boardPage.find("#create-new-team-link");
    const createTeamText = createTeamBtn.find("p");
    const createTeamPopup = boardPage.find("#create-new-team-popup");
    const createTeamName = createTeamPopup.find("#new-team-name");
    const addTeamMemberModalContainer = boardPage.find("#add-team-member-modal-container");
    const addTeamMemberModal = addTeamMemberModalContainer.find("#add-team-member-modal");    
    const teamMemberInput = addTeamMemberModal.find("#team-member-input");
    const teamMemberList = addTeamMemberModal.find("#team-member-list");
    const userMatchList = addTeamMemberModal.find("#user-match-list");
    const addBoardModalContainer = boardPage.find("#add-board-modal-container");
    const addBoardModal = addBoardModalContainer.find("#add-board-modal");
    const addBoardForm = addBoardModal.find("#add-board-form");
    const createBoardBtn = addBoardModal.find("#create-board-btn");
    const boardTitleEntry = addBoardModal.find("#board-title-entry");
    const boardTeamEntry = addBoardModal.find("#team-dropdown");
    const finishTeamCreationBtn = createTeamPopup.find("#create-new-team-btn");
    const notificationsPopup = $("#notifications-popup");
    let current_team_members = [];

    window.location.hash = "";
    
    notificationsPopup.on("click", ".accept-btn", function() {
        const invite = $(this).parent();
        const teamName = invite.find(".invite-team-name").text();
        acceptInvite(invite.attr("data-id")).then(function(response) {
            getTeamBoards(response.teamId).then(function(boards) {
                let temp = ``;
                boardTeamEntry.append(`<option value=${teamName}>${teamName}</option>`);
                temp += `<div class="row team-boards-row" data-name="${teamName}" data-id=${response.teamId}>
                            <i class="fas fa-users"></i> <h5>${teamName}</h5> <button class="btn btn-info add-members-btn">Add members</button><br>`;
                for(let i = 0; i < boards.length; ++i) {
                    temp += `<div class="board-item board-box" data-id=${boards[i].id}>${boards[i].title}</div>`;
                }
                temp += `<div class="create-board-item board-box"><p>Create new board...</p></div>
                    </div>`;
                teamBoards.append(temp);
                invite.remove();
            }); 
        });
    });

    getAllBoards(personalBoards, teamBoards, boardTeamEntry).then(function(resolve) {
        linktohome.addClass("hidden");
        recentBoards.find(".board-item").remove();
        return getRecentBoards();
    }).then(function(resolve) {
        displayMostRecentBoards(resolve);
    });

    function openBoard(board_id) {
        window.location.pathname = "boards/" + board_id;
    }

    boardPage.on("click", ".board-item", function() {
        openBoard($(this).attr("data-id"));
    });
    
    function hideCreateTeamPopup() {
        createTeamPopup.addClass("hidden");
        createTeamName.val("");
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

    addTeamMemberModalContainer.click(function(e) {
        if($(e.target).is(addTeamMemberModalContainer))
            hideAddTeamMemberModal();
    });

    function displayTeamMembers(members) {
        teamMemberList.find(".team-member").remove();
        let temp = ``;
        for(let i = 0; i < members.length; ++i) {
            temp += `<li class="team-member" data-id=${members[i].id}>${members[i].name}`;
            if(members[i].invited)
                temp += ` (pending)`;
            temp += `</li>`;
        }
        teamMemberList.append(temp);
    }

    function showAddTeamMemberModal(teamId) {
        getTeamMembers(teamId).then(function(members) {
            addTeamMemberModal.attr("data-id", teamId);
            displayTeamMembers(members);
            addTeamMemberModalContainer.removeClass("hidden");
            current_team_members = members.map(function(m) {
                return m.id;
            });
            teamMemberInput.val("");
            teamMemberInput.focus();
        });
    }

    function displayMatchingUsers(users) {
        userMatchList.find(".user-match").remove();
        let temp = ``;
        for(let i = 0; i < users.length; ++i) {
            temp += `<li class="user-match" data-id=${users[i].id}>${users[i].name}</li>`
        }
        userMatchList.append(temp);
    }  

    userMatchList.on("click", ".user-match", function() {
        const name = $(this).text();
        inviteUserToTeam($(this).attr("data-id"), addTeamMemberModal.attr("data-id")).then(function(response) {
            teamMemberList.append(`<li class="team-member" data-id=${addTeamMemberModal.attr("data-id")}>${name} (pending)</li>`);
            userMatchList.find(".user-match").remove();
            teamMemberInput.val("");
            teamMemberInput.focus();
            current_team_members.push(response.targetId);
        });
    });
    
    teamMemberInput.keyup(function(e) {
        const search = $(this).val();
        if(search.trim() === "")
            userMatchList.find(".user-match").remove();
        else {
            findUsersWithName(search, current_team_members).then(function(users) {
                displayMatchingUsers(users);
            });
        }
    });

    function hideAddTeamMemberModal() {
        addTeamMemberModalContainer.addClass("hidden");
    }

    boardPage.on("click", ".add-members-btn", function() {
        const teamId = $(this).parent().attr("data-id");
        showAddTeamMemberModal(teamId);
    });

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
            createTeam(team_name).then(function(team) {
                let temp = $(`<div class="row team-boards-row" data-name="${team.name}" data-id=${team.id}>
                <i class="fas fa-users"></i> <h5>${team.name}</h5> <button class="btn add-members-btn">Add members</button><br>
                <div class="create-board-item board-box"><p>Create new board...</p></div>
                </div>`)
                teamBoards.append(temp);
                boardTeamEntry.append(`<option value=${team.name}>${team.name}</option>`)
                hideCreateTeamPopup();
            });
        }
    });

    function displayMostRecentBoards(boards) {
        let temp = ``;
        for(let i = 0; i < boards.length; ++i) {
            temp += `<div class="board-item board-box" data-id="${boards[i].id}">${boards[i].title}</div>`;
        }
        recentBoards.append(temp);
    }
});