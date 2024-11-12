
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('queryForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const resetButtonContainer = document.getElementById('resetButtonContainer');

        // Recupera il valore della query SPARQL dal campo di input
        const sparqlQuery = document.getElementById('queryInput').value;
        document.getElementById('queryInput').value = "";
        const tableContainer = document.getElementById('queryResultTableContainer');
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
                    tableContainer.innerHTML = '';
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
        console.log("ok");
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

        // Aggiorna il grafo con i nuovi nodi trovati
        window.graphNodes.clear();
        newNodes.forEach(node => window.graphNodes.add(node));
        console.log("query:", window.graphNodes);

        // Visualizza i risultati della query come tabella
        displayQueryResultsAsTable(jsonldData);
    } catch (error) {
        console.error("Errore durante l'elaborazione dei risultati della query:", error);
    }
}



function displayQueryResultsAsTable(data) {
    const container = document.getElementById('queryResultTableContainer');
    container.innerHTML = ''; // Resetta il contenitore

    // Crea la tabella
    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered', 'table-striped');

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Estrai le intestazioni delle colonne
    const headers = new Set();
    data.results.bindings.forEach(binding => {
        Object.keys(binding).forEach(key => headers.add(key));
    });

    // Costruisci l'header
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Costruisci il corpo della tabella
    data.results.bindings.forEach(binding => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const cell = document.createElement('td');
            cell.textContent = binding[header]?.value || 'N/A'; // Inserisci il valore o "N/A"
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);
}
