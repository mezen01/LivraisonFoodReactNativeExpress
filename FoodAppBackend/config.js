const config = require("./package.json").projectConfig


module.exports = {
    mongoConfig:{
        connectionUrl:config.mongodbConnectionURL,
        database:"foodelivery_db",
        collection:{
            USERS:"users",
            RESTAURANTS:"restaurants",
            CARTS:"carts",
            FOODS:"foods"
        },
    },
    serverConfig:{
        ip: config.serverIp,
        port: config.serverPort,
    },
    tokenSecret: "foodelivery_secret",
};