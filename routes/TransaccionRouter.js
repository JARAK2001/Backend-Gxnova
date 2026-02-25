const express = require("express");
const router = express.Router();
const TransaccionController = require("../controllers/TransaccionController");

const verificarJWT = require("../middleware/AuthMiddleware");
const { rolMiddleware } = require("../middleware/RolMiddleware");

// Obtener todas las transacciones (requiere autenticación)
router.get("/",
    verificarJWT,
    TransaccionController.obtenerTransacciones
);

// Obtener transacción por ID (requiere autenticación)
router.get("/:id",
    verificarJWT,
    TransaccionController.obtenerTransaccionPorId
);

// Crear transacción (requiere autenticación)
router.post("/",
    verificarJWT,
    TransaccionController.crearTransaccion
);

// Actualizar transacción (requiere autenticación)
router.put("/:id",
    verificarJWT,
    TransaccionController.actualizarTransaccion
);

// Eliminar transacción (requiere autenticación, solo Administrador)
router.delete("/:id",
    verificarJWT,
    rolMiddleware("Administrador"),
    TransaccionController.eliminarTransaccion
);

// Completar transacción manualmente (requiere autenticación)
router.patch("/:id/completar",
    verificarJWT,
    TransaccionController.completarTransaccion
);

// ────────────────────────────────────────────────
// DOBLE CONFIRMACIÓN
// ────────────────────────────────────────────────

// Confirmar pago (flujo dinero) — empleador marca pagado, trabajador confirma recepción
router.patch("/:id/confirmar-pago",
    verificarJWT,
    TransaccionController.confirmarPago
);

// Confirmar intercambio (flujo trueque) — cada parte pulsa "Intercambio Realizado"
router.patch("/:id/confirmar-intercambio",
    verificarJWT,
    TransaccionController.confirmarIntercambio
);

// Subir evidencia (URL de comprobante o foto del artículo)
router.patch("/:id/subir-evidencia",
    verificarJWT,
    TransaccionController.subirEvidencia
);

module.exports = router;
