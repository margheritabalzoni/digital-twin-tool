document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('queryForm').addEventListener('submit', function(event) {
        event.preventDefault();

        // Recupera il valore della query SPARQL dal campo di input
        const sparqlQuery = document.getElementById('queryInput').value;

        // Crea una nuova richiesta XMLHttpRequest
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:8080/wodt/sparql', true);
        
        // Imposta l'header Content-Type
        xhr.setRequestHeader('Content-Type', 'application/sparql-query');
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log('Risultato della query:', this.responseText);
            } else {
                console.error('Errore durante l\'esecuzione della query:', xhr.statusText);
            }
        };

        xhr.onerror = function() {
            console.error('Errore di rete. Non è stato possibile completare la richiesta.');
        };

        // Invia la query SPARQL ottenuta dall'input
        xhr.send(sparqlQuery);
    });
});
