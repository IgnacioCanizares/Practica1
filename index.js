require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3001;
const DB_URI = process.env.DB_URI|| 'mongodb://localhost:27017/practica1';

mongoose.connect(DB_URI)
.then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});