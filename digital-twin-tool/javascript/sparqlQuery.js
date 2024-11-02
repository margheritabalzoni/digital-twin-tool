document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('queryForm').addEventListener('submit', function(event) {
        event.preventDefault();
        queryActive = true; 
        const resetButtonContainer = document.getElementById('resetButtonContainer');

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
                
                // Converte la risposta SPARQL JSON in un formato leggibile per displayTwinData
                const jsonData = JSON.parse(this.responseText);
                const jsonldData = jsonData.results.bindings.map(binding => ({
                    subject: binding.subject?.value || 'N/A',
                    predicate: binding.predicate?.value || 'N/A',
                    object: binding.object?.value || 'N/A'
                }));

                const resetButton = document.createElement('button');
                resetButton.id = 'resetGraph';
                resetButton.innerText = 'Reset';
                resetButton.classList.add('btn', 'btn-secondary', 'mx-2'); // Aggiungi classi per lo stile Bootstrap
                resetButtonContainer.appendChild(resetButton); 

                resetButton.addEventListener('click', function() {
                    queryActive = false; // Disattiva la query
                    resetButton.remove(); // Rimuovi il bottone di reset
                });

                //displayTwinData(jsonldData); 
                updateGraphWithQueryResults(jsonldData); 
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
        const nodes = [];
        const edges = [];
    
        data.forEach(triple => {
            const { subject, predicate, object } = triple;
    
            if (!nodes.find(n => n.id === subject)) {
                nodes.push({
                    id: subject,
                    label: subject
                });
            }
    
            if (!nodes.find(n => n.id === object)) {
                nodes.push({
                    id: object,
                    label: object
                });
            }
    
            edges.push({ from: subject, to: object, label: predicate });
        });
    
        // Ora accedi a `network` come `window.network`
        if (window.network) {
            window.network.setData({
                nodes: new vis.DataSet(nodes),
                edges: new vis.DataSet(edges)
            });
        } else {
            const container = document.getElementById('mynetwork');
            window.network = new vis.Network(container, { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) });
        }
    
    
}

