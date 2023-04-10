const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // set this to true for detailed logging:
  logger: false,
});

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// Our main GET home page route, pulls from src/pages/index.hbs
fastify.get("/", function (request, reply) {
  // params is an object we'll pass to our handlebars template
  let params = {
    greeting: "Hello Node!",
  };

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

  // request.query.paramName <-- a querystring example
  return reply.view("/src/pages/index.hbs", params);
});

// A POST route to handle form submissions
fastify.post("/", function (request, reply) {
  let params = {
    greeting: "Hello Form!",
  };
  // request.body.paramName <-- a form post example
  return reply.view("/src/pages/index.hbs", params);
});

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
