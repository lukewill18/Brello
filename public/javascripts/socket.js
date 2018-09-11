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
});

