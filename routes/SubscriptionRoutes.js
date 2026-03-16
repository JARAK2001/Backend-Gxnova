const express = require("express");
const { verificarJWT } = require("../middleware/AuthMiddleware.js");
const SubscriptionController = require("../controllers/SubscriptionController.js");

const router = express.Router();

// Obtener estado de suscripción actual
router.get(
  "/status",
  verificarJWT,
  SubscriptionController.getSubscriptionStatus
);

// Simular mejora a plan premium
router.post(
  "/upgrade",
  verificarJWT,
  // Aquí podríamos validar datos de tarjeta o token de Stripe ej: body("paymentMethodId").notEmpty()
  SubscriptionController.upgradeToPremium
);

module.exports = router;
