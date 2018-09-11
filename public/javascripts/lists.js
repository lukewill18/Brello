function addList(listname, boardId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/lists/",
            method: "POST",
            data: {listname: listname, boardId: boardId},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject();
            }
        });
    });
}

function generateList(listname, list_id, cards) {
    let temp = `<div class="list" id="new-list-${list_id}" data-id=${list_id}>
                    <h6 class="list-title draggable">${listname}</h6>
                    <input class="list-title-input hidden" type="text">
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

function createCard(name, listId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/cards/",
            method: "POST",
            data: {name, listId},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject();
            }
        });
    });
}

function getCardInfo(cardId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/cards/" + cardId.toString(),
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject();
            }
        });
    });
}

function changeDescription(description, cardId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/cards/" + cardId.toString() + "/description",
            method: "PATCH",
            data: {description},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject();
            }
        });
    });
}

function createComment(comment, cardId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/cards/" + cardId.toString() + "/comment",
            method: "POST",
            data: {comment},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject();
            }
        });
    });
}

function createLabel(name, cardId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/cards/" + cardId.toString() + "/label",
            method: "POST",
            data: {name},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function removeLabel(labelId, cardId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/cards/" + cardId.toString() + "/label",
            method: "DELETE",
            data: {labelId},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function updateListOrders(listContainer, listList) {
    return new Promise(function(resolve, reject) {
        const list_arr = listContainer.find(".list");
        const boardId = listList.attr("data-board-id");
        let lists = [];
        for(let i = 0; i < list_arr.length; ++i) {
            lists.push($(list_arr[i]).attr("data-id"));
        }
        if(lists.length <= 1) {
            resolve();
            return;
        }
        $.ajax({
            url: "http://localhost:3000/boards/" + boardId.toString() + "/lists",
            method: "PATCH",
            data: {lists},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function updateCardOrders(list, listId) {
    return new Promise(function(resolve, reject) {
        const card_arr = list.children(".card");
        let cards = [];
        for(let i = 0; i < card_arr.length; ++i) {
            cards.push($(card_arr[i]).attr("data-id"));
        }
        if(cards.length <= 1) {
            resolve();
            return;
        }
        $.ajax({
            url: "http://localhost:3000/lists/" + listId.toString() + "/cards",
            method: "PATCH",
            data: {cards},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function updateCardList(oldListId, newListId, cardId) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/cards/" + cardId.toString() + "/list",
            method: "PATCH",
            data: {oldListId, newListId},
            success: function(response) {
                resolve(response);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

function updateListName(listId, listName) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/lists/" + listId.toString(),
            method: "PATCH",
            data: {name: listName},
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
    const notificationsPopup = $("#notifications-popup");
    let dragging_card = false;
    let currentCardTemplate;
    let showing_list_template = false;
    let dragging = false;
    let clickX = 0;
    let updating_list_order = false;
    let updating_card_order = false;
    let label_container_height = 68;

    linktohome.removeClass("hidden");
    notificationsPopup.on("click", ".accept-btn", function() {
        const invite = $(this).parent();
        acceptInvite(invite.attr("data-id")).then(function(response) {
            invite.remove();
        });
    });

    checkHash();

    let card_drag = new Draggable.Sortable(document.querySelectorAll(".list"), {
        draggable: '.card',
        mirror: {constrainDimensions: true}
        });
    card_drag.on("drag:start", function(e) {
        if(updating_card_order)
            e.cancel();
        else
            dragging_card = true;
    });
    card_drag.on("drag:stop", function(e) {
        dragging_card = false;
    });
    card_drag.on("sortable:stop", function(e) {
        updating_card_order = true;
        const old_list_id = $(e.oldContainer).attr("data-id");
        const new_list_id = $(e.newContainer).attr("data-id");
        setTimeout(function() {
            if(new_list_id === old_list_id) {
                updateCardOrders($(e.oldContainer), old_list_id).then(function() {
                    updating_card_order = false;
                });
            }
            else {
                updateCardList(old_list_id, new_list_id, $(e.newContainer).children(".card").eq(e.newIndex).attr("data-id")).then(function() {
                    let promises = [];
                    promises.push(updateCardOrders($(e.oldContainer), old_list_id));
                    promises.push(updateCardOrders($(e.newContainer), new_list_id));
                    Promise.all(promises).then(function() {
                        updating_card_order = false;
                    });
                });
            }
        }, 1);
        
    });
    
    new Draggable.Sortable(document.querySelectorAll("#lists-container"), {
     draggable: '.list',
     handle: ".list-title",
     mirror: {constrainDimensions: true}
    }).on("drag:start", function(event) {
        if(dragging_card || updating_list_order) {
            event.cancel();
        }
    }).on("sortable:stop", function(e) {
        updating_list_order = true;
        setTimeout(function() {
            updateListOrders(listContainer, listList).then(function() {
                updating_list_order = false;
            });
        }, 1);
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
            addList(listname, listList.attr("data-board-id")).then(function(resolve) {
                let temp = $(generateList(resolve.name, resolve.id, []));
                temp.data("name", resolve.name);
                listContainer.append(temp);
                listEntry.val("");
                listEntry.focus();
                card_drag.addContainer(document.querySelector("#new-list-" + (resolve.id).toString()));
                listList.scrollLeft(listContainer.width());
            });
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
            createCard(cardname, currentCardTemplate.parent().attr("data-id")).then(function(created) {
                let entry = currentCardTemplate.find(".card-entry");
                entry.val("");
                entry.focus();
                currentCardTemplate.parent().append(`<div class="card draggable" data-id="${created.id}">${created.name}</div>`);
            });    
        }
    }
    
    listContainer.on("click", ".list-title", function() {
        $(this).addClass("hidden");
        const input = $(this).siblings(".list-title-input");
        input.removeClass("hidden");
        input.val($(this).text());
        input.select();
    });

    function hideListInput(listInput) {
        listInput.val("");
        listInput.addClass("hidden");
        listInput.siblings(".list-title").removeClass("hidden");
    }

    listContainer.on("keydown", ".list-title-input", function(e) {
        const input = $(this);
        if(e.keyCode === 27) {
            hideListInput(input);
        }
        else if(e.keyCode === 13) {
            if(input.val().trim() === "") {
                hideListInput(input);
            }
            else {
                updateListName(input.parent().attr("data-id"), input.val().trim()).then(function(response) {
                    input.siblings(".list-title").text(response.name);
                    hideListInput(input);
                });
            }
        }
    });

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
    
    function resizeModal() {
        let diff = labelContainer.height() - label_container_height;
        if(diff != 0) {
            cardModal.height(cardModal.height() + diff);
            label_container_height = labelContainer.height();
        }
            
    }

    function showCardModalDesc(desc) {
        if(desc != "") {
            cardModalDesc.text(desc);
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
    
    function showCardModalLabels(labels) {
        labelContainer.find(".label").remove();
        labelEntry.text("");
        let temp = ``;
        for(let i = 0; i < labels.length; ++i) {
            temp += `<div class="label" data-id=${labels[i].id}><span class="labelname">${labels[i].name}</span>&ensp;<i class="fas fa-times remove-label"></i></div>`;
        }
        $(temp).insertBefore(labelEntry);
        resizeModal();
    }
    
    function showCardModalComments(comments) {
        commentList.find(".modal-comment-info").remove();
        cardModalCommentEntry.val("");
        let temp = ``;
        for(let i = 0; i < comments.length; ++i) {
            temp += generateComment(comments[i]);
        }  
        commentList.append(temp);
        cardModal.height(cardModal.height() + commentList.innerHeight());
    }
    
    function showCardModal(cardId) {
        getCardInfo(cardId).then(function(cardInfo) {
            cardModalContainer.removeClass("hidden");
            cardModal.find(".btn-ready").removeClass("btn-ready");
            cardModal.attr("data-id", cardId);
            cardModalName.text(cardInfo.name);
            cardModalList.text(cardInfo.listname);
            cardModal.height(665);
            showCardModalDesc(cardInfo.description);    
            showCardModalLabels(cardInfo.labels);
            showCardModalComments(cardInfo.comments);
        });
    }

    function checkHash() {
        if(window.location.hash === "")
            hideCardModal();
        else if(window.location.hash.length > 1 && listContainer.find(`.card[data-id=${window.location.hash.slice(1)}]`).length > 0) { // verify card is actually on this page
            showCardModal(window.location.hash.slice(1));
        }
    }
    
    function hideCardModal() {
        cardModalContainer.addClass("hidden");
        label_container_height = 68;
    }
    
    listList.on("click", ".card", function() {
        window.location.hash = "#" + $(this).attr("data-id");
        
    });
    
    cardModalContainer.click(function(e) {
        if(e.target.id == "card-modal-container") {
            window.location.hash = "";
        }
    });
    
    cardModal.find("#close-card-modal").click(function() {
        window.location.hash = "";
    });
    
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
        changeDescription(desc, cardModal.attr("data-id")).then(function(response) {
            cardModalDesc.text(response.description);
            cardModalDescEntry.addClass("hidden");
            cardModalSaveDescBtn.addClass("hidden");
            cardModalDesc.removeClass("hidden");
        });
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
            if(label != "") {
                createLabel(label, cardModal.attr("data-id")).then(function(resolve) {
                    $(`<div class="label" data-id=${resolve.labelId}><span class="labelname">${label}</span>&ensp;<i class="fas fa-times remove-label"></i></div>`).insertBefore(labelEntry);
                    labelEntry.text("");
                    resizeModal();
                }).catch(function(thrown) {
                    console.log(thrown);
                });
            }
        }
        else if(e.keyCode == 8 && $(this).text() == "") {
            let last = labelContainer.find(".label").last();
            if(last.length > 0) {
                removeLabel(last.attr("data-id"), cardModal.attr("data-id")).then(function(resolve) {
                    last.remove();
                    resizeModal();
                });
            }
        }
        else if(e.keyCode == 27) {
            $(this).blur();
        }
    });
    
    labelContainer.on("click", ".remove-label", function() {
        let label = $(this).parent();
        removeLabel(label.attr("data-id"), cardModal.attr("data-id")).then(function(resolve) {
            label.remove();
        });
    });

    function generateComment(comment) {
        return `<li class="modal-comment-info" data-id=${comment.id}>
                    <div class="user-icon modal-user-icon"></div>
                    <h5 class="modal-comment-name">${comment.name}</h5>
                    <p class="modal-comment-time">${comment.datetime}</p>
                    <div class="modal-comment"><p>${comment.body}</p></div>
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
            createComment(comment, cardModal.attr("data-id")).then(function(created) {
                let temp = $(generateComment(created));
                commentList.prepend(temp);
                cardModal.height(cardModal.height() + temp.innerHeight());
                cardModalCommentEntry.val("");
                cardModalSaveCommentBtn.removeClass("btn-ready");
            });
        }
    });

    cardModalList.click(function() {
        window.location.hash = "";
    });

    $(window).bind("hashchange", checkHash);
});

