const path = require("path");

const WebSocket = require("ws");
const fs = require("fs");

const chatSocket = new WebSocket("wss://chat.goodgame.ru/chat/websocket");

chatSocket.addEventListener("open", (event) => {
  const message = {
    type: "join",
    data: {
      channel_id: "5",
      hidden: false,
    },
  };

  chatSocket.send(JSON.stringify(message));
});

chatSocket.onmessage = function (event) {
  const message = JSON.parse(event.data);

  if (message.type === "message") {
    fs.appendFile("messages.json", JSON.stringify(message) + ",", (err) => {
      if (err) throw err;
      console.log("Message saved to file");
    });
  }
};
