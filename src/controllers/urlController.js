const validUrl = require('valid-url');
const shortid = require('shortid')
const UrlModel = require('../models/urlModel')
const baseUrl = 'http://localhost:3000'
const redis = require("redis");

const { promisify } = require("util");


//Connect to redis
const redisClient = redis.createClient(
    14290,
    "redis-14290.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("nRzXpG7VrqiZNwTtclo1Wct0Uh21bGZC", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

const isValid = function (value) {
    if (typeof (value) === 'undefined' || typeof (value) === 'null') { return false }
    if (value.trim().length == 0) { return false }
    if (typeof (value) === 'string' && value.trim().length > 0) { return true }
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const createUrl = async function (req, res) {

    try {
        const longUrl = req.body.longUrl

        if (!isValidRequestBody(req.body)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide URL details' })
            return
        }
        if (!isValid(req.body.longUrl)) {
            return res.status(400).send({ status: false, message: ' Please provide valid URL' })
        }

        if (!(validUrl.isUri(longUrl))) {
            return res.status(400).send({ status: false, msg: "longurl is not valid" })
        }



        //---GENERATE URLCODE
        let urlCode = shortid.generate().match(/[a-z\A-Z]/g).join("")
        urlCode = urlCode.toLowerCase()

        await GET_ASYNC(`${req.body.longUrl.trim()}`)

        let url = await UrlModel.findOne({ longUrl }).select({ _id: 0 })

        if (url) {
            return res.status(200).send({ status: true, message: 'success', 'data': url })
        }

        //---GENERATE DATA BY LONG URL
        const shortUrl = baseUrl + '/' + urlCode
        const urlData = { urlCode, longUrl, shortUrl }

        await SET_ASYNC(`${req.body.urlData}`, JSON.stringify(urlData))

        const newurl = await UrlModel.create(urlData);
        return res.status(201).send({ status: true, msg: `URL created successfully`, data: newurl });
    } catch (err) {
        return res.status(500).send({ msg: err.message })
    }
}




const getUrl = async function (req, res) {

    try {
        let url = await GET_ASYNC(`${req.params.urlCode}`)
        console.log("found in redis")
        console.log(url)

        const newUrl = await UrlModel.findOne({ urlCode: req.params.urlCode })

        if (!newUrl) {

            return res.status(404).send({ status: false, message: "Sorry, URL not found" })

        }

        await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(newUrl))

        return res.status(302).redirect(newUrl.longUrl)


    } catch (err) {
        return res.status(500).send({ msg: err.message })
    }
}



module.exports.createUrl = createUrl;
module.exports.getUrl = getUrl;