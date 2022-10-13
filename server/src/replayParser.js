const fs = require("fs")
const parseReplay = require('fortnite-replay-parser');
const players = require("./players")

module.exports = {
    parse: parse,
    playerLog: playerLog
}

async function playerLog(replay, perspective) {
    const player = getPlayerInfo(perspective, replay)
    const log = []
    
    for (const e of replay.events) {
        if (e.group != "playerElim") {
            continue
        }

        if (e.eliminator == player.id) {
            if (e.group == "playerElim") {
                let type = "kill"

                if (e.knocked) {
                    type = "knockdown"
                }

                log.push({
                    event: type,
                    text: type,
                    target: getPlayerInfo(e.eliminated, replay),
                    id: Math.round(Math.random() * 1000)
                })
            }
        }

        if (e.eliminated == player.id && e.knocked == false) {
            log.push({
                event: "death",
                text: "killed by",
                target: getPlayerInfo(e.eliminator, replay),
                id: Math.round(Math.random() * 10000)
            })
        }
    }

    return log
}

function getPlayerInfo(query, replay) {
    for (const p of replay.gameData.players) {
        if (p.UniqueId == query || p.PlayerNamePrivate == query) {
            return {
                name: p.PlayerNamePrivate,
                id: p.UniqueId,
                skin: p.Character
            }
        }
    }
}

async function parse(path) {
    const buffer = fs.readFileSync(path);

    const parserConfig = {
        parseLevel: 10,
        debug: false,
    }

    const replayData = await parseReplay(buffer, parserConfig)
    //fs.writeFileSync("./data/replay.json", JSON.stringify(replayData))

    return replayData
}