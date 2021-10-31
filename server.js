import express from 'express';
import { createRequire } from 'module';
import cors from 'cors';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

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

APP.listen(PORT, () => console.log(`Backend Application listening at http://localhost:${PORT}`));

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