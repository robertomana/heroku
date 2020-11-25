$(document).ready(function() {

    /* *************** gestione richieste http ************** */
    $("#btnUnicorns").on("click", function() {
        let request = inviaRichiesta("get", "/api/unicorns");
        request.fail(errore);
        request.done(function(data) {
            console.log(data)
            alert("ok")
        });
    })

 /* ********************* gestione socket **************** */
    let username = prompt("Inserisci lo username:");

    // io.connect é SINCRONO, bloccante
    let socket = io.connect()

    /* 1a) lo username viene inviato SOLO a connessione avvenuta
	       in questo modo si evita di connetere/disconnettere + volte*/
    socket.on('connect', function() {
        socket.emit("username", username);
        console.log("connessione ok");
    });

    // 1b) utente non valido
    socket.on('userNOK', function(data) {
        alert("Nomme già esistente. Scegliere un altro nome")
        username = prompt("Inserisci lo username:");
        socket.emit("username", username);
    });


    // 2a) invio messaggio
    $("#btnInvia").click(function() {
        let msg = $("#txtMessage").val();
        socket.emit("message", msg);
    });

    // 2b) ricezione della risposta
    socket.on('notify_message', function(data) {
        // ricezione di un messaggio dal server			
        data = JSON.parse(data);
        visualizza(data.from, data.message, data.date);
    });


    // 3) disconnessione
    $("#btnDisconnetti").click(function() {
        socket.disconnect();
    });

    socket.on('disconnect', function() {
        alert("Sei stato disconnesso!");
    });


    function visualizza(username, message, date) {
        let wrapper = $("#wrapper")
        let container = $("<div class='message-container'></div>");
        container.appendTo(wrapper);

        // username e date
        date = new Date(date);
        let mittente = $("<small class='message-from'>" + username + " @" + date.toLocaleTimeString() + "</small>");
        mittente.appendTo(container);

        // messaggio
        message = $("<p class='message-data'>" + message + "</p>");
        message.appendTo(container);

        // auto-scroll dei messaggi
        /* la proprietà html scrollHeight rappresenta l'altezza di wrapper oppure
           l'altezza del testo interno qualora questo ecceda l'altezza di wrapper */
        let h = wrapper.prop("scrollHeight");
        // fa scorrere il testo verso l'alto in 500ms
        wrapper.animate({ "scrollTop": h }, 500);
    }
   
});