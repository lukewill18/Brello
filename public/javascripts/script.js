function swap(arr, ind1, ind2) {
    let copy = arr[ind1];
    arr[ind1] = arr[ind2];
    arr[ind2] = copy;
}

function switchPage(toHide, toShow) {
    toHide.addClass("hidden");
    toHide.removeClass("shown");
    toShow.removeClass("hidden");
    toShow.addClass("shown");
}

function generateList(listname, list_id, cards) {
    let temp = `<div class="list" id="new-list-${list_id}">
                    <h6 class="list-title draggable">${listname}</h6>
                    <div class="add-card">+ Add a card</div>
                    <div class="add-card-template hidden">
                        <textarea class="card-entry" rows="4" cols="50" placeholder="Enter a title for this card..."></textarea>
                        <button class="btn add-card-btn">Add Card</button> <i class="fas fa-times close-template"></i>
                    </div>`
    for(let i = 0; i < cards.length; ++i) {
        temp += `<div class="card draggable">${cards[i].name}</div>`
    }
    temp += `</div>`
    return temp;
}

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

function displayTeamBoards(boards, teamBoards) {
    let teams = boards.filter(function(b) {
        return b.teamId != null;
    });
    for(let i = 0; i < teams.length; ++i) {
        let b = teamBoards.find(`.team-boards-row[data-id="${teams[i].teamId}"]"`);
        let temp = `<div class="board-item board-box" data-id=${teams[i].id}>${teams[i].title}</div>`
        if(b.length > 0) {
            $(temp).insertBefore(b.find(".create-board-item"));
        }
        else {
            let row_temp = `<div class="row team-boards-row" data-id=${teams[i].teamId}}>
                                <i class="fas fa-users"></i> <h5>${"TEAMNAME"}</h5> <br>
                                <div class="create-board-item board-box"><p>Create new board...</p></div>
                            </div>`;
            teamBoards.append(row_temp);
            $(temp).insertBefore($(row_temp).find(".create-board-item"));
        }
    }
}

function displayAllBoards(boards, recentBoards, personalBoards, teamBoards) {
    displayPersonalBoards(boards, personalBoards);
    displayTeamBoards(boards, teamBoards);
}

function getAllBoards(recentBoards, personalBoards, teamBoards) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/boards/",
            success: function(response) {
                if(response.hasOwnProperty("error")) {
                    resolve();
                    return;
                }
                displayAllBoards(response, recentBoards, personalBoards, teamBoards);
                resolve();
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
    const matchList = $("#match-list");

    const loginPage = $("#login-page");
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
    
    const listPage = $("#list-page")
    const cardModalContainer = listPage.find("#card-modal-container");
    const cardModal = cardModalContainer.find("#card-modal");
    const cardModalName = cardModal.find("#card-modal-name");
    const cardModalList = cardModal.find("#modal-list-name");
    const cardModalDescEntry = cardModal.find("#modal-description-entry");
    const cardModalDesc = cardModal.find("#modal-description");
    const cardModalSaveDescBtn = cardModal.find("#modal-save-desc-btn");
    const labelContainer = cardModal.find("#label-container");
    const labelEntry = labelContainer.find("#label-entry");
    const cardModalCommentEntry = cardModal.find("#modal-comment-entry");
    const cardModalSaveCommentBtn = cardModal.find("#modal-save-comment-btn");
    const commentList = cardModal.find("#modal-comments");
    const listList = listPage.find("#list-list");
    const listContainer = listList.find("#lists-container");
    const addListBtn = listPage.find("#add-list");
    const addListTemplate = listPage.find("#add-list-template");
    const listEntry = addListTemplate.find("#list-entry");
    const closeListTemplate = addListTemplate.find("#close-list-template");
    let dragging_card = false;
    let new_lists = 0;
    let currentCardTemplate;
    let showing_list_template = false;
    let dragging = false;
    let current_board;
    let current_card;
    let clickX = 0;
    let teams = [];
    let boards = [];

    window.location.hash = "#login";

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

    notificationsBtn.click(function() {
        notificationsPopup.toggleClass("hidden");
    });

    linktohome.click(function() {
        window.location.hash = "#board-view";
    });
    siteTitle.click(function() {
        window.location.hash = "#board-view";
    });

    function renderLists(board) {
        listContainer.find(".list").remove();
        for(let i = 0; i < board.lists.length; ++i) {
            let l = board.lists[i];
            let temp = ($(generateList(l.name, ++new_lists, l.cards)));
            temp.data("name", l.name);
            listContainer.append(temp);
            card_drag.addContainer(document.querySelector("#new-list-" + new_lists.toString()));
        }   
    }

    function openBoard(board) {
        current_board = board;
        window.location.hash = "#list-view";
        renderLists(board);
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
        if(!$(e.target).is(notificationsPopup)) {
            notificationsPopup.addClass("hidden");
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
        let teamname = $(this).parent().data("name");
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
            boards.push({
                name: board_name,
                team: team_name,
                lists: [],
                lastViewed: Date.now()
            });
            let temp = `<div class="board-item board-box">${board_name}</div>`;
            if(team_name.toLowerCase() == "no team") {
                $(temp).insertBefore(personalBoards.find(".create-board-item"));
            }
            else {
                $(temp).insertBefore(teamBoards.find("[data-name='" + team_name + "']").find(".create-board-item"));
            }
            hideAddBoardModal();
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
            teams.push({
                name: team_name,
                description: team_desc,
                members: [],
                boards: [],
            });

            let temp = $(`<div class="row team-boards-row" data-name=${team_name}>
                                <i class="fas fa-users"></i> <h5>${team_name}</h5> <br>
                                <div class="create-board-item board-box"><p>Create new board...</p></div>
                            </div>`)
            temp.data("name", team_name);
            teamBoards.append(temp);
            boardTeamEntry.append(`<option value=${team_name}>${team_name}</option>`)
            hideCreateTeamPopup();
        }
    });

    let card_drag = new Draggable.Sortable(document.querySelectorAll(".list"), {
        draggable: '.card',
        mirror: {constrainDimensions: true}
        });
    card_drag.on("drag:start", function() {
        dragging_card = true;
    });
    card_drag.on("drag:stop", function(e) {
        //update cards array
        dragging_card = false;
    });
    card_drag.on("sortable:stop", function(e) {
        let old_list_name = $(e.oldContainer).data("name");
        let new_list_name = $(e.newContainer).data("name");
        let old_list = current_board.lists.find(function(l) {
            return l.name == old_list_name;
        });
        if(old_list_name == new_list_name) { // compare id instead when using backend
            swap(old_list.cards, e.newIndex, e.oldIndex);
        }
        else {
            let new_list = current_board.lists.find(function(l) {
                return l.name == new_list_name;
            });
            new_list.cards.splice(e.newIndex, 0, old_list.cards[e.oldIndex]);
            old_list.cards.splice(e.oldIndex, 1);
        }
    });

    new Draggable.Sortable(document.querySelectorAll("#lists-container"), {
     draggable: '.list',
     handle: ".list-title",
     mirror: {constrainDimensions: true}
   }).on("drag:start", function(event) {
        if(dragging_card) {
            event.cancel();
        }
    }).on("sortable:stop", function(e) {
        /*console.log(current_board.lists);
        let old_list = current_board.lists[e.oldIndex];
        console.log(old_list);
        current_board.lists.splice(e.newIndex, 0, old_list);
        let old_list_str = JSON.stringify(old_list);
        console.log(current_board.lists);
        for(let i = 0; i < current_board.lists.length; ++i) {
            if(JSON.stringify(current_board.lists[i]) == old_list_str && i != e.newIndex) {
                current_board.lists.splice(i, 1);
            }
        }
        console.log(current_board.lists);*/
    });

    function hideCardTemplate() {
        currentCardTemplate.siblings(".add-card").removeClass("hidden");
        currentCardTemplate.addClass("hidden");
        currentCardTemplate.find(".card-entry").val("");
        currentCardTemplate.parent().css("padding-bottom", "25px");
        currentCardTemplate = undefined;
    }

    function hideListTemplate() {
        addListTemplate.addClass("hidden");
        addListBtn.removeClass("hidden");
        listEntry.val("");
        showing_list_template = false;
    }

    $("body").click(function(e) {
        if(currentCardTemplate && !e.target.classList.contains("add-card") && !e.target.classList.contains("add-card-template") && !e.target.classList.contains("add-card-btn")
            && !e.target.classList.contains("card-entry")) {
            hideCardTemplate();
        }
        if(showing_list_template && e.target.id != "add-list-template" && e.target.id != "add-list" && e.target.id != "add-list-p" && e.target.id != "add-list-btn" && e.target.id != "list-entry")
            hideListTemplate();
    });

    listList.mousedown(function(e) {
        if(e.target.id == "list-list" || e.target.id == "lists-container") {
            dragging = true;
            clickX = e.pageX;
        }
    });

    $("body").mousemove(function(e) {
        if(dragging) {
            e.preventDefault();
            listList.scrollLeft(listList.scrollLeft() + (clickX - e.pageX)/2);
        }     
    });

    $("body").mouseup(function() {
        dragging = false;
    });

    addListBtn.click(function() {
        $(this).addClass("hidden");
        addListTemplate.removeClass("hidden");
        listEntry.focus();
        showing_list_template = true;
    });

    closeListTemplate.click(function() {
        hideListTemplate();
    });

    $("#add-list-form").on("submit", function(e) {
        e.preventDefault();
        let listname = listEntry.val();
        if(listname.trim() != "") {
            current_board.lists.push({
                name: listname,
                cards: []
            });
            let temp = $(generateList(listname, ++new_lists, []));
            temp.data("name", listname);
            listContainer.append(temp);
            listEntry.val("");
            listEntry.focus();
            card_drag.addContainer(document.querySelector("#new-list-" + new_lists.toString()));
            listList.scrollLeft(listContainer.width());
        }
    });

    listContainer.on("click", ".add-card", function() {
        if(currentCardTemplate)
            hideCardTemplate();
        $(this).addClass("hidden");
        currentCardTemplate = $(this).siblings(".add-card-template");
        currentCardTemplate.removeClass("hidden");
        currentCardTemplate.children(".card-entry").focus();
        currentCardTemplate.parent().css("padding-bottom", "100px");
    });

    listContainer.on("click", ".close-template", hideCardTemplate);

    function submitCardForm(cardname) {
        if(cardname.trim() != "") {
            let entry = currentCardTemplate.find(".card-entry");
            entry.val("");
            entry.focus();
            currentCardTemplate.parent().append(`<div class="card draggable">${cardname}</div>`);
            let listname = currentCardTemplate.parent().data("name");
            let list = current_board.lists.find(function(l) {
                return l.name == listname;
            });
            list.cards.push({
                name: cardname,
                description: "",
                labels: [],
                comments: [] 
            });
        }
    }

    listContainer.on("click", ".add-card-btn", function() {
        submitCardForm($(this).siblings(".card-entry").val());
    });

    listContainer.on("keydown", ".card-entry", function(e) {
        if(e.keyCode == 13) {
            e.preventDefault();
            submitCardForm($(this).val());
        }
        else if(e.keyCode == 27)
            hideCardTemplate();
    });

    listContainer.on("keyup", ".card-entry", function(e) {
        if(e.keyCode == 13)
            $(this).val("");
    });

    function showCardModalDesc() {
        if(current_card.description != "") {
            cardModalDesc.text(current_card.description);
            cardModalDescEntry.addClass("hidden");
            cardModalSaveDescBtn.addClass("hidden");
            cardModalDesc.removeClass("hidden");
        }
        else {
            cardModalDescEntry.val("");
            cardModalDescEntry.removeClass("hidden");
            cardModalSaveDescBtn.removeClass("hidden");
            cardModalDesc.addClass("hidden");
        }
    }
    
    function showCardModalLabels() {
        labelContainer.find(".label").remove();
        labelEntry.text("");
        let temp = ``;
        for(let i = 0; i < current_card.labels.length; ++i) {
            temp += `<div class="label"><span class="labelname">${current_card.labels[i]}</span>&ensp;<i class="fas fa-times remove-label"></i></div>`;
        }
        $(temp).insertBefore(labelEntry);
    }

    function showCardModalComments() {
        cardModal.height(650);
        commentList.find(".modal-comment-info").remove();
        cardModalCommentEntry.val("");
        let temp = ``;
        for(let i = 0; i < current_card.comments.length; ++i) {
            temp += generateComment(current_card.comments[i].comment, current_card.comments[i].date);
        }  
        commentList.append(temp);
        cardModal.height(cardModal.height() + commentList.innerHeight());
    }

    function showCardModal(cardname, listname) {
        cardModalContainer.removeClass("hidden");
        cardModal.find(".btn-ready").removeClass("btn-ready");
        cardModalName.text(cardname);
        cardModalList.text(listname);
        current_card = current_board.lists.find(function(l) {
            return l.name == listname;
        }).cards.find(function(c) {
            return c.name == cardname;
        });
        showCardModalDesc();
        showCardModalLabels();
        showCardModalComments();
    }

    function hideCardModal() {
        cardModalContainer.addClass("hidden");
    }

    listList.on("click", ".card", function() {
        showCardModal($(this).text(), $(this).parent().data("name"));
    });

    cardModalContainer.click(function(e) {
        if(e.target.id == "card-modal-container") {
            hideCardModal();
        }
    });

    cardModal.find("#close-card-modal").click(hideCardModal);

    cardModalDescEntry.keydown(function() {
        if($(this).val() != "") {
            cardModalSaveDescBtn.addClass("btn-ready");
        }
        else {
            cardModalSaveDescBtn.removeClass("btn-ready");
        }
    });

    cardModalSaveDescBtn.click(function() {
        let desc = cardModalDescEntry.val();
        current_card.description = desc;
        cardModalDesc.text(desc);
        cardModalDescEntry.addClass("hidden");
        $(this).addClass("hidden");
        cardModalDesc.removeClass("hidden");
    });

    cardModalDesc.click(function() {
        $(this).addClass("hidden");
        cardModalDescEntry.removeClass("hidden");
        cardModalSaveDescBtn.removeClass("hidden");
        cardModalDescEntry.val($(this).text());
    });

    labelContainer.click(function(e) {
        if($(e.target).is(labelContainer)) {
            labelEntry.focus();
        }
    });

    labelEntry.keydown(function(e) {
        if(e.keyCode == 13) {
            e.preventDefault();            
            let label = $(this).text().trim();
            if(label != "" && current_card.labels.indexOf(label) == -1) {
                current_card.labels.push(label);
                $(`<div class="label"><span class="labelname">${label}</span>&ensp;<i class="fas fa-times remove-label"></i></div>`).insertBefore($(this));
                $(this).text("");
            }
        }
        else if(e.keyCode == 8 && $(this).text() == "") {
            let last = labelContainer.find(".label").last();
            if(last.length > 0) {
                last.remove();
                current_card.labels.splice(current_card.labels.indexOf(last.find(".labelname").text()), 1)
            }
        }
        else if(e.keyCode == 27) {
            $(this).blur();
        }
    });

    labelContainer.on("click", ".remove-label", function() {
        $(this).parent().remove();
        current_card.labels.splice(current_card.labels.indexOf($(this).siblings(".labelname").text()), 1)
    });

    function generateComment(comment, date) {
        return `<li class="modal-comment-info">
                    <div class="user-icon modal-user-icon"></div>
                    <h5 class="modal-comment-name">John Doe</h5>
                    <p class="modal-comment-time">${date}</p>
                    <div class="modal-comment"><p>${comment}</p></div>
                    <div class="solid-line"></div>
                </li>`;
    }

    cardModalCommentEntry.keyup(function() {
        if($(this).val() != "")
            cardModalSaveCommentBtn.addClass("btn-ready");
        else
            cardModalSaveCommentBtn.removeClass("btn-ready");
    });

    cardModalSaveCommentBtn.click(function() {
        let comment = cardModalCommentEntry.val();
        if(comment.trim() != "") {
            let date = moment().format('MMMM Do YYYY, h:mm:ss a');
            let temp = $(generateComment(comment, date));
            commentList.prepend(temp);
            cardModal.height(cardModal.height() + temp.innerHeight());
            current_card.comments.unshift({
                comment: comment,
                date: date
            });
            cardModalCommentEntry.val("");
            $(this).removeClass("btn-ready");
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
            temp += `<div class="board-item board-box">${topFour[i].name}</div>`;
        }
        recentBoards.append(temp);
    }

    function switchToBoardPage(current) {
        getAllBoards(recentBoards, personalBoards, teamBoards);
        header.removeClass("hidden");
        linktohome.addClass("hidden");
        new_lists = 0;
        recentBoards.find(".board-item").remove();
        displayMostRecentBoards();
        switchPage(current, boardPage);
    }

    function switchToListPage(current) {
        linktohome.removeClass("hidden");
        hideCardModal();
        switchPage(current, listPage);
        current_board.lastViewed = Date.now();
    }

    $(window).on("hashchange", function() {
        let current = $(".shown");
        if(window.location.hash == "#login") {
            header.addClass("hidden");
            switchPage(current, loginPage);
        }
        if(window.location.hash == "#board-view") {
            switchToBoardPage(current);
        }
        else if(window.location.hash == "#list-view") {
            switchToListPage(current);
        }
    });
});