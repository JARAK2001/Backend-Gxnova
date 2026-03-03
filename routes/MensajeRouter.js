const express = require('express');
const router = express.Router();
const MensajeController = require('../controllers/MensajeController');
const { verificarJWT } = require('../middleware/AuthMiddleware');

// RUTAS DEL CHAT (Protegidas)
router.use(verificarJWT);

// Obtener todas las conversaciones activas del usuario
router.get('/conversaciones', MensajeController.obtenerConversacionesUsuario);

// Obtener historial de mensajes de una conversación específica
router.get('/conversaciones/:id/mensajes', MensajeController.obtenerMensajesDeConversacion);

// Enviar un nuevo mensaje
router.post('/mensajes', MensajeController.enviarMensaje);

module.exports = router;
