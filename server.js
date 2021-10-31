import express from 'express';
import { createRequire } from 'module';
import cors from 'cors';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { Server } from "socket.io";
import http from 'http';

// ES6 imports not supported for JSONs, so use the old 'require' syntax to import firestore credentials
const require = createRequire(import.meta.url);
var serviceAccount = require('./ansyncflutter-firebase-adminsdk-h0uqf-140748fd92.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

const APP = express();

// Enable CORs
APP.use(cors());
// Enable body parsing of JSON
APP.use(express.json());

const PORT = 3000;

// Initialize socket.io server
const SERVER = http.createServer(APP);
// Create socket.io server
const io = new Server(SERVER, {
    cors: { origin: '*' },
    allowEIO3: true
})

io.on('connection', (socket) => {
    console.log("A user has connected! Their socket ID is: " + socket.id);
});

// Create Firestore listener to tell all connected clients to update their water levels
const WATER_DOC = db.collection('water').doc('ansync');
const WATER_LISTENER = WATER_DOC.onSnapshot(docSnapshot => {
    // Only send update events if there is more than 1 client connected
    console.log('Document has been updated');
    io.emit('updatewater');
}, e => {
    console.log(`Error listening: ${e}`);
});


// Define API routes to get data from Firestore
APP.get('/', (req, res) => {
    console.log("Get request for water level");
    const waterLeveldoc = db.collection('water').doc('ansync');
    getWaterlevel(waterLeveldoc, res);
});

APP.post('/', (req, res) => {
    console.log('Got body: ', req.body);
    const waterLeveldoc = db.collection('water').doc('ansync');
    updateWaterlevel(req.body.newlevel, waterLeveldoc, res);
});

SERVER.listen(PORT, () => console.log(`Backend Application listening at http://localhost:${PORT}`));

// Firestore functions

async function updateWaterlevel(newLevel, document, res) {
    await document.set({
        level: newLevel
    });
    res.sendStatus(201);
}

async function getWaterlevel(document, res) {
    const waterDoc = await document.get();
    if (!waterDoc.exists) {
        console.log("Water Level does not exist");
    } else {
        // Send back the water level as a string
        res.send(waterDoc.data().level.toString());
    }
}