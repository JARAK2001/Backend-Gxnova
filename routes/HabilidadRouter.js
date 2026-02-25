const express = require('express');
const router = express.Router();
const HabilidadController = require('../controllers/HabilidadController');
const verificarJWT = require('../middleware/AuthMiddleware');

// Agregar una habilidad
router.post('/', verificarJWT, HabilidadController.agregar);

// Listar habilidades de un usuario
router.get('/usuario/:id', HabilidadController.listarPorUsuario);

// Buscar habilidades por categoría
router.get('/categoria/:id', HabilidadController.buscarPorCategoria);

// Eliminar una habilidad
router.delete('/:id', verificarJWT, HabilidadController.eliminar);

module.exports = router;
