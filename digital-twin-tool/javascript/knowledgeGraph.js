document.addEventListener('DOMContentLoaded', function () {
    
    function getKnowledgeGraph() {
        let xhr = new XMLHttpRequest();
        let url = "http://localhost:8080/wodt";
        xhr.open('GET', url);
        
        xhr.onreadystatechange = function () {
            let DONE = 4; // Stato 4 indica che la richiesta è stata effettuata.
            let OK = 200; // Se la HTTP response ha stato 200 vuol dire che ha avuto successo.
            if (xhr.readyState === DONE) {
                console.log(xhr.status);
                if (xhr.status === OK) {
                    // I dati ricevuti sono in formato Turtle
                    let turtleData = xhr.responseText;
                    console.log("Turtle Data:", turtleData);
    
                    parseTurtleToJSONLD(turtleData);
                } else {
                    console.log('Error: ' + xhr.status); 
                }
            }
        };
        xhr.send();
    }

       // Funzione per convertire RDF Turtle in JSON-LD
       function parseTurtleToJSONLD(turtleData) {
       
        const parser = new N3.Parser(); // Parser per Turtle
        const store = new N3.Store();   // Store per contenere i dati RDF

        // Parse dei dati RDF/Turtle e inserimento nel Store
        parser.parse(turtleData, (error, quad, prefixes) => {
            if (quad) {
                store.addQuad(quad); // Aggiungi le quadruple (triplette RDF) allo store
            } else {
                // Conversione da store a JSON-LD
                const jsonld = store.getQuads(null, null, null, null).map(q => {
                    return {
                        subject: q.subject.value,
                        predicate: q.predicate.value,
                        object: q.object.value
                    };
                });

                console.log(jsonld)
               
                createGraph(jsonld);
            }
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

        console.log(dtSubjects.has("http://localhost:3002/"))
        // Creare nodi e archi solo per i Digital Twin
        data.forEach(triple => {
            const { subject, predicate, object } = triple;

            // Solo se il soggetto è un DT
            if (dtSubjects.has(subject)) {

                // Aggiungi nodo per il soggetto se non esiste già
                if (!nodes.find(n => n.id === subject)) {
                    nodes.push({ id: subject, label: subject });
                }

                // Aggiungi nodo per l'oggetto se è anche un DT
                if (dtSubjects.has(object) && !nodes.find(n => n.id === object)) {
                    nodes.push({ id: object, label: object });
                }

                // Aggiungi un arco tra il soggetto e l'oggetto (DT -> DT)
                if (dtSubjects.has(object)) {
                    edges.push({ from: subject, to: object});
                }
            }
        });

        
    const container = document.getElementById('mynetwork');
    const network = new vis.Network(container, { nodes: nodes, edges: edges }, {
        physics: {
            enabled: true,
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

    // Evento per il click su un nodo
    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0]; // Ottieni l'ID del nodo cliccato
            console.log("Nodo cliccato con ID:", nodeId);
            getDigitalTwinData(nodeId); 
            console.log(nodeId)
        }
    });
  
    }


function getDigitalTwinData(digitalTwinUri) {
    const apiUrl = `http://localhost:8080/wodt/` + digitalTwinUri;
   
        let xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl);
    
        xhr.onreadystatechange = function () {
            let DONE = 4; // Stato 4 indica che la richiesta è stata effettuata.
            let OK = 200; // Se la HTTP response ha stato 200 vuol dire che ha avuto successo.
            if (xhr.readyState === DONE) {
                console.log(xhr.status);
                if (xhr.status === OK) {
                    // I dati ricevuti sono in formato Turtle
                    let turtleData = xhr.responseText;
                    //console.log("Turtle Data:", turtleData);
    
                   console.log("dati del nodo" + turtleData)
                } else {
                    console.log('Error: ' + xhr.status); // Lo stato della HTTP response.
                }
            }
        };
        xhr.send();
    
}

// Funzione per visualizzare i dati del Digital Twin (esempio di output nel DOM)
function displayTwinData(turtleData) {
    console.log(turtleData)
    const resultContainer = document.getElementById('result'); // Assicurati di avere un div con questo ID
    resultContainer.textContent = turtleData; // Mostra i dati ricevuti
}

    getKnowledgeGraph()

})

