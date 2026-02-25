const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");

const upload = require("../middleware/UploadMiddleware");

router.post("/register",
    upload.fields([
        { name: 'foto_cedula', maxCount: 1 },
        { name: 'foto_perfil', maxCount: 1 },
        { name: 'selfie', maxCount: 1 }
    ]),
    AuthController.register
);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

module.exports = router;