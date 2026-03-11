const express = require('express');
const router = express.Router();
const statsController = require('../controllers/StatsController');
const { verificarJWT } = require('../middleware/AuthMiddleware');
const { rolMiddleware } = require('../middleware/RolMiddleware');

// Obtener todas las ubicaciones para el mapa de calor (Público o logueado)
router.get('/heatmap', verificarJWT, statsController.getHeatmapData);

// Obtener los ingresos por barrio del trabajador logueado
router.get('/earnings', 
    verificarJWT, 
    rolMiddleware('Trabajador'), 
    statsController.getWorkerEarnings
);

module.exports = router;
