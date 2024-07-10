document.addEventListener("DOMContentLoaded", () => {
    const socket = new WebSocket("ws://localhost:8080");

    const loginButton = document.getElementById("loginButton");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const messageContainer = document.getElementById("messageContainer");

    let token = null;

    socket.addEventListener("open", ()=> {
        console.log("Connected to WebSocket server");
    });

    socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "assign_id") {
            console.log('Assigned id: ${message.id}');
        } else if (message.type === "login_success") {
            token = message.token;
            displayMessage("Login successful! Token: " + token);
        } else if (message.type === "login_failure") {
            displayMessage("Login failed. Please check your credentials.");
        } else if (message.type === "refresh_success") {
            token = message.token;
            displayMessage("Token refreshed! New token: " + token);
        } else if (message.type === "refresh_failure") {
            display("Token refresh failure.");
        } else {
            displayMessage("Server: " + event.data);
        }
    });

    socket.addEventListener("close", ()=> {
        console.log("Disconnected from WebSocket server");
    });

    loginButton.addEventListener("click", () => {
        const username = usernameInput.value;
        const password = passwordInput.value;

        const loginMessage = {
            type: "login",
            username: username,
            password: password
        };

        socket.send(JSON.stringify(loginMessage));
    });

    function displayMessage(message) {
        const messageElement = document.createElement("div");
        messageElement.textContent = message;
        messageContainer.appendChild(messageElement);
    }

});

