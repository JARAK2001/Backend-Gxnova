const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/AdminController");
const verificarJWT = require("../middleware/AuthMiddleware");
const { rolMiddleware } = require("../middleware/RolMiddleware");

// Primero verifica token, luego que sea administrador
router.use(verificarJWT, rolMiddleware('Administrador'));

// Estadísticas
router.get("/stats", AdminController.obtenerEstadisticas);
router.get("/analytics", AdminController.obtenerAnaliticas);

// Gestión de Usuarios
router.get("/usuarios", AdminController.obtenerTodosLosUsuarios);
router.patch("/usuarios/:id/status", AdminController.cambiarEstadoUsuario);
router.get("/verificaciones", AdminController.obtenerPendientesVerificacion);
router.post("/verificaciones/:id", AdminController.verificarUsuario);

// Gestión de Trabajos
router.get("/trabajos", AdminController.obtenerTodosLosTrabajos);
router.delete("/trabajos/:id", AdminController.eliminarTrabajo);

// Gestión de Reportes
router.get("/reportes", AdminController.obtenerReportes);
router.patch("/reportes/:id/resolver", AdminController.resolverReporte);
router.patch("/reportes/:id/rechazar", AdminController.rechazarReporte);

// Gestión de Roles
router.get("/roles", AdminController.obtenerRoles);
router.post("/roles", AdminController.crearRol);
router.put("/roles/:id", AdminController.actualizarRol);
router.delete("/roles/:id", AdminController.eliminarRol);

// Configuración del Sistema
router.get("/config", AdminController.obtenerConfiguracion);
router.put("/config", AdminController.actualizarConfiguracion);

module.exports = router;
