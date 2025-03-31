const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routers = require('./routes');
const dbConnect = require('./config/mongo.js');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.json({
        message: 'Directorio raíz',
        status: 'ok'
    });
});

app.use('/api', routers);

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`Escuchando en el puerto ${port}`);
});

dbConnect();