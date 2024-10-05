document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('queryForm').addEventListener('submit', function(event) {
        event.preventDefault();  

        const sparqlQuery = document.getElementById('queryInput').value;

        const requestBody = {
            query: sparqlQuery
        };

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:8080/wodt/sparql', true); 
        xhr.setRequestHeader('Content-Type', 'application/json'); 

        xhr.onload = function() {
            const resultsDiv = document.getElementById('results');

            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                resultsDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            } else {
                resultsDiv.innerHTML = `<p style="color: red;">Errore durante l'esecuzione della query: ${xhr.statusText}</p>`;
            }
        };

        xhr.onerror = function() {
            document.getElementById('results').innerHTML = `<p style="color: red;">Errore di rete. Non è stato possibile completare la richiesta.</p>`;
        };

        xhr.send(JSON.stringify(requestBody));
    });
});
