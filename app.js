const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
let dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
let initializationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`db error ${e.message}`);
    process.exit(1);
  }
};
initializationDbAndServer();

let playerobject = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};

let matchobject = (match) => {
  return {
    matchId: match["match_id"],
    match: match["match"],
    year: match["year"],
  };
};
// api 1 get player details
app.get("/players/", async (request, response) => {
  let query = `SELECT * FROM player_details;`;
  let dbresponse = await db.all(query);
  response.send(dbresponse.map((player) => playerobject(player)));
});

//api 2 get one

app.get("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let query = `SELECT * FROM player_details
  WHERE player_id = ${playerId};`;
  let dbresponse = await db.get(query);
  response.send(playerobject(dbresponse));
});

//api3 add player put
app.put("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let { playerName } = request.body;
  let query = `UPDATE player_details
  SET  player_name = '${playerName}'
  WHERE player_id = ${playerId};`;
  let dbresponse = await db.run(query);
  response.send("Player Details Updated");
});

//api 4 get match details
app.get("/matches/:matchId/", async (request, response) => {
  let { matchId } = request.params;
  let query = `SELECT * FROM match_details
  WHERE match_id = ${matchId};`;
  let dbresponse = await db.get(query);
  response.send({
    matchId: dbresponse.match_id,
    match: dbresponse.match,
    year: dbresponse.year,
  });
});

//api 5 get all matches
app.get("/players/:playerId/matches", async (request, response) => {
  let { playerId } = request.params;
  let query = `SELECT match_id,match,year 
  FROM match_details NATURAL JOIN player_match_score
  WHERE player_id = ${playerId};`;
  let dbresponse = await db.all(query);
  response.send(dbresponse.map((match) => matchobject(match)));
});

// get 6 get players
let playerobject2 = (player) => {
  return {
    playerId: player["player_id"],
    playerName: player["player_name"],
  };
};
app.get("/matches/:matchId/players", async (request, response) => {
  let { matchId } = request.params;
  let query = `SELECT player_id,player_name
  FROM player_match_score NATURAL JOIN player_details
  WHERE match_id = ${matchId};`;
  let dbresponse = await db.all(query);
  response.send(dbresponse.map((match) => playerobject2(match)));
});

// api 7 get total details of players

app.get("/players/:playerId/playerScores", async (request, response) => {
  let { playerId } = request.params;
  let query = `SELECT player_id,player_name,SUM(score),
  SUM(fours),SUM(sixes)
  FROM player_match_score NATURAL JOIN player_details
  WHERE player_id = ${playerId};`;
  let dbresponse = await db.get(query);
  response.send({
    playerId: dbresponse["player_id"],
    playerName: dbresponse["player_name"],
    totalScore: dbresponse["SUM(score)"],
    totalFours: dbresponse["SUM(fours)"],
    totalSixes: dbresponse["SUM(sixes)"],
  });
});

module.exports = app;
