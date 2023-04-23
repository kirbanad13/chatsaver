const WebSocket = require("ws");
const fs = require("fs");
const fetch = require("node-fetch");
const { spawn } = require("child_process");

const args = process.argv.slice(2);

const currentChannel = args[0].toLowerCase();
const secondArg = args[1].toLowerCase();

const channels = {
  arrowwood: 137757,
  k0kcakep: 199261,
  archiedos: 187877,
};

saveChat();

if (secondArg === "vod") {
  saveVOD();
}

function saveVOD() {
  const fileName = createDateTime() + "_vod.ts";
  const argsString =
    "--hls-segment-stream-data --hls-live-edge=1 --retry-streams 5 --retry-max 0 --retry-open 100000 --hls-timeout 60";
  const args = argsString.split(" ");
  let child = spawn("streamlink", [
    ...args,
    "-o",
    fileName,
    `https://goodgame.ru/channel/${currentChannel}`,
    "best",
  ]);

  child.on("close", () => {
    console.log("process was closed");
    saveVOD();
  });

  child.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });
}

function saveChat() {
  const chatSocket = new WebSocket("wss://chat-1.goodgame.ru/chat2/");

  const fileName = createDateTime() + "_messages.json";

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

  let messageCounter = 1;
  chatSocket.onmessage = function (event) {
    const message = JSON.parse(event.data);

    if (message.type === "message" || message.type === "remove_message") {
      fs.appendFile(fileName, JSON.stringify(message) + ",", (err) => {
        console.log("Message saved to file " + messageCounter++);
      });
    }
  };
}

function createDateTime() {
  const now = new Date();
  const options = {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  const dateTimeString = now.toLocaleString("ru-RU", options);
  return dateTimeString.replace(/[:,.\s]/g, "_");
}
