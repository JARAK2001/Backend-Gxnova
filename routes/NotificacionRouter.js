const express = require("express");
const router = express.Router();
const NotificacionController = require("../controllers/NotificacionController");

const verificarJWT = require("../middleware/AuthMiddleware");

// Obtener todas las notificaciones del usuario autenticado
router.get("/",
    verificarJWT,
    NotificacionController.obtenerNotificaciones
);

// Obtener notificaciones no leídas del usuario autenticado
router.get("/no-leidas",
    verificarJWT,
    NotificacionController.obtenerNoLeidas
);

// Obtener notificación por ID
router.get("/:id",
    verificarJWT,
    NotificacionController.obtenerNotificacionPorId
);

// Crear notificación (sistema interno o administrador)
router.post("/",
    verificarJWT,
    NotificacionController.crearNotificacion
);

// Actualizar notificación
router.put("/:id",
    verificarJWT,
    NotificacionController.actualizarNotificacion
);

// Eliminar notificación
router.delete("/:id",
    verificarJWT,
    NotificacionController.eliminarNotificacion
);

// Marcar notificación como leída
router.patch("/:id/leida",
    verificarJWT,
    NotificacionController.marcarComoLeida
);

// Marcar todas las notificaciones como leídas
router.patch("/marcar-todas-leidas",
    verificarJWT,
    NotificacionController.marcarTodasComoLeidas
);

module.exports = router;

