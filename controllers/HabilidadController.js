const HabilidadService = require('../services/HabilidadService');

const HabilidadController = {
    async agregar(req, res) {
        try {
            const id_usuario = req.usuario.id_usuario; 
            const habilidad = await HabilidadService.agregarHabilidad(id_usuario, req.body);
            res.status(201).json(habilidad);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async listarPorUsuario(req, res) {
        try {
            const { id } = req.params;
            const habilidades = await HabilidadService.obtenerHabilidadesUsuario(parseInt(id));
            res.json(habilidades);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const id_usuario = req.usuario.id_usuario;
            await HabilidadService.eliminarHabilidad(id, id_usuario);
            res.json({ message: 'Habilidad eliminada correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async buscarPorCategoria(req, res) {
        try {
            const { id } = req.params;
            const resultados = await HabilidadService.buscarPorCategoria(id);
            res.json(resultados);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = HabilidadController;
