const axios = require('axios')

const cached = {}
const methods = ["get", "post", "put", "delete", "patch"]

const options = {
    defaultTtl: 60,
    checkInterval: 1,
    randomUseragent: true
}

const api = {
    setup: userOptions => {
        setup(userOptions)
    }
}

const cache = {
    set: (key, data, ttl) => {
        if (!ttl) {
            ttl = options.defaultTtl
        }

        cached[key] = {
            data: data,
            ttl: Date.now() + (ttl * 1000)
        }
    },
    get: key => {
        if (cached[key]) {
            //console.log(`[cached] ${key}`);
            return cached[key].data
        }
        else {
            return undefined
        }
    },
    del: key => {
        delete cached[key]
    },
    check: () => {
        Object.keys(cached).forEach(key => {
            if (cached[key].ttl - Date.now() < 0) {
                delete cached[key]
            }
        })
    }
}

function setup(userOptions) {
    if (userOptions) {
        Object.keys(userOptions).forEach(key => {
            if (options[key] != undefined) {
                options[key] = userOptions[key]
            }
        })
    }

    methods.forEach(method => {
        api[method] = async (url, options) => {
            let req = cache.get(url)

            if (req == undefined) {
                //console.log(`[req] ${url}`);
                req = await axios[method](url)
            }
            else {
                //console.log(`[cache] ${url}`);
            }

            cache.set(url, req)

            return req
        }
    })

    setInterval(() => {
        cache.check()
    }, (options.checkInterval * 1000));
}

module.exports = api
