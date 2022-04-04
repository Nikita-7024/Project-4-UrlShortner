const validUrl = require('valid-url');
const shortid = require('shortid')
const UrlModel = require('../models/urlModel')
const baseUrl = 'http://localhost:3000'


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
            return res.status(400).send({ status: false, message: ' Please provide LONG URL' })
        }

        if (!(validUrl.isUri(longUrl))) {
            return res.status(400).send({ status: false, msg: "longurl is not valid" })
        }


        //---GENERATE URLCODE
        let urlCode = shortid.generate().match(/[a-z\A-Z]/g).join("")

        urlCode = urlCode.toLowerCase()

        let url = await UrlModel.findOne({ longUrl })

        if (url) {
            return res.status(200).send({ status: true, "data": url })
        }
        //---GENERATE DATA BY LONG URL
        const shortUrl = baseUrl + '/' + urlCode
        const urlData = { urlCode, longUrl, shortUrl }

        const newurl = await UrlModel.create(urlData);
        return res.status(201).send({ status: true, msg: `URL created successfully`, data: newurl });
    } catch (err) {
        return res.status(500).send({ msg: err.message })
    }
}

const getUrl = async function (req, res) {
    try {
        const url = await UrlModel.findOne({ urlCode: req.params.urlCode })
        if (url) {
            return res.send({ status: true, message: 'url fetch successfully', data: url.longUrl })
        } else {
            return res.status(404).json({ status: false, message: 'No URL Found' })
        }

    }
    catch (err) {
        res.status(500).json({ status: false, message: err.message })
    }
}


module.exports.createUrl = createUrl;
module.exports.getUrl = getUrl;