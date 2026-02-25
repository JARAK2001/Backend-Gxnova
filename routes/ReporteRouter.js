const express = require("express");
const router = express.Router();
const ReporteController = require("../controllers/ReporteController");

const verificarJWT = require("../middleware/AuthMiddleware");
const { rolMiddleware } = require("../middleware/RolMiddleware");

// Obtener todos los reportes (requiere autenticación, solo Administrador)
router.get("/",
    verificarJWT,
    rolMiddleware("Administrador"),
    ReporteController.obtenerReportes
);

// Obtener reporte por ID (requiere autenticación)
router.get("/:id",
    verificarJWT,
    ReporteController.obtenerReportePorId
);

// Crear reporte (requiere autenticación)
router.post("/",
    verificarJWT,
    ReporteController.crearReporte
);

// Actualizar reporte (requiere autenticación)
router.put("/:id",
    verificarJWT,
    ReporteController.actualizarReporte
);

// Eliminar reporte (requiere autenticación, solo Administrador)
router.delete("/:id",
    verificarJWT,
    rolMiddleware("Administrador"),
    ReporteController.eliminarReporte
);

// Resolver reporte (requiere autenticación, solo Administrador)
router.patch("/:id/resolver",
    verificarJWT,
    rolMiddleware("Administrador"),
    ReporteController.resolverReporte
);

module.exports = router;

