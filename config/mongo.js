const mongoose = require('mongoose')

let mongoServer

const dbConnect = async () => {
    if (process.env.NODE_ENV === 'test') { // Si estamos en modo de prueba, conectamos a la base de datos de prueba
        const db_uri = process.env.DB_URI_TEST
        mongoose.set('strictQuery', false)
        await mongoose.connect(db_uri)
    } else {
        const db_uri = process.env.DB_URI // Si no, conectamos a la base de datos de producción
        mongoose.set('strictQuery', false)
        await mongoose.connect(db_uri)
    }
}

const dbDisconnect = async () => {
    await mongoose.disconnect()
    if (mongoServer) {
        await mongoServer.stop()
    }
}

mongoose.connection.on('connected', () => console.log("Conectado a la BD"))
mongoose.connection.on('error', (e) => console.log(e.message))

module.exports = { dbConnect, dbDisconnect }


