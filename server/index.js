const express = require("express")
const axios = require("axios")
const { killPortProcess } = require('kill-port-process');
const players = require("./src/players");
const replays = require("./src/replayParser")
const cors = require("cors");
const creq = require("./src/creq")

creq.setup()
const app = express()
const port = 80

app.use(cors())

app.get("/proxy/", async (req, res) => {
    const proxyRes = await axios.get(req.query.url)
        .catch(e => {
            console.log(e);
            res.end(e)
        })

    res.end(proxyRes.data)
})

app.get("/players/lookup", async (req, res) => {
    const identificator = req.query.user
    const data = await players.getAccountInfo(identificator)

    res.json(data)
})

app.get("/players/pr", async (req, res) => {
    const identificator = req.query.user
    const resTracker = await creq.get(`https://fortnitetracker.com/profile/all/${identificator}/events`)
        .catch(err => {
            console.log("cant get Event stats for", identificator);
        })
    

    if (resTracker) {
        const data = players.getPR(resTracker)

        res.json(data)
    }
    else {
        res.json(false)
    }
})

app.get("/replay/parse", async (req, res) => {
    const perspective = req.query.user
    const path = req.query.path
    
    const replay = await replays.parse(path)

    if (perspective != undefined) {
        replay.playerLog = await replays.playerLog(replay, perspective)
    }

    res.json(replay)
})

async function init() {
    await killPortProcess(port)
        .catch(e => {
            console.log(">");
        }) 
 
    const server = app.listen(port, () => {
        console.log(`serving on port ${port}`);
    })
}

init()