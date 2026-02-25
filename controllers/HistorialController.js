const HistorialService = require("../services/HistorialService");

const HistorialController = {
    async obtenerHistoriales(req, res) {
        try {
            const filtros = {
                id_usuario: req.query.id_usuario,
                id_trabajo: req.query.id_trabajo
            };

            const historiales = await HistorialService.obtenerHistoriales(filtros);
            return res.status(200).json({ historiales });
        } catch (error) {
            console.error("Error en HistorialController.obtenerHistoriales:", error);
            return res.status(500).json({ error: 'Error al obtener el historial.' });
        }
    },

    async obtenerHistorialPorId(req, res) {
        const id = parseInt(req.params.id);

        try {
            const historial = await HistorialService.obtenerPorId(id);

            if (!historial) {
                return res.status(404).json({ error: 'Registro de historial no encontrado.' });
            }

            return res.status(200).json({ historial });
        } catch (error) {
            console.error("Error en HistorialController.obtenerHistorialPorId:", error);
            return res.status(500).json({ error: 'Error al obtener el registro de historial.' });
        }
    },

    async crearHistorial(req, res) {
        const { id_trabajo, descripcion } = req.body;

        if (!id_trabajo) {
            return res.status(400).json({
                error: 'El id_trabajo es obligatorio.'
            });
        }

        try {
            const nuevoHistorial = await HistorialService.crearHistorial({
                id_usuario: req.usuario.id_usuario,
                id_trabajo: parseInt(id_trabajo),
                descripcion
            });

            return res.status(201).json({
                message: "Registro de historial creado exitosamente.",
                historial: nuevoHistorial
            });
        } catch (error) {
            console.error("Error en HistorialController.crearHistorial:", error);
            return res.status(500).json({ error: 'Error al crear el registro de historial.' });
        }
    },

    async eliminarHistorial(req, res) {
        const id = parseInt(req.params.id);

        try {
            const historialExistente = await HistorialService.obtenerPorId(id);
            if (!historialExistente) {
                return res.status(404).json({ error: 'Registro de historial no encontrado.' });
            }

            // Solo el usuario del historial o un administrador pueden eliminarlo
            const esUsuario = historialExistente.id_usuario === req.usuario.id_usuario;
            const esAdmin = req.usuario.rolesAsignados?.some(
                r => r.rol.nombre === 'Administrador'
            );

            if (!esUsuario && !esAdmin) {
                return res.status(403).json({
                    error: 'No tienes permiso para eliminar este registro de historial.'
                });
            }

            await HistorialService.eliminarHistorial(id);

            return res.status(200).json({
                message: "Registro de historial eliminado correctamente."
            });
        } catch (error) {
            console.error("Error en HistorialController.eliminarHistorial:", error);
            return res.status(500).json({ error: 'Error al eliminar el registro de historial.' });
        }
    }
};

module.exports = HistorialController;

