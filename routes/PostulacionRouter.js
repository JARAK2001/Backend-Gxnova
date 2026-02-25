const express = require("express");
const router = express.Router();
const PostulacionController = require("../controllers/PostulacionController");

const verificarJWT = require("../middleware/AuthMiddleware");
const { rolMiddleware } = require("../middleware/RolMiddleware");

// Obtener todas las postulaciones (requiere autenticación)
router.get("/",
    verificarJWT,
    PostulacionController.obtenerPostulaciones
);

// Obtener postulación por ID (requiere autenticación)
router.get("/:id",
    verificarJWT,
    PostulacionController.obtenerPostulacionPorId
);

// Crear postulación (requiere autenticación, rol Trabajador)
router.post("/",
    verificarJWT,
    rolMiddleware("Trabajador", "Administrador"),
    PostulacionController.crearPostulacion
);

// Actualizar postulación (requiere autenticación)
router.put("/:id",
    verificarJWT,
    PostulacionController.actualizarPostulacion
);

// Eliminar postulación (requiere autenticación)
router.delete("/:id",
    verificarJWT,
    PostulacionController.eliminarPostulacion
);

// Aceptar postulación (requiere autenticación, solo empleador)
router.patch("/:id/aceptar",
    verificarJWT,
    PostulacionController.aceptarPostulacion
);

// Rechazar postulación (requiere autenticación, solo empleador)
router.patch("/:id/rechazar",
    verificarJWT,
    PostulacionController.rechazarPostulacion
);

module.exports = router;

