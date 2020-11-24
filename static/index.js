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


   
});