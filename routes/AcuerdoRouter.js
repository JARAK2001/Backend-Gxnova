const express = require("express");
const router = express.Router();
const AcuerdoController = require("../controllers/AcuerdoController");

const verificarJWT = require("../middleware/AuthMiddleware");

// Obtener todos los acuerdos (requiere autenticación)
router.get("/",
    verificarJWT,
    AcuerdoController.obtenerAcuerdos
);

// Obtener acuerdo por ID 
router.get("/:id",
    verificarJWT,
    AcuerdoController.obtenerAcuerdoPorId
);

// Crear acuerdo 
router.post("/",
    verificarJWT,
    AcuerdoController.crearAcuerdo
);

// Actualizar acuerdo 
router.put("/:id",
    verificarJWT,
    AcuerdoController.actualizarAcuerdo
);

// Eliminar acuerdo 
router.delete("/:id",
    verificarJWT,
    AcuerdoController.eliminarAcuerdo
);

// Aceptar acuerdo 
router.patch("/:id/aceptar",
    verificarJWT,
    AcuerdoController.aceptarAcuerdo
);

module.exports = router;

