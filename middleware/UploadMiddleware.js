const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

if (!process.env.CLOUDINARY_URL) {
    console.warn("ADVERTENCIA: CLOUDINARY_URL no está definida en .env");
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'gxnova_trabajos',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('No es una imagen! Por favor sube solo imágenes.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB
    }
});

module.exports = upload;
