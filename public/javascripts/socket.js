const socket = io.connect({
    query: {
        id
    }
});

$(function() {
    const notifications = $("#notifications-popup");
    const notificationsBtn = $("#notifications-btn");
    socket.on("invitation", function(data) {
        notifications.append(`<div class="team-invitation" data-id=${data.teamId}><p>${data.inviter} has invited you to join the team "<span class="invite-team-name">${data.teamname}</span>"</p>
                                    <button class="btn btn-info accept-btn">Accept</button><button class="btn btn-offer decline-btn">Decline</button>
                                </div>`);
        notificationsBtn.addClass("notifications-unread");
    });
    socket.on("teamNotification", function(data) {
        let temp = `<div class="team-notification">`;
        switch(data.type) {
            case "newBoard": 
                temp += `<p>${data.name} has created a new board named <span class="board-link" data-id=${data.boardId}>${data.boardTitle}</span> in team "${data.team}"</p>`;
                break;
            case "newList":
                temp += `<p>${data.name} has created a new list named "${data.list}" in board <span class="board-link" data-id=${data.boardId}>${data.boardTitle}</span> from team "${data.team}"</p>`;
        }
        notifications.append(temp + `</div>`)
        notificationsBtn.addClass("notifications-unread");
    });
});

