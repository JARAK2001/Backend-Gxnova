const express = require("express");
const router = express.Router();
const HistorialController = require("../controllers/HistorialController");

const { verificarJWT } = require("../middleware/AuthMiddleware");

// Obtener todos los historiales (requiere autenticación)
router.get("/",
    verificarJWT,
    HistorialController.obtenerHistoriales
);

// Obtener historial por ID (requiere autenticación)
router.get("/:id",
    verificarJWT,
    HistorialController.obtenerHistorialPorId
);

// Crear historial (requiere autenticación)
router.post("/",
    verificarJWT,
    HistorialController.crearHistorial
);

// Eliminar historial (requiere autenticación)
router.delete("/:id",
    verificarJWT,
    HistorialController.eliminarHistorial
);

module.exports = router;

