const express = require("express");
const router = express.Router();
const CategoriaController = require("../controllers/CategoriaController");

const verificarJWT = require("../middleware/AuthMiddleware");
const { rolMiddleware } = require("../middleware/RolMiddleware");

// Obtener todas las categorías
router.get("/", CategoriaController.obtenerCategorias);

// Obtener categoría por ID
router.get("/:id", CategoriaController.obtenerCategoriaPorId);

// Crear categoría (solo Administrador)
router.post("/",
    verificarJWT,
    rolMiddleware("Administrador"),
    CategoriaController.crearCategoria
);

// Actualizar categoría (solo Administrador)
router.put("/:id",
    verificarJWT,
    rolMiddleware("Administrador"),
    CategoriaController.actualizarCategoria
);

// Eliminar categoría (solo Administrador)
router.delete("/:id",
    verificarJWT,
    rolMiddleware("Administrador"),
    CategoriaController.eliminarCategoria
);

module.exports = router;

