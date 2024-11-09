window.graphNodes = new Set();
window.network = null; // Variabile globale per la rete
window.allNodes = new Set(); // Lista di tutti i nodi nel grafo

let positions = {}; // Memorizza le posizioni dei nodi
const resultContainer = document.getElementById('nodeDetails'); // Contenitore dei dettagli del nodo




// Funzione principale per iniziare a caricare il grafo e altre funzioni
document.addEventListener('DOMContentLoaded', function () {
    initializeNodes();
    initializeGraph();
    setInterval(async () => {
        
       
            const jsonldData = await getKnowledgeGraph();
            createGraph(jsonldData); 
      

    }, 2000);
});

async function initializeNodes(){
    try {

        const jsonldData = await getKnowledgeGraph();
  
        jsonldData.forEach(triple => {
            const { subject, predicate } = triple;
            if (predicate === "https://purl.org/wodt/physicalAssetId") {
                allNodes.add(subject);
            }
        });
        graphNodes.clear();
        allNodes.forEach(node => graphNodes.add(node)); 
        
    } catch (error) {
        console.error("Errore durante l'inizializzazione dei nodi:", error);
    }
}




function initializeGraph() {
    // Inizializza il grafo se non esiste
    const container = document.getElementById('mynetwork');
    if (!network) {
        network = new vis.Network(container, {}, {
            physics: { enabled: false },
            manipulation: { enabled: true },
            nodes: { shape: 'dot', size: 16, font: { size: 12 } },
            edges: { arrows: 'to', font: { align: 'middle' } }
        });

        // Aggiungi evento di click per i nodi
        network.on("click", function (params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0]; // Ottieni l'ID del nodo cliccato
                getDigitalTwinData(nodeId); // Ottieni i dati del Digital Twin
            }
        });
    }
}

// Funzione per ottenere il Knowledge Graph
async function getKnowledgeGraph() {
    const url = "http://localhost:8080/wodt";
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const turtleData = await response.text();
        const jsonldData = await parseTurtleToJSONLD(turtleData);
    
        return jsonldData;
        
    } catch (error) {
        console.error('Error fetching or parsing knowledge graph:', error);
    }
}

// Funzione per convertire i dati RDF Turtle in JSON-LD
function parseTurtleToJSONLD(turtleData) {
    return new Promise((resolve, reject) => {
        const parser = new N3.Parser();
        const store = new N3.Store();
        let jsonld = [];

        parser.parse(turtleData, (error, quad) => {
            if (error) return reject(error);
            if (quad) store.addQuad(quad);
            else {
                jsonld = store.getQuads(null, null, null, null).map(q => ({
                    subject: q.subject.value,
                    predicate: q.predicate.value,
                    object: q.object.value
                }));
                resolve(jsonld);
            }
        });
    });
}

// Funzione per creare il grafo a partire dai dati JSON-LD
function createGraph(data) {
    const nodes = [];
    const edges = [];
  
    console.log(graphNodes)
    // Crea nodi e archi solo per i Digital Twin
    data.forEach(triple => {
        const { subject, predicate, object } = triple;
        if (graphNodes.has(subject)) {
            addNode(subject, nodes);
            if (graphNodes.has(object)) {
                addNode(object, nodes);
                edges.push({ from: subject, to: object });
            }
        }
    });

    // Aggiorna o crea il grafo
    updateGraph(nodes, edges);
}

// Funzione per aggiungere un nodo se non esiste già
function addNode(id, nodes) {
    if (!nodes.find(n => n.id === id)) {
        nodes.push({
            id: id,
            label: id,
            x: positions[id]?.x,
            y: positions[id]?.y
        });
    }
}

// Funzione per aggiornare il grafo esistente
function updateGraph(nodes, edges) {
    if (network) {
        positions = network.getPositions(); // Memorizza le posizioni dei nodi esistenti
        network.setData({
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        });
    }
}

// Funzione per ottenere i dati di un Digital Twin
async function getDigitalTwinData(digitalTwinUri) {
    try {
        const response = await fetch(digitalTwinUri);
        if (!response.ok) {
            throw new Error(`Error fetching data for Digital Twin: ${response.status}`);
        }

        const turtleData = await response.text();
        displayTwinData(turtleData);
    } catch (error) {
        console.error('Error fetching digital twin data:', error);
    }
}

async function displayTwinData(turtleData) {
    const jsonldData = await parseTurtleToJSONLD(turtleData);

    // Verifica se resultContainer esiste
    const resultContainer = document.getElementById('nodeDetails');
    if (!resultContainer) {
        console.error('Element #nodeDetails not found');
        return; // Se il contenitore non esiste, non fare nulla
    }

    resultContainer.innerHTML = ''; // Pulisce i dettagli precedenti

    if (!Array.isArray(jsonldData)) {
        console.error('Expected array but got:', jsonldData);
        return;
    }

    const table = createTable(jsonldData);
    resultContainer.appendChild(table);
}

// Funzione per creare la tabella per i dati del Digital Twin
function createTable(jsonldData) {
    const table = document.createElement('table');
    table.classList.add('table', 'table-striped');

    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>Property</th><th>Object</th></tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    jsonldData.forEach(triple => {
        const row = document.createElement('tr');
        const propertyCell = document.createElement('td');
        propertyCell.textContent = triple.predicate || 'N/A';
        const objectCell = document.createElement('td');
        objectCell.textContent = triple.object || 'N/A';
        row.appendChild(propertyCell);
        row.appendChild(objectCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
}
