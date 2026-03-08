const express = require('express');
const router = express.Router();
const multer = require('multer');
const HabilidadController = require('../controllers/HabilidadController');
const { verificarJWT } = require('../middleware/AuthMiddleware');

// Configuración de multer en memoria para validar certificados sin subirlos a Cloudinary inmediatamente
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

// Agregar una habilidad (ahora requiere certificado en el form-data "certificado")
router.post('/', verificarJWT, upload.single('certificado'), HabilidadController.agregar);

// Listar habilidades de un usuario
router.get('/usuario/:id', HabilidadController.listarPorUsuario);

// Buscar habilidades por categoría
router.get('/categoria/:id', HabilidadController.buscarPorCategoria);

// Eliminar una habilidad
router.delete('/:id', verificarJWT, HabilidadController.eliminar);

module.exports = router;
