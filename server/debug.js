const replayParser = require("./src/replayParser")
const perspective = "a56b05909c6b418483d05ef852e7e61c"

async function init() {
    const replayData = await replayParser.parse("./data/sample.replay")
    const playerLog = await replayParser.playerLog(replayData, perspective)

    console.log(playerLog);
}

init()
