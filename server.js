//https://glitch.com/edit/#!/networked-aframe
// Load required modules
let http = require("http"); // http server core module
let path = require("path");
const express = require("express"); // web framework external module
const MongoClient = require('mongodb').MongoClient;
//const assert = require('assert');

// Connection URL
const url = 'mongodb+srv://DAVID00480:@Hurricane3@cluster0.jvdhb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

// Database Name
const dbName = 'myFirstDatabase';

// Create a new MongoClient
const client = new MongoClient(url);

let check = console.log("Connected successfully to MongoDB server");

function getCheck(){
    return check;
}

// Use connect method to connect to the Server
client.connect(function(err) {
    //assert.equal(null, err);
    getCheck();


    const db = client.db(dbName);

    client.close();
});
// Set process name
process.title = "networked-aframe-server";

// Get port or default to 8080
const port = process.env.PORT || 8080;

// Setup and configure Express http server.
const app = express();
app.use(express.static('public'));

// Start Express http server
const webServer = http.createServer(app);
const io = require("socket.io")(webServer);

const rooms = {};

io.on("connection", socket => {
    console.log("user connected", socket.id);

    let curRoom = null;

    socket.on("joinRoom", data => {
        const { room } = data;

        if (!rooms[room]) {
            rooms[room] = {
                name: room,
                occupants: {},
            };
        }

        const joinedTime = Date.now();
        rooms[room].occupants[socket.id] = joinedTime;
        curRoom = room;

        console.log(`${socket.id} joined room ${room}`);
        socket.join(room);

        socket.emit("connectSuccess", { joinedTime });
        const occupants = rooms[room].occupants;
        io.in(curRoom).emit("occupantsChanged", { occupants });
    });

    socket.on("send", data => {
        io.to(data.to).emit("send", data);
    });

    socket.on("broadcast", data => {
        socket.to(curRoom).broadcast.emit("broadcast", data);
    });

    socket.on("disconnect", () => {
        console.log('disconnected: ', socket.id, curRoom);
        if (rooms[curRoom]) {
            console.log("user disconnected", socket.id);

            delete rooms[curRoom].occupants[socket.id];
            const occupants = rooms[curRoom].occupants;
            socket.to(curRoom).broadcast.emit("occupantsChanged", { occupants });

            if (occupants == {}) {
                console.log("everybody left room");
                delete rooms[curRoom];
            }
        }
    });
});

webServer.listen(port, () => {
    console.log("listening on http://localhost:" + port);
});
