const WebSocket = require("ws");
const fs = require("fs");
const fetch = require("node-fetch");
const { spawn } = require("child_process");

const channels = {
  arrowwood: 137757,
  k0kcakep: 199261,
  archiedos: 187877,
};

const currentChannel = "k0kcakep";

saveChat();
saveVOD();

function saveVOD() {
  const fileName = createDateTime() + "_vod.ts";
  const argsString =
    "--hls-segment-stream-data --hls-live-edge=1 --retry-streams 5 --retry-max 0 --retry-open 10000 --hls-timeout 60";
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

  chatSocket.onmessage = function (event) {
    const message = JSON.parse(event.data);

    if (message.type === "message" || message.type === "remove_message") {
      fs.appendFile(fileName, JSON.stringify(message) + ",", (err) => {
        console.log("Message saved to file");
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
  const dateTimeString = now.toLocaleString("en-US", options);
  const [dateString, timeString] = dateTimeString.split(" ");
  const [month, day, year] = dateString.split("/");
  const [hour, minute, second] = timeString.split(":");
  return `${year.slice(0, 4)}_${month.padStart(2, "0")}_${day.padStart(
    2,
    "0"
  )}_${hour}_${minute}_${second}`;
}
