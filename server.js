const express = require('express');
const app = express();
const path = require('path');

// Imposta la cartella 'public' come radice statica
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});
