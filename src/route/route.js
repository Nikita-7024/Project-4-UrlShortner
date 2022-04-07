const express = require('express');
const router = express.Router();

const UrlController = require('../controllers/urlController')



router.post("/url/shorten", UrlController.createUrl)
router.get("/url/:urlCode", UrlController.getUrl)
// router.get("/fetchurl/:urlCode", UrlController.fetchUrl)



module.exports = router;