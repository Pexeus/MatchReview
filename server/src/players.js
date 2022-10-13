const creq = require("./creq");
const cheerio = require('cheerio');
const fs = require('fs');
const axios = require("axios")

creq.setup()

module.exports = {
    getEvent: getEventInfo,
    getVars: getVars,
    getAccountInfo: getAccountInfo,
    getPR: getPR
}


async function getEventInfo(event) {
    const data = {}
    const req = await creq.get(`https://fortnitetracker.com/events/${event}`)
    const $ = cheerio.load(req.data)

    //save request
    fs.writeFileSync("./data/event.html", req.data)

    //get cover image
    const img = $(`.trn-site__background`)
    const cover = img[0].attribs.style.split("background-image: url(")[1].replace(`);`, "")
    data.cover = cover

    //get leaderboard
    const parsed = await getVars(`https://fortnitetracker.com/events/${event}`, ["imp_leaderboard", "imp_eventWindow"])
    const leaderboard = parsed.imp_leaderboard

    //add nicknames to leaderboard
    leaderboard.entries.forEach(entry => {
        entry.team = []

        entry.teamAccountIds.forEach(id => {
            entry.team.push(leaderboard.internal_Accounts[id])
        })
    })

    data.leaderboard = leaderboard
    data.window = parsed.imp_eventWindow

    return data
}

//get the values of variables set in a script returned by the GET request
async function getVars(url, vars) {
    const hits = {}

    const req = await creq.get(url)

    const $ = cheerio.load(req.data)
    const scripts = $("script")
    
    for (const variable of vars) {
        for (const script of scripts) {
            if (script.children[0] != undefined) {
                if (script.children[0].data.includes(`var ${variable} =`)) {
                    //EXTREM SCUFFED, UNSAFE AF
                    eval(script.children[0].data)
                    eval(`hits.${variable} = ${variable}`)
                }
            }
        }
    }

    return hits
}

//filter PR data from response
function getPR(res) {
    const $ = cheerio.load(res.data)
    let data = {}

    const candidatesPR = $(".trn-fn-events-overview__pr-value")
    const candidatesRank = $(`a[class="trn-fn-events-overview__pr-link"]`)

    for (const candidate of candidatesPR) {
        if (String(Number(candidate.children[0].data.replace(",", ""))) != "NaN") {
            data.pr = Number(candidate.children[0].data.replace(",", ""))
        }
    }

    if (data.pr == undefined) {
        return {pr: 0}
    }

    try {
        const rankString = candidatesRank[0].children[0].data

        data.region = rankString.split(" ")[1].replace(`\n`, "").replace(" ", "")
        data.rank = Number(rankString.match(/\d/g).join(""))
    }
    catch(e) {
        console.log(e);
        data = false
    }
    
    return data
}

//get basic account info (including ID)
async function getAccountInfo(any) {
    const data = await creq.get(`https://fortnitetracker.com/profile/search?q=${encodeURIComponent(any)}`)
        .catch(err => {
            if (err.response.data.includes("too many requests")) {
                console.log("[!] maximum number of requests reached");
            }
            fs.writeFileSync("./error.html", err.response.data)
        })
    
    if (!data) {
        return false;
    }

    console.log(data.data);


    const $ = cheerio.load(data.data)

    const scripts = $("script")

    for (const script of scripts) {
        if (script.children[0] != undefined) {
            if (script.children[0].data.includes("var imp_data")) {
                eval(script.children[0].data)
            }
        }
    }

    if (imp_data != null && imp_data != undefined) {
        //reformat player ID (bad fix)
        imp_data.playerInfo.accountId = imp_data.playerInfo.accountId.replaceAll("-", "")

        return imp_data.playerInfo
    }
    else {
        return false
    }

}