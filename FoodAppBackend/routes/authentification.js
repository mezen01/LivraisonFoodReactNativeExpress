var express = require('express');
var router = express.Router();
const {userRegister,userLogin,checkUserExist,resetPassword,tokenRefresh} = require("../services/authentification.service")

router.post('/register', async(req, res, next) =>{
    let body = req.body;
    let reponse = await userRegister(body);
    res.json(reponse);
});

router.post('/login', async(req, res, next) =>{
    let body = req.body;
    let reponse = await userLogin(body);
    res.json(reponse);
});

router.get('/user-exist', async(req, res, next) =>{
    let params = req.query;
    let reponse = await checkUserExist(params);
    res.json(reponse);
});
router.post('/reset-password', async(req, res, next) =>{
    let body = req.body;
    let reponse = await resetPassword(body);
    res.json(reponse);
});
router.post("/refresh-token", tokenRefresh);

module.exports = router;
