const NotificacionService = require("../services/NotificacionService");

const NotificacionController = {
    async obtenerNotificaciones(req, res) {
        try {
            const filtros = {
                id_usuario: req.query.id_usuario || req.usuario.id_usuario,
                leida: req.query.leida,
                tipo: req.query.tipo
            };

            const notificaciones = await NotificacionService.obtenerNotificaciones(filtros);
            return res.status(200).json({ notificaciones });
        } catch (error) {
            console.error("Error en NotificacionController.obtenerNotificaciones:", error);
            return res.status(500).json({ error: 'Error al obtener las notificaciones.' });
        }
    },

    async obtenerNotificacionPorId(req, res) {
        const id = parseInt(req.params.id);

        try {
            const notificacion = await NotificacionService.obtenerPorId(id);

            if (!notificacion) {
                return res.status(404).json({ error: 'Notificación no encontrada.' });
            }

            // Solo el usuario puede ver sus propias notificaciones
            if (notificacion.id_usuario !== req.usuario.id_usuario) {
                return res.status(403).json({
                    error: 'No tienes permiso para ver esta notificación.'
                });
            }

            return res.status(200).json({ notificacion });
        } catch (error) {
            console.error("Error en NotificacionController.obtenerNotificacionPorId:", error);
            return res.status(500).json({ error: 'Error al obtener la notificación.' });
        }
    },

    async crearNotificacion(req, res) {
        const { id_usuario, tipo, mensaje } = req.body;

        if (!id_usuario || !tipo) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: id_usuario, tipo.'
            });
        }

        try {
            const nuevaNotificacion = await NotificacionService.crearNotificacion({
                id_usuario: parseInt(id_usuario),
                tipo,
                mensaje
            });

            return res.status(201).json({
                message: "Notificación creada exitosamente.",
                notificacion: nuevaNotificacion
            });
        } catch (error) {
            console.error("Error en NotificacionController.crearNotificacion:", error);
            return res.status(500).json({ error: 'Error al crear la notificación.' });
        }
    },

    async actualizarNotificacion(req, res) {
        const id = parseInt(req.params.id);

        try {
            const notificacionExistente = await NotificacionService.obtenerPorId(id);
            if (!notificacionExistente) {
                return res.status(404).json({ error: 'Notificación no encontrada.' });
            }

            // Solo el usuario puede actualizar sus propias notificaciones
            if (notificacionExistente.id_usuario !== req.usuario.id_usuario) {
                return res.status(403).json({
                    error: 'No tienes permiso para actualizar esta notificación.'
                });
            }

            const notificacionActualizada = await NotificacionService.actualizarNotificacion(id, req.body);

            return res.status(200).json({
                message: "Notificación actualizada correctamente.",
                notificacion: notificacionActualizada
            });
        } catch (error) {
            console.error("Error en NotificacionController.actualizarNotificacion:", error);
            return res.status(500).json({ error: 'Error al actualizar la notificación.' });
        }
    },

    async eliminarNotificacion(req, res) {
        const id = parseInt(req.params.id);

        try {
            const notificacionExistente = await NotificacionService.obtenerPorId(id);
            if (!notificacionExistente) {
                return res.status(404).json({ error: 'Notificación no encontrada.' });
            }

            // Solo el usuario puede eliminar sus propias notificaciones
            if (notificacionExistente.id_usuario !== req.usuario.id_usuario) {
                return res.status(403).json({
                    error: 'No tienes permiso para eliminar esta notificación.'
                });
            }

            await NotificacionService.eliminarNotificacion(id);

            return res.status(200).json({
                message: "Notificación eliminada correctamente."
            });
        } catch (error) {
            console.error("Error en NotificacionController.eliminarNotificacion:", error);
            return res.status(500).json({ error: 'Error al eliminar la notificación.' });
        }
    },

    async marcarComoLeida(req, res) {
        const id = parseInt(req.params.id);

        try {
            const notificacionExistente = await NotificacionService.obtenerPorId(id);
            if (!notificacionExistente) {
                return res.status(404).json({ error: 'Notificación no encontrada.' });
            }

            // Solo el usuario puede marcar sus propias notificaciones
            if (notificacionExistente.id_usuario !== req.usuario.id_usuario) {
                return res.status(403).json({
                    error: 'No tienes permiso para marcar esta notificación.'
                });
            }

            const notificacionLeida = await NotificacionService.marcarComoLeida(id);

            return res.status(200).json({
                message: "Notificación marcada como leída.",
                notificacion: notificacionLeida
            });
        } catch (error) {
            console.error("Error en NotificacionController.marcarComoLeida:", error);
            return res.status(500).json({ error: 'Error al marcar la notificación como leída.' });
        }
    },

    async marcarTodasComoLeidas(req, res) {
        try {
            await NotificacionService.marcarTodasComoLeidas(req.usuario.id_usuario);

            return res.status(200).json({
                message: "Todas las notificaciones han sido marcadas como leídas."
            });
        } catch (error) {
            console.error("Error en NotificacionController.marcarTodasComoLeidas:", error);
            return res.status(500).json({ error: 'Error al marcar las notificaciones como leídas.' });
        }
    },

    async obtenerNoLeidas(req, res) {
        try {
            const notificaciones = await NotificacionService.obtenerNoLeidas(req.usuario.id_usuario);
            return res.status(200).json({
                notificaciones,
                cantidad: notificaciones.length
            });
        } catch (error) {
            console.error("Error en NotificacionController.obtenerNoLeidas:", error);
            return res.status(500).json({ error: 'Error al obtener las notificaciones no leídas.' });
        }
    }
};

module.exports = NotificacionController;

