const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const upload = require("../middleware/UploadMiddleware");

// Paso 1: Registro de datos básicos (sin fotos)
router.post("/register", AuthController.register);

// Paso 2: Verificación de correo electrónico
router.post("/verificar-correo", AuthController.verificarCorreo);
router.post("/reenviar-codigo", AuthController.reenviarCodigo);

// Paso 3: Verificación de identidad con imágenes (Docker facial recognition)
router.post("/verificar-identidad",
    upload.fields([
        { name: 'foto_perfil', maxCount: 1 },
        { name: 'selfie', maxCount: 1 }
    ]),
    AuthController.verificarIdentidad
);

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// Recuperación de Contraseña
router.post("/recuperar-password", AuthController.recuperarPassword);
router.post("/reset-password", AuthController.resetPassword);

// Login Facial
router.post("/login-facial", upload.single('selfie'), AuthController.loginFacial);

module.exports = router;