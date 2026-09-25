const express = require('express');
const app = express();
const path = require('path');

app.use(express.static('public'));

const pages = ['clothing', 'films', 'design', 'contact', 'about', 'product', 'cart', 'checkout', 'account', 'order'];
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', `${page}.html`));
    });
});

const PORT = process.env.PORT || 1313;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
