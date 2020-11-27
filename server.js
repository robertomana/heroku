"use strict";
const http = require('http');
const colors = require('colors');
const express = require('express');
const app = express()
const server = http.createServer(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 1337
const fs = require('fs');
const url = require('url');
const bodyParser = require('body-parser');

let mongo = require("mongodb");
let mongoClient = mongo.MongoClient;
const ObjectId = mongo.ObjectId;
const CONNECTIONSTRING = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const CONNECTIONOPTIONS = { useNewUrlParser: true, useUnifiedTopology: true };


/************************* gestione richieste HTTP ****************** */
server.listen(PORT, function() {
    console.log("Server in ascolto sulla porta " + PORT);
    init();
});
let paginaErrore = "";

function init(req, res) {
    fs.readFile("./static/error.html", function(err, data) {
        if (!err)
            paginaErrore = data.toString();
        else
            paginaErrore = "<h1>Risorsa non trovata</h1>"
    });
}


// 1. Request log
app.use("/", function(req, res, next) {
    console.log(req.method + " : " + req.originalUrl);
    next();
});

// 3 - route risorse statiche
app.use("/", express.static('./static'));


// 4 - routes di lettura dei parametri post
app.use("/", bodyParser.json());
app.use("/", bodyParser.urlencoded({ extended: true }));


// 5 -  route di Lettura dei parametri get inviati in formato JSON
app.use(function(req, res, next) {
    let _url = url.parse(req.url, false)
    let params = _url.query || "";
    params = decodeURIComponent(params);
    try { req["query"] = JSON.parse(params) } catch (error) {}
    next();
});


// 6 - log dei parametri 
app.use("/", function(req, res, next) {
    // if(req.query != {}) NOK perchè i puntatori sono diversi
    if (Object.keys(req.query).length != 0)
        console.log("------> Parametri GET: " + JSON.stringify(req.query));
    if (Object.keys(req.body).length != 0)
        console.log("------> Parametri BODY: " + JSON.stringify(req.body));
    next();
});



/* ************ */

app.get("/api/unicorns", function(req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function(err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al DB");
        } else {
            let db = client.db("unicorns");
            let collection = db.collection("unicorns");
            collection.find({ "gender": "m" })
                .toArray(function(err, data) {
                    if (err)
                        res.status(500).send("Errore esecuzione query");
                    else
                        res.send(data)
                })
        }
    });
})

app.post("/api/unicorns", function(req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function(err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al DB");
        } else {
            let db = client.db("unicorns");
            let collection = db.collection("unicorns");
            collection.find()
                .toArray(function(err, data) {
                    if (err)
                        res.status(500).send("Errore esecuzione query");
                    else
                        res.send(data)
                })
        }
    });
})

/* ************ */

// gestione degli errori
app.use(function(err, req, res, next) {
    if (!err.codice) {
        console.log(err.stack); // stack completo  
        err.codice = 500;
        err.message = "Internal Server Error"
    }
    res.status(err.codice);
    res.send(err.message);
});

// 2 - default route
app.use('/', function(req, res, next) {
    res.status(404)
    if (req.originalUrl.startsWith("/api/")) {
        // se status != 200 mando una semplice stringa
        res.send("Risorsa non trovata");
    } else res.send(paginaErrore);
});

/************************* gestione web socket ********************** */
let users = [];

io.on('connection', function(socket) {
    let user = {};

    // 1) ricezione username
    socket.on('username', function(username) {
        let item = users.find(function(item) {
                return (item.username == username)
            })
            // se user esiste già
        if (item != null) {
            socket.emit("userNOK", "")
            return;
        }

        user.username = username;
        user.socket = this;
        users.push(user);
        log('User ' + colors.yellow(user.username) + " (sockID=" + user.socket.id + ') connected!');

        if (user.username == "pippo" || user.username == "pluto")
            this.join("room1")
        else
            this.join("room2")
    });

    // 2) ricezione di un messaggio	 
    socket.on('message', function(data) {
        log('User ' + colors.yellow(user.username) + " (sockID=" + user.socket.id + ') sent ' + colors.green(data));
        let response = {
                'from': user.username,
                'message': data,
                'date': new Date()
            }
            /* notifico a tutti i socket (compreso il mittente) il messaggio ricevuto
            io.sockets.emit('notify_message', JSON.stringify(response)); */

        if (user.username == "pippo" || user.username == "pluto")
            io.to('room1').emit('notify_message', JSON.stringify(response));
        else
            io.to('room2').emit('notify_message', JSON.stringify(response));
    });

    // 3) user disconnected
    socket.on('disconnect', function() {
        log(' User ' + user.username + ' disconnected!');
    });
});


// stampa i log con data e ora
function log(data) {
    console.log(colors.cyan("[" + new Date().toLocaleTimeString() + "]") + ": " + data);
}