const ReporteService = require("../services/ReporteService");

const ReporteController = {
    async obtenerReportes(req, res) {
        try {
            const filtros = {
                id_reportante: req.query.id_reportante,
                id_reportado: req.query.id_reportado,
                id_trabajo: req.query.id_trabajo,
                estado: req.query.estado,
                tipo: req.query.tipo
            };

            const reportes = await ReporteService.obtenerReportes(filtros);
            return res.status(200).json({ reportes });
        } catch (error) {
            console.error("Error en ReporteController.obtenerReportes:", error);
            return res.status(500).json({ error: 'Error al obtener los reportes.' });
        }
    },

    async obtenerReportePorId(req, res) {
        const id = parseInt(req.params.id);

        try {
            const reporte = await ReporteService.obtenerPorId(id);

            if (!reporte) {
                return res.status(404).json({ error: 'Reporte no encontrado.' });
            }

            return res.status(200).json({ reporte });
        } catch (error) {
            console.error("Error en ReporteController.obtenerReportePorId:", error);
            return res.status(500).json({ error: 'Error al obtener el reporte.' });
        }
    },

    async crearReporte(req, res) {
        const {
            id_reportado,
            id_trabajo,
            tipo,
            descripcion,
            evidencia
        } = req.body;

        if (!id_reportado || !tipo) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: id_reportado, tipo.'
            });
        }

        try {
            const nuevoReporte = await ReporteService.crearReporte({
                id_reportante: req.usuario.id_usuario,
                id_reportado: parseInt(id_reportado),
                id_trabajo,
                tipo,
                descripcion,
                evidencia
            });

            return res.status(201).json({
                message: "Reporte creado exitosamente.",
                reporte: nuevoReporte
            });
        } catch (error) {
            console.error("Error en ReporteController.crearReporte:", error);
            return res.status(500).json({ error: 'Error al crear el reporte.' });
        }
    },

    async actualizarReporte(req, res) {
        const id = parseInt(req.params.id);

        try {
            const reporteExistente = await ReporteService.obtenerPorId(id);
            if (!reporteExistente) {
                return res.status(404).json({ error: 'Reporte no encontrado.' });
            }

            // Solo el reportante o un administrador pueden actualizar
            const esReportante = reporteExistente.id_reportante === req.usuario.id_usuario;
            const esAdmin = req.usuario.rolesAsignados?.some(
                r => r.rol.nombre === 'Administrador'
            );

            if (!esReportante && !esAdmin) {
                return res.status(403).json({
                    error: 'No tienes permiso para actualizar este reporte.'
                });
            }

            const reporteActualizado = await ReporteService.actualizarReporte(id, req.body);

            return res.status(200).json({
                message: "Reporte actualizado correctamente.",
                reporte: reporteActualizado
            });
        } catch (error) {
            console.error("Error en ReporteController.actualizarReporte:", error);
            return res.status(500).json({ error: 'Error al actualizar el reporte.' });
        }
    },

    async eliminarReporte(req, res) {
        const id = parseInt(req.params.id);

        try {
            const reporteExistente = await ReporteService.obtenerPorId(id);
            if (!reporteExistente) {
                return res.status(404).json({ error: 'Reporte no encontrado.' });
            }

            // Solo administradores pueden eliminar reportes
            const esAdmin = req.usuario.rolesAsignados?.some(
                r => r.rol.nombre === 'Administrador'
            );

            if (!esAdmin) {
                return res.status(403).json({
                    error: 'Solo los administradores pueden eliminar reportes.'
                });
            }

            await ReporteService.eliminarReporte(id);

            return res.status(200).json({
                message: "Reporte eliminado correctamente."
            });
        } catch (error) {
            console.error("Error en ReporteController.eliminarReporte:", error);
            return res.status(500).json({ error: 'Error al eliminar el reporte.' });
        }
    },

    async resolverReporte(req, res) {
        const id = parseInt(req.params.id);

        try {
            const reporteExistente = await ReporteService.obtenerPorId(id);
            if (!reporteExistente) {
                return res.status(404).json({ error: 'Reporte no encontrado.' });
            }

            // Solo administradores pueden resolver reportes
            const esAdmin = req.usuario.rolesAsignados?.some(
                r => r.rol.nombre === 'Administrador'
            );

            if (!esAdmin) {
                return res.status(403).json({
                    error: 'Solo los administradores pueden resolver reportes.'
                });
            }

            const reporteResuelto = await ReporteService.resolverReporte(id);

            return res.status(200).json({
                message: "Reporte resuelto correctamente.",
                reporte: reporteResuelto
            });
        } catch (error) {
            console.error("Error en ReporteController.resolverReporte:", error);
            return res.status(500).json({ error: 'Error al resolver el reporte.' });
        }
    }
};

module.exports = ReporteController;

