const TrabajoService = require("../services/TrabajoService");

const TrabajoController = {
    async obtenerTrabajos(req, res) {
        try {
            const filtros = {
                estado: req.query.estado,
                id_categoria: req.query.id_categoria,
                id_empleador: req.query.id_empleador,
                tipo_pago: req.query.tipo_pago,
                busqueda: req.query.busqueda,
                ubicacion: req.query.ubicacion,
                urgente: req.query.urgente,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                skip: req.query.skip ? parseInt(req.query.skip) : undefined
            };

            const trabajos = await TrabajoService.obtenerTrabajos(filtros);
            return res.status(200).json({ trabajos });
        } catch (error) {
            console.error("Error en TrabajoController.obtenerTrabajos:", error);
            return res.status(500).json({ error: 'Error al obtener los trabajos.' });
        }
    },

    async obtenerTrabajoPorId(req, res) {
        const id = parseInt(req.params.id);

        try {
            const trabajo = await TrabajoService.obtenerPorId(id);

            if (!trabajo) {
                return res.status(404).json({ error: 'Trabajo no encontrado.' });
            }

            return res.status(200).json({ trabajo });
        } catch (error) {
            console.error("Error en TrabajoController.obtenerTrabajoPorId:", error);
            return res.status(500).json({ error: 'Error al obtener el trabajo.' });
        }
    },

    async crearTrabajo(req, res) {
        const {
            id_categoria,
            titulo,
            descripcion,
            tipo_pago,
            monto_pago,
            descripcion_trueque,
            ubicacion,
            latitud,
            longitud,
            fecha_estimada
        } = req.body;

        // Con Cloudinary, req.file.path contiene la URL pública de la imagen
        const foto = req.file ? req.file.path : null;

        // Validaciones
        if (!titulo || !descripcion || !tipo_pago || !ubicacion || !id_categoria) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: titulo, descripcion, tipo_pago, ubicacion, id_categoria.'
            });
        }

        if (tipo_pago === 'dinero' && !monto_pago) {
            return res.status(400).json({
                error: 'El monto_pago es obligatorio cuando el tipo_pago es "dinero".'
            });
        }

        if (tipo_pago === 'trueque' && !descripcion_trueque) {
            return res.status(400).json({
                error: 'La descripcion_trueque es obligatoria cuando el tipo_pago es "trueque".'
            });
        }

        try {
            const nuevoTrabajo = await TrabajoService.crearTrabajo({
                id_empleador: req.usuario.id_usuario,
                id_categoria: parseInt(id_categoria),
                titulo,
                descripcion,
                tipo_pago,
                monto_pago,
                descripcion_trueque,
                ubicacion,
                latitud,
                longitud,
                latitud,
                longitud,
                fecha_estimada,
                foto
            });

            return res.status(201).json({
                message: "Trabajo creado exitosamente.",
                trabajo: nuevoTrabajo
            });
        } catch (error) {
            console.error("Error en TrabajoController.crearTrabajo:", error);
            return res.status(500).json({ error: 'Error al crear el trabajo.' });
        }
    },

    async actualizarTrabajo(req, res) {
        const id = parseInt(req.params.id);

        try {
            const trabajoExistente = await TrabajoService.obtenerPorId(id);
            if (!trabajoExistente) {
                return res.status(404).json({ error: 'Trabajo no encontrado.' });
            }

            // Solo el empleador puede actualizar su trabajo
            if (trabajoExistente.id_empleador !== req.usuario.id_usuario) {
                return res.status(403).json({
                    error: 'No tienes permiso para actualizar este trabajo.'
                });
            }

            const trabajoActualizado = await TrabajoService.actualizarTrabajo(id, req.body);

            return res.status(200).json({
                message: "Trabajo actualizado correctamente.",
                trabajo: trabajoActualizado
            });
        } catch (error) {
            console.error("Error en TrabajoController.actualizarTrabajo:", error);
            return res.status(500).json({ error: 'Error al actualizar el trabajo.' });
        }
    },

    async eliminarTrabajo(req, res) {
        const id = parseInt(req.params.id);

        try {
            const trabajoExistente = await TrabajoService.obtenerPorId(id);
            if (!trabajoExistente) {
                return res.status(404).json({ error: 'Trabajo no encontrado.' });
            }

            // Solo el empleador puede eliminar su trabajo
            if (trabajoExistente.id_empleador !== req.usuario.id_usuario) {
                return res.status(403).json({
                    error: 'No tienes permiso para eliminar este trabajo.'
                });
            }

            await TrabajoService.eliminarTrabajo(id);

            return res.status(200).json({
                message: "Trabajo eliminado correctamente."
            });
        } catch (error) {
            console.error("Error en TrabajoController.eliminarTrabajo:", error);
            return res.status(500).json({ error: 'Error al eliminar el trabajo.' });
        }
    }
};

module.exports = TrabajoController;

