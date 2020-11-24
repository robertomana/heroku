"use strict";
const http = require('http');
const colors = require('colors');
const express = require('express');
const app = express()
const server = http.createServer(app);


const PORT = 1337
const fs = require('fs');
const url = require('url');
const bodyParser = require('body-parser');
const cors = require('cors')


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
   
    res.send({"ris":"ok"})

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