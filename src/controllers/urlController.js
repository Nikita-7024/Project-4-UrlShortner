const validUrl = require('valid-url');
const shortid = require('shortid')
const UrlModel = require('../models/urlModel')
const baseUrl = 'http://localhost:3000'


const redis = require("redis");

const { promisify } = require("util");


//Connect to redis-----------------------------

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
// use redis to set and get-------------------------

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const isValid = function (value) {
    if (typeof (value) === 'undefined' || typeof (value) === 'null') { return false }
    if (value.trim().length == 0) { return false }
    if (typeof (value) === 'string' && value.trim().length > 0) { return true }
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const createUrl = async function (req, res) {

    try {
        const longUrl = req.body.longUrl.trim()

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

        // let URL = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/

        // //Validation of longUrl----------------------           
        // if (!URL.test(longUrl)) {
        //     return res.status(400).send({ status: false, message: "longurl is not valid please provide valid url like http,www,https" })
        // }


        //Generate urlCode---------------------

        let urlCode = shortid.generate().match(/[a-z\A-Z]/g).join("")
        urlCode = urlCode.toLowerCase()

        //Fetch the data in redis-------------

        let checkUrl = await GET_ASYNC(`${longUrl}`)

        if (checkUrl) {
            return res.status(200).send({ status: true, "data": JSON.parse(checkUrl) })
        }

        //if data not found in caches find in MongoDb---------------------------

        let url = await UrlModel.findOne({ longUrl }).select({ _id: 0 })

        if (url) {
            return res.status(200).send({ status: true, message: 'success', 'data': url })
        }

        //GENERATE DATA BY LONG URL-----------------------------

        const shortUrl = baseUrl + '/' + urlCode
        const urlData = { urlCode, longUrl, shortUrl }

        const newurl = await UrlModel.create(urlData);

        let longurl = newurl.longUrl
        let shorturl = newurl.shortUrl
        let urlcode = newurl.urlCode
        let data = ({ longurl, shorturl, urlcode })

        //SET GENERATE DATA IN CACHE-------------------------------
        await SET_ASYNC(`${longUrl}`, JSON.stringify(newurl), "EX", 50)

        return res.status(201).send({ status: true, msg: `URL created successfully`, data: data });

    } catch (err) {
        return res.status(500).send({ msg: err.message })
    }
}




const getUrl = async function (req, res) {

    try {

        let urlcode = await GET_ASYNC(`${req.params.urlCode.trim()}`)

        console.log(urlcode)

        //    if(!isValid(urlcode)){

        //        return res.status(400).send({status:false, message:"invalid request"})

        //    }



        const code = await UrlModel.findOne({ urlCode: req.params.urlCode })

        if (!code) {

            return res.status(404).send({ status: false, message: "Sorry, URL not found" })

        }

        await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(code), "EX", 50)

        return res.status(302).redirect(code.longUrl)
    }catch (err) {
        return res.status(500).send({ msg: err.message })
    }

}

module.exports.createUrl = createUrl;
module.exports.getUrl = getUrl;
