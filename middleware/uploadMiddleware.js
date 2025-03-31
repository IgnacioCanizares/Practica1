const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Aqui se podria utilizar un numero aleatorio dado por ejemplo con el timestamp y un numero aleatorio, para asi evitar overrides de logos con el mismo nombre, para este  caso no lo incluiré.
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) { // Utilizamos una funcion que comprueba que el fichero enviado sea formato imagen (jpg, png, jpeg, etc)
        cb(null, true);
    } else {
        cb(new Error('No es una imagen, por favor sube un archivo imagen.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Ponemos un limite de 5MB, he visto que hay problemas si no lo haces asi. Se puede subir un archivo muy grande y tirar el servidor.
    },
    fileFilter: fileFilter
});

module.exports = upload;