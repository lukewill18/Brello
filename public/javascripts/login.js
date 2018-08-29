function showAlert(message) {
    $("#alert").text(message);
    anime({
        targets: '#alert',
        opacity: {
            value: 1,
            duration: 700
        },
        top: {
            value: "5px",
            duration: 300
        },
        easing: "linear",
    });

    setTimeout(function() {
        anime({
            targets: '#alert',
            opacity: {
                value: 0,
                duration: 100
            },
            top: {
                value: "-500px",
                duration: 300   
            },
            easing: "linear",
        });
    }, 4500);
}

function registerAccount(first_name, last_name, email, password) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/users/register",
            method: "POST",
            data: {first_name, last_name, email, password},
            success: function(response) {
                resolve(response.id);
            },
            error: function(thrown) {
                console.log(thrown);
                reject(thrown);
            }
        });
    });
}

function login(email, password) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "http://localhost:3000/users/login",
            method: "POST",
            data: {email, password},
            success: function(response) {
                resolve(response.id);
            },
            error: function(thrown) {
                reject(thrown);
            }
        });
    });
}

$(function() {
    const loginPage = $("#login-page");
    const registerForm = loginPage.find("#register-form");
    const registerFirstName = registerForm.find("#first-name-entry");
    const registerLastName = registerForm.find("#last-name-entry");
    const registerEmail = registerForm.find("#register-email-entry");
    const registerPassword = registerForm.find("#register-password-entry");
    const loginForm = loginPage.find("#login-form");
    const loginEmail = loginForm.find("#login-email-entry");
    const loginPassword = loginForm.find("#login-password-entry");
    
    loginForm.on("submit", function(e) {
        e.preventDefault();
        let email = loginEmail.val();
        let pass = loginPassword.val();
        login(email, pass).then(function(id) {
            window.location.hash = "#board-view";
        }).catch(function(thrown) {
            showAlert(thrown.responseJSON.error);
        });
    });

    registerForm.on("submit", function(e) {
        e.preventDefault();
        let first_name = registerFirstName.val();
        let last_name = registerLastName.val();
        let email = registerEmail.val();
        let password = registerPassword.val();
        registerAccount(first_name, last_name, email, password).then(function(id) {
            window.location.hash = "#board-view";
        }).catch(function(thrown) {
            showAlert(thrown.responseJSON.error);
        });
    });
});