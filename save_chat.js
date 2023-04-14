const WebSocket = require("ws");
const fs = require("fs");
const fetch = require("node-fetch");

//199261 k0kcakep
//137757 Arrowwood
const channelId = 137757;

checkStatus();

function checkStatus() {
  fetch(`https://goodgame.ru/api/getchannelstatus?id=${channelId}&fmt=json`)
    .then((response) => response.json())
    .then((data) => {
      const status = data[channelId].status;
      console.log(data[channelId].status);
      if (status === "Live") {
        saveChat();
      } else {
        setTimeout(checkStatus, 500);
      }
    })
    .catch((error) => {
      console.error(error);
      setTimeout(checkStatus, 500); // Check again in 5 seconds
    });
}

function saveChat() {
  const chatSocket = new WebSocket("wss://chat.goodgame.ru/chat/websocket");
  const now = new Date();
  const fileName = createFileName();

  chatSocket.addEventListener("open", (event) => {
    const message = {
      type: "join",
      data: {
        channel_id: channelId,
        hidden: false,
      },
    };

    chatSocket.send(JSON.stringify(message));
  });

  chatSocket.onmessage = function (event) {
    const message = JSON.parse(event.data);

    if (message.type === "message" || message.type === "remove_message") {
      fs.appendFile(fileName, JSON.stringify(message) + ",", (err) => {
        console.log("Message saved to file");
      });
    }
  };
}

function createFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `${year}_${month}_${day}_${hour}_${minute}_${second}_messages.json`;
}
