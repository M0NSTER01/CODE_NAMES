let express = require("express");
let { createServer } = require("http");
let { Server } = require("socket.io");
let path = require("path");
let mysql2 = require("mysql2");

let app = express();
const cors = require("cors");
const { send } = require("process");

app.use(cors());
let server = createServer(app);
let io = new Server(server, {
    cors: { origin: "*" } 
});

let con = mysql2.createPool({
    host: "localhost",
    user: "root",
    password: "Raghav@159369",
    database: "codenames"
}).promise();



// Route to create a new room (optional)
app.get("/create-room", async (req, res) => {
    console.log("request received for creating server")
    console.log(req.query.name);
    try{
        const [word] = await con.query(`SELECT word FROM wordlist ORDER BY RAND() LIMIT 3`);

        const roomId = word.map(r => r.word.toLowerCase()).join("-");
        res.json({ roomId });
    }
    catch (err){
        console.log(err);
        res.status(500).json({ error: "Failed to generate room ID" });
    };
});

let roomPlayers = {};
let redspy = {};
let bluespy = {};
let redop = {};
let blueop = {};
let host = {};
let gamestarted = {};
let wordlist = {};
let wordColorMap = {};
let currentturn = {};
let turnphase = {};
let redcardcount = {};
let bluecardcount = {};
let selectednumber = {};
let cluetext = {};


function emitRoomUpdate(roomId) {
    console.log("Emit room update hit");
    console.log(currentturn[roomId]);
  const playerList = roomPlayers[roomId] || [];
  const colorData = wordColorMap[roomId] || {};

  playerList.forEach((player) => {
    const isSpy = player.role === "redspy" || player.role === "bluespy";

    io.to(player.id).emit("roomUpdate", {
      players: playerList,
      host: host[roomId],
      status: gamestarted[roomId],
      wordlist: wordlist[roomId],
      colorMap: isSpy ? colorData.map : {},
      firstTurn: colorData.firstTurn || null,
      redcardcount: redcardcount[roomId],
      bluecardcount: bluecardcount[roomId],
      currentturn: currentturn[roomId],
      turnphase: turnphase[roomId],
      cluetext: cluetext[roomId],
      selectednumber: selectednumber[roomId]
    });
  });
}

function emitRoomMessage(roomId, text, sender) {
    const msg = {
        text: text,
        sender: sender,
    };
    io.to(roomId).emit("message", msg);
}

async function getwordlist(roomId) {
    console.log(`Generating wordlist and color map for roomId: ${roomId}`);
    try {
        const [rows] = await con.query(`SELECT word FROM wordlist ORDER BY RAND() LIMIT 25`);
        const words = rows.map(r => r.word);
        wordlist[roomId] = words;

        const indices = [...Array(25).keys()].sort(() => Math.random() - 0.5);

        const firstTeam = Math.random() < 0.5 ? "red" : "blue";
        const secondTeam = firstTeam === "red" ? "blue" : "red";

        const colorMap = {};

        for (let i = 0; i < 25; i++) {
            const word = words[indices[i]];
            if (i === 0) colorMap[word] = "black";
            else if (i <= 7) colorMap[word] = "grey";
            else if (i <= 15) colorMap[word] = secondTeam;
            else colorMap[word] = firstTeam;
        }

        wordColorMap[roomId] = {
            map: colorMap,
            firstTurn: firstTeam

        };
                
        if(wordColorMap[roomId].firstTurn === "blue"){
            redcardcount[roomId] = 8;
            bluecardcount[roomId] = 9;
            turnphase[roomId] = "spy";
        }
        else if(wordColorMap[roomId].firstTurn === "red"){
            redcardcount[roomId] = 9;
            bluecardcount[roomId] = 8;
            turnphase[roomId] = "spy";
        }

        
        currentturn[roomId] = wordColorMap[roomId].firstTurn;
        console.log(currentturn[roomId]);

        console.log("Word color map:", wordColorMap[roomId]);

    } catch (err) {
        console.log(err);
    }
}

function revealcard(roomId, color, word, index){
    io.to(roomId).emit("cardreveal", {
        color: color,
        word: word,
        index: index
    });
}



io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ roomId, username, role }) => {
        socket.join(roomId);
        console.log(`${username} (${socket.id}) joined room ${roomId}`);

        if (!roomPlayers[roomId]) roomPlayers[roomId] = [];
        roomPlayers[roomId].push({ id: socket.id, name: username , role: role});

        if (!host[roomId]) {host[roomId] = {name: username, id: socket.id};
            redspy[roomId] = 0;
            bluespy[roomId] = 0;
            redop[roomId] = 0;
            blueop[roomId] = 0;
            gamestarted[roomId] = false;
            wordlist[roomId] = [];
            wordColorMap[roomId] = null;
            currentturn[roomId] = null;
            turnphase[roomId] = null;
            redcardcount[roomId] = null;
            bluecardcount[roomId] = null;
            selectednumber[roomId] = null;
            cluetext[roomId] = null;
        };


        console.log("Host is: "+host[roomId]);
        console.log("Total players in room", roomId, ":", JSON.stringify(roomPlayers[roomId], null, 2));
        console.log(`Role count is Redspy: ${redspy[roomId]} Bluespy: ${bluespy[roomId]}  Redop: ${redop[roomId]} Blueop: ${blueop[roomId]} `);


        emitRoomUpdate(roomId);
    });

    socket.on("start", async ({ roomId }) => {
        if (redop[roomId] !== 0 && redspy[roomId] !== 0 && blueop[roomId] !== 0 && bluespy[roomId] !== 0 ) {
            gamestarted[roomId] = true;
            console.log("Game started for room:", roomId);
            
            emitRoomMessage(roomId, "Game Started. Enjoy!", "Server");

            await getwordlist(roomId);
            console.log(currentturn[roomId]);
            emitRoomUpdate(roomId);
        } else {
            console.log("Game cannot start. Roles not filled.");
            emitRoomMessage(roomId, "Cannot start game. One or more roles are not filled.", "Server");
        }
    });

    socket.on("stop", ({roomId, username}) =>{
        gamestarted[roomId] = false;
        console.log(gamestarted[roomId]);
        console.log("Game stoped for room: ", roomId);

        emitRoomMessage(roomId, `Game has been stopped by ${username}`,"Server");
        emitRoomUpdate(roomId);
    })


    socket.on("role", ({ roomId, username, role}) =>{
        if (!roomPlayers[roomId]) return;
        console.log("Update role requested");

        const player = roomPlayers[roomId].find(p => p.id === socket.id);

        if (player) {
            const prevrole = player.role;

            switch(prevrole){
                case "redspy": redspy[roomId]--; break;
                case "bluespy": bluespy[roomId]--; break;
                case "redop": redop[roomId]--; break;
                case "blueop": blueop[roomId]--; break;
            }
            player.role = role;

            switch(role){
                case "redspy": redspy[roomId]++; break;
                case "bluespy": bluespy[roomId]++; break;
                case "redop": redop[roomId]++; break;
                case "blueop": blueop[roomId]++; break;
            }
            console.log(`${username} is now ${role} in room ${roomId}`);
        }


        console.log(`Role count is Redspy: ${redspy[roomId]} Bluespy: ${bluespy[roomId]}  Redop: ${redop[roomId]} Blueop: ${blueop[roomId]} `);
        console.log("Host is: " + host[roomId]);
        console.log("Total players in room", roomId, ":", JSON.stringify(roomPlayers[roomId], null, 2));

        emitRoomUpdate(roomId);


    })

    socket.on("spyentry", ({ username, cluetext: clueTextInput, selectednumber: selectedNumberInput, roomid }) => {
        console.log("spy entry hit");
        console.log(roomid);


        console.log("Current Turn Set To:", currentturn[roomid]);

        if (selectedNumberInput) {
            selectednumber[roomid] = selectedNumberInput;
        }
        cluetext[roomid] = clueTextInput;
        turnphase[roomid] = "op";

        emitRoomUpdate(roomid);
    });


    socket.on("endturn", ({ roomid, username }) => {
        console.log("endturn hit!!");
        currentturn[roomid] = currentturn[roomid] === "red" ? "blue" : "red";
        turnphase[roomid] = "spy";

        emitRoomMessage(roomid, `${username} ended their team's guessing phase.`, "Server");
        emitRoomUpdate(roomid);
    });


    socket.on("cardclick", ({ index, word, roomid}) => {
        console.log("cardlicked!!");
        const map = wordColorMap[roomid]?.map;
        console.log("map: ", map);
        if (!map || !map[word]) return;

        const color = map[word];
        console.log("color: ", color)

        console.log(`Card clicked: ${word} (${color})`);
        map[word] = color;

        if (color === "red") {redcardcount[roomid]--;
            revealcard(roomid, color, word, index);
        };
        if (color === "blue") {bluecardcount[roomid]--;
            revealcard(roomid, color, word, index);
        };
        if (redcardcount[roomid] === 0) {
            emitRoomMessage(roomid, "Red team wins! 🎉", "Server");
            gamestarted[roomid] = false;
        } else if (bluecardcount[roomid] === 0) {
            emitRoomMessage(roomid, "Blue team wins! 🎉", "Server");
            gamestarted[roomid] = false;
        }

        if (color === "black") {
            const loser = currentturn === "red" ? "Red" : "Blue";
            revealcard(roomid, color, word, index);
            emitRoomMessage(roomid, `${loser} team clicked the assassin! Game over.`, "Server");
            gamestarted[roomid] = false;
        }

        if (color === "grey") {
            currentturn[roomid] = currentturn === "red" ? "blue" : "red";
            revealcard(roomid, color, word, index);
            turnphase[roomid] = "spy";
            emitRoomMessage(roomid, `Wrong guess! Turn passes to ${currentturn[roomid]} team.`, "Server");
        }

        if (color !== currentturn[roomid] && color !== "grey" && color !== "black") {
            const previousTurn = currentturn[roomid];
            console.log("turn: ", previousTurn);
            currentturn[roomid] = previousTurn === "red" ? "blue" : "red";
            revealcard(roomid, color, word, index);
            turnphase[roomid] = "spy";
            emitRoomMessage(roomid, `Wrong team's word! Turn passes to ${currentturn[roomid]} team.`, "Server");
        }



        emitRoomUpdate(roomid);
    });




    socket.on("message", ({ roomId, text }) => {
        const msg = {
            text,
            sender: socket.id,
        };
        io.to(roomId).emit("message", msg);
    });

    socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let roomId in roomPlayers) {
        const player = roomPlayers[roomId].find(p => p.id === socket.id);

        if (player) {
        switch (player.role) {
            case "redspy": redspy[roomId]--; break;
            case "bluespy": bluespy[roomId]--; break;
            case "redop": redop[roomId]--; break;
            case "blueop": blueop[roomId]--; break;
        }

        roomPlayers[roomId] = roomPlayers[roomId].filter(p => p.id !== socket.id);
        console.log(`Role count is Redspy: ${redspy[roomId]} Bluespy: ${bluespy[roomId]}  Redop: ${redop[roomId]} Blueop: ${blueop[roomId]} `);
        

        emitRoomUpdate(roomId);
        }
    }
    });
});

server.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});
