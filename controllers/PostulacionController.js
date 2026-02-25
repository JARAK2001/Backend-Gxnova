const PostulacionService = require("../services/PostulacionService");

const PostulacionController = {
    async obtenerPostulaciones(req, res) {
        try {
            const filtros = {
                id_trabajo: req.query.id_trabajo,
                id_trabajador: req.query.id_trabajador,
                estado: req.query.estado
            };

            const postulaciones = await PostulacionService.obtenerPostulaciones(filtros);
            return res.status(200).json({ postulaciones });
        } catch (error) {
            console.error("Error en PostulacionController.obtenerPostulaciones:", error);
            return res.status(500).json({ error: 'Error al obtener las postulaciones.' });
        }
    },

    async obtenerPostulacionPorId(req, res) {
        const id = parseInt(req.params.id);

        try {
            const postulacion = await PostulacionService.obtenerPorId(id);

            if (!postulacion) {
                return res.status(404).json({ error: 'Postulación no encontrada.' });
            }

            return res.status(200).json({ postulacion });
        } catch (error) {
            console.error("Error en PostulacionController.obtenerPostulacionPorId:", error);
            return res.status(500).json({ error: 'Error al obtener la postulación.' });
        }
    },

    async crearPostulacion(req, res) {
        const { id_trabajo, mensaje } = req.body;

        if (!id_trabajo) {
            return res.status(400).json({ error: 'El id_trabajo es obligatorio.' });
        }

        try {
            const nuevaPostulacion = await PostulacionService.crearPostulacion({
                id_trabajo: parseInt(id_trabajo),
                id_trabajador: req.usuario.id_usuario,
                mensaje
            });

            return res.status(201).json({
                message: "Postulación creada exitosamente.",
                postulacion: nuevaPostulacion
            });
        } catch (error) {
            console.error("Error en PostulacionController.crearPostulacion:", error);
            return res.status(500).json({ error: 'Error al crear la postulación.' });
        }
    },

    async actualizarPostulacion(req, res) {
        const id = parseInt(req.params.id);

        try {
            const postulacionExistente = await PostulacionService.obtenerPorId(id);
            if (!postulacionExistente) {
                return res.status(404).json({ error: 'Postulación no encontrada.' });
            }

            // Solo el trabajador puede actualizar su postulación
            if (postulacionExistente.id_trabajador !== req.usuario.id_usuario) {
                return res.status(403).json({
                    error: 'No tienes permiso para actualizar esta postulación.'
                });
            }

            const postulacionActualizada = await PostulacionService.actualizarPostulacion(id, req.body);

            return res.status(200).json({
                message: "Postulación actualizada correctamente.",
                postulacion: postulacionActualizada
            });
        } catch (error) {
            console.error("Error en PostulacionController.actualizarPostulacion:", error);
            return res.status(500).json({ error: 'Error al actualizar la postulación.' });
        }
    },

    async eliminarPostulacion(req, res) {
        const id = parseInt(req.params.id);

        try {
            const postulacionExistente = await PostulacionService.obtenerPorId(id);
            if (!postulacionExistente) {
                return res.status(404).json({ error: 'Postulación no encontrada.' });
            }

            // Solo el trabajador puede eliminar su postulación
            if (postulacionExistente.id_trabajador !== req.usuario.id_usuario) {
                return res.status(403).json({
                    error: 'No tienes permiso para eliminar esta postulación.'
                });
            }

            await PostulacionService.eliminarPostulacion(id);

            return res.status(200).json({
                message: "Postulación eliminada correctamente."
            });
        } catch (error) {
            console.error("Error en PostulacionController.eliminarPostulacion:", error);
            return res.status(500).json({ error: 'Error al eliminar la postulación.' });
        }
    },

    async aceptarPostulacion(req, res) {
        const id = parseInt(req.params.id);

        try {
            const postulacionExistente = await PostulacionService.obtenerPorId(id);
            if (!postulacionExistente) {
                return res.status(404).json({ error: 'Postulación no encontrada.' });
            }

            // Solo el empleador del trabajo puede aceptar la postulación
            if (postulacionExistente.trabajo.id_empleador !== req.usuario.id_usuario) {
                return res.status(403).json({
                    error: 'No tienes permiso para aceptar esta postulación.'
                });
            }

            const postulacionAceptada = await PostulacionService.aceptarPostulacion(id);

            return res.status(200).json({
                message: "Postulación aceptada correctamente.",
                postulacion: postulacionAceptada
            });
        } catch (error) {
            console.error("Error en PostulacionController.aceptarPostulacion:", error);
            return res.status(500).json({ error: 'Error al aceptar la postulación.' });
        }
    },

    async rechazarPostulacion(req, res) {
        const id = parseInt(req.params.id);

        try {
            const postulacionExistente = await PostulacionService.obtenerPorId(id);
            if (!postulacionExistente) {
                return res.status(404).json({ error: 'Postulación no encontrada.' });
            }

            // Solo el empleador del trabajo puede rechazar la postulación
            if (postulacionExistente.trabajo.id_empleador !== req.usuario.id_usuario) {
                return res.status(403).json({
                    error: 'No tienes permiso para rechazar esta postulación.'
                });
            }

            const postulacionRechazada = await PostulacionService.rechazarPostulacion(id);

            return res.status(200).json({
                message: "Postulación rechazada correctamente.",
                postulacion: postulacionRechazada
            });
        } catch (error) {
            console.error("Error en PostulacionController.rechazarPostulacion:", error);
            return res.status(500).json({ error: 'Error al rechazar la postulación.' });
        }
    }
};

module.exports = PostulacionController;

