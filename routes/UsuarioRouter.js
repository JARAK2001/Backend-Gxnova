const express = require("express");
const router = express.Router();
const UsuarioController = require("../controllers/UsuarioController");

const verificarJWT = require("../middleware/AuthMiddleware");
const { rolMiddleware } = require("../middleware/RolMiddleware");

router.get("/usuarios",
    verificarJWT,
    rolMiddleware("Administrador"),
    UsuarioController.obtenerUsuarios
);

router.get("/buscar-correo",
    verificarJWT,
    rolMiddleware("Administrador"),
    UsuarioController.obtenerUsuarioPorCorreo
);

router.post("/crear-usuario",
    verificarJWT,
    rolMiddleware("Administrador"),
    UsuarioController.crearUsuario
);


// OBTENER PERFIL DEL USUARIO
router.get("/perfil",
    verificarJWT,
    UsuarioController.obtenerPerfil
);

router.post("/agregar-rol",
    verificarJWT,
    UsuarioController.agregarRol
);



const upload = require('../middleware/UploadMiddleware');

router.put("/:id",
    verificarJWT,
    upload.single('foto_perfil'),
    UsuarioController.actualizarUsuario
);

// ELIMINAR CUENTA PROPIA
// DELETE /:id (El Controller verifica que el ID del token coincida con el ID de la ruta)
router.delete("/:id",
    verificarJWT,
    UsuarioController.eliminarUsuario
);

// OBTENER PERFIL PÚBLICO DE UN TRABAJADOR (sin autenticación)
router.get("/:id/perfil-publico",
    UsuarioController.obtenerPerfilPublico
);

module.exports = router;