document.addEventListener('DOMContentLoaded', function () {
    let network = null; // Variabile per il grafo
    let positions = {}; // Variabile per memorizzare le posizioni dei nodi
    const resultContainer = document.getElementById('nodeDetails'); //container per la visuaslizzazione delle informazioni del nodo

    function getKnowledgeGraph() {
        let xhr = new XMLHttpRequest();
        let url = "http://localhost:8080/wodt";
        xhr.open('GET', url);
        
        xhr.onreadystatechange = async function () {
            let DONE = 4; // Stato 4 indica che la richiesta è stata effettuata.
            let OK = 200; // Se la HTTP response ha stato 200 vuol dire che ha avuto successo.
            if (xhr.readyState === DONE) {
                console.log(xhr.status);
                if (xhr.status === OK) {
                    // I dati ricevuti sono in formato Turtle
                    let turtleData = xhr.responseText;
                    // Aspetta che la conversione Turtle -> JSON-LD sia completa
                    const jsonldData = await parseTurtleToJSONLD(turtleData);
                    createGraph(jsonldData);
                } else {
                    console.log('Error: ' + xhr.status); 
                }
            }
        };
        xhr.send();
    }

    // Funzione per convertire RDF Turtle in JSON-LD
    function parseTurtleToJSONLD(turtleData) {
        return new Promise((resolve, reject) => {
            const parser = new N3.Parser(); // Parser per Turtle
            const store = new N3.Store();   // Store per contenere i dati RDF

            // Array per memorizzare i dati JSON-LD
            let jsonld = [];

            // Parse dei dati RDF/Turtle e inserimento nel Store
            parser.parse(turtleData, (error, quad, prefixes) => {
                if (error) {
                    reject(error); // Se c'è un errore, lo rigettiamo
                }

                if (quad) {
                    store.addQuad(quad); // Aggiungi le quadruple (triplette RDF) allo store
                } else {
                    // Conversione da store a JSON-LD
                    jsonld = store.getQuads(null, null, null, null).map(q => {
                        return {
                            subject: q.subject.value,
                            predicate: q.predicate.value,
                            object: q.object.value
                        };
                    });

                    

                    resolve(jsonld); // Risolvi la Promise con i dati JSON-LD
                }
            });
        });
    }

    function createGraph(data) {
        const nodes = [];
        const edges = [];
        const dtSubjects = new Set(); // Set per tenere traccia dei DT

        // Identificare i soggetti che sono Digital Twin
        data.forEach(triple => {
            const { subject, predicate } = triple;

            // Qui usiamo un predicato generico per identificare i Digital Twin
            if (predicate === "https://purl.org/wodt/physicalAssetId") {
                dtSubjects.add(subject); // Aggiungi il soggetto come Digital Twin
            }
        });

        // Creare nodi e archi solo per i Digital Twin
        data.forEach(triple => {
            const { subject, predicate, object } = triple;

            // Solo se il soggetto è un DT
            if (dtSubjects.has(subject)) {

                // Aggiungi nodo per il soggetto se non esiste già
                if (!nodes.find(n => n.id === subject)) {
                    nodes.push({
                        id: subject,
                        label: subject,
                        x: positions[subject]?.x || undefined, // Mantieni la posizione X esistente se disponibile
                        y: positions[subject]?.y || undefined  // Mantieni la posizione Y esistente se disponibile
                    });
                }

                // Aggiungi nodo per l'oggetto se è anche un DT
                if (dtSubjects.has(object) && !nodes.find(n => n.id === object)) {
                    nodes.push({
                        id: object,
                        label: object,
                        x: positions[object]?.x || undefined, // Mantieni la posizione X esistente se disponibile
                        y: positions[object]?.y || undefined  // Mantieni la posizione Y esistente se disponibile
                    });
                }

                // Aggiungi un arco tra il soggetto e l'oggetto (DT -> DT)
                if (dtSubjects.has(object)) {
                    edges.push({ from: subject, to: object });
                }
            }
        });

        const container = document.getElementById('mynetwork');

        // Se il grafo esiste già, aggiorna i dati
        if (network) {
            // Memorizza le posizioni dei nodi esistenti
            positions = network.getPositions();

            // Aggiorna il grafo con i nuovi dati
            network.setData({
                nodes: new vis.DataSet(nodes),
                edges: new vis.DataSet(edges)
            });
        } else {
            // Crea un nuovo grafo se non esiste
            network = new vis.Network(container, { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) }, {
                physics: {
                    enabled: false,
                },
                manipulation: {
                    enabled: true,
                },
                nodes: {
                    shape: 'dot',
                    size: 16,
                    font: {
                        size: 12
                    }
                },
                edges: {
                    arrows: 'to',
                    font: {
                        align: 'middle'
                    }
                }
            });
        }

        // Evento per il click su un nodo
        network.on("click", function (params) {
            if (params.nodes.length > 0) {
                resultContainer.innerHTML = ''; 
                const nodeId = params.nodes[0]; // Ottieni l'ID del nodo cliccato
                getDigitalTwinData(nodeId); 
                //const button = document.createElement('button')
                //button.textContent = "Espandi nodo"
                //resultContainer.appendChild(button)
            }
        });
    }

    function getDigitalTwinData(digitalTwinUri) {
        const apiUrl = digitalTwinUri;
    
        let xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl);
    
        xhr.onreadystatechange = function () {
            let DONE = 4; // Stato 4 indica che la richiesta è stata effettuata.
            let OK = 200; // Se la HTTP response ha stato 200 vuol dire che ha avuto successo.
            if (xhr.readyState === DONE) {
                if (xhr.status === OK) {
                    let turtleData = xhr.responseText;
                    displayTwinData(turtleData)
                    console.log("dati del nodo" + turtleData);
                } else {
                    console.log('Error: ' + xhr.status); 
                }
            }
        };
        xhr.send();
    }

    async function displayTwinData(turtleData) {
        const jsonldData =  await parseTurtleToJSONLD(turtleData);
        resultContainer.innerHTML = ''; 

        if (!Array.isArray(jsonldData)) {
            console.error('Expected array but got:', jsonldData);
            return;
        }
        // Creazione della tabella
    const table = document.createElement('table');
    table.classList.add('table', 'table-striped'); // Usa le classi Bootstrap per la tabella

    // Creazione dell'intestazione della tabella
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Property</th>
            <th>Object</th>
        </tr>
    `;
    table.appendChild(thead);

    // Creazione del corpo della tabella
    const tbody = document.createElement('tbody');

    // Iterazione su ogni tripla JSON-LD per creare righe della tabella
    jsonldData.forEach(triple => {
        const row = document.createElement('tr');

        const propertyCell = document.createElement('td');
        propertyCell.textContent = triple.predicate || 'N/A';  // Mostra la proprietà

        const objectCell = document.createElement('td');
        objectCell.textContent = triple.object || 'N/A';  // Mostra l'oggetto

        row.appendChild(propertyCell);
        row.appendChild(objectCell);

        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    // Aggiungi la tabella al contenitore
    resultContainer.appendChild(table);
    }

    setInterval(getKnowledgeGraph, 2000);
    // Inizializza il grafo
    //getKnowledgeGraph();
});
