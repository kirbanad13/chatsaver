const WebSocket = require("ws");
const fs = require("fs");
const fetch = require("node-fetch");
const { spawn } = require("child_process");

const channels = {
  arrowwood: 137757,
  k0kcakep: 199261,
  archiedos: 187877,
};

const currentChannel = "archiedos";

checkLiveStatus();

function checkLiveStatus() {
  fetch(
    `https://goodgame.ru/api/getchannelstatus?id=${channels[currentChannel]}&fmt=json`
  )
    .then((response) => response.json())
    .then((data) => {
      const status = data[channels[currentChannel]].status;
      console.log(status);

      if (status === "Live") {
        saveChat();
        const streamLinkCommand = saveVOD();
        checkDeadStatus(streamLinkCommand);
      } else {
        setTimeout(checkLiveStatus, 500);
      }
    })
    .catch((error) => {
      console.error(error);
      setTimeout(checkLiveStatus, 500); // Check again in 5 seconds
    });
}

function checkDeadStatus(streamLinkCommand) {
  fetch(
    `https://goodgame.ru/api/getchannelstatus?id=${channels[currentChannel]}&fmt=json`
  )
    .then((response) => response.json())
    .then((data) => {
      const status = data[channels[currentChannel]].status;

      if (status === "Dead") {
        streamLinkCommand.kill("SIGTERM");
      } else {
        setTimeout(function () {
          checkDeadStatus(streamLinkCommand);
        }, 500); // Check again in 0.5 seconds
      }
    })
    .catch((error) => {
      console.error(error);
      setTimeout(function () {
        checkDeadStatus(streamLinkCommand);
      }, 500); // Check again in 0.5 seconds
    });
}

function saveVOD() {
  const fileName = createFileName() + "_vod.ts";
  const argsString =
    "--hls-segment-stream-data --hls-live-edge=1 --retry-streams 5 --retry-max 0 --retry-open 10000 --hls-timeout 60";
  const args = argsString.split(" ");
  return spawn("streamlink", [
    ...args,
    "-o",
    fileName,
    `https://goodgame.ru/channel/${currentChannel}`,
    "best",
  ]);
}

function saveChat() {
  const chatSocket = new WebSocket("wss://chat-1.goodgame.ru/chat2/");

  const fileName = createFileName() + "_messages.json";

  chatSocket.addEventListener("open", (event) => {
    const message = {
      type: "join",
      data: {
        channel_id: channels[currentChannel],
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

  return `${year}_${month}_${day}_${hour}_${minute}_${second}`;
}
