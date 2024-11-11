
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('queryForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const resetButtonContainer = document.getElementById('resetButtonContainer');

        // Recupera il valore della query SPARQL dal campo di input
        const sparqlQuery = document.getElementById('queryInput').value;
        document.getElementById('queryInput').value = "";
        // Crea una nuova richiesta XMLHttpRequest
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:8080/wodt/sparql', true);
        
        // Imposta l'header Content-Type
        xhr.setRequestHeader('Content-Type', 'application/sparql-query');
 
        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log('Risultato della query:', this.responseText);

                const resetButton = document.createElement('button');
                resetButton.id = 'resetGraph';
                resetButton.innerText = 'Reset';
                resetButton.classList.add('btn', 'btn-secondary', 'mx-2'); // Aggiungi classi per lo stile Bootstrap
                resetButtonContainer.appendChild(resetButton); 

                resetButton.addEventListener('click', function() {
                    window.graphNodes.clear();
                    resetButton.remove(); 
                    window.allNodes.forEach(node => window.graphNodes.add(node)); // Disattiva la query
                   
                });

                //displayTwinData(jsonldData); 
                updateGraphWithQueryResults(this.responseText); 
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

function updateGraphWithQueryResults(data) {
    try {
        console.log("ok")
        // Parsing della risposta (assumiamo che data sia una stringa JSON)
        const jsonldData = JSON.parse(data);

        // Crea un nuovo Set temporaneo per i nodi trovati nella query
        const newNodes = new Set();

        jsonldData.results.bindings.forEach(binding => {
            // Itera su tutte le chiavi di binding (ognuna è una variabile della query SPARQL)
            Object.keys(binding).forEach(key => {
                const value = binding[key]?.value; // Estrai il valore della variabile

                if (value) {
                    newNodes.add(value); // Aggiungi il valore al set dei nodi se esiste
                }
            });
        });

        // Ora aggiorna `Nodes` con i nuovi nodi trovati
        window.graphNodes.clear();
        newNodes.forEach(node => window.graphNodes.add(node));
        console.log("query:"+window.graphNodes)

    } catch (error) {
        console.error("Errore durante l'elaborazione dei risultati della query:", error);
    }
}


