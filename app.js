const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

const { swaggerUi, specs } = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));


app.use('/api', require('./routes'));

module.exports = app;