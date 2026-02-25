const express = require("express");
const router = express.Router();
const CalificacionController = require("../controllers/CalificacionController");
const verificarJWT = require("../middleware/AuthMiddleware");

// Crear calificación
router.post("/", verificarJWT, CalificacionController.crearCalificacion);

// Obtener calificaciones de un usuario
router.get("/usuario/:id", CalificacionController.obtenerCalificacionesUsuario);

// Obtener promedio de un usuario
router.get("/usuario/:id/promedio", CalificacionController.obtenerPromedioUsuario);

// Verificar si el usuario actual ya calificó un trabajo
router.get("/verificar", verificarJWT, CalificacionController.verificarSiYaCalifico);

module.exports = router;
