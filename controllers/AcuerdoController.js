const AcuerdoService = require("../services/AcuerdoService");

const AcuerdoController = {
    async obtenerAcuerdos(req, res) {
        try {
            const filtros = {
                id_trabajo: req.query.id_trabajo,
                id_trabajador: req.query.id_trabajador
            };

            const acuerdos = await AcuerdoService.obtenerAcuerdos(filtros);
            return res.status(200).json({ acuerdos });
        } catch (error) {
            console.error("Error en AcuerdoController.obtenerAcuerdos:", error);
            return res.status(500).json({ error: 'Error al obtener los acuerdos.' });
        }
    },

    async obtenerAcuerdoPorId(req, res) {
        const id = parseInt(req.params.id);

        try {
            const acuerdo = await AcuerdoService.obtenerPorId(id);

            if (!acuerdo) {
                return res.status(404).json({ error: 'Acuerdo no encontrado.' });
            }

            return res.status(200).json({ acuerdo });
        } catch (error) {
            console.error("Error en AcuerdoController.obtenerAcuerdoPorId:", error);
            return res.status(500).json({ error: 'Error al obtener el acuerdo.' });
        }
    },

    async crearAcuerdo(req, res) {
        const {
            id_trabajo,
            id_trabajador,
            tipo_pago,
            valor_acordado,
            detalle_trueque,
            detalles,
            tiempo_estimado,
            condiciones
        } = req.body;

        if (!id_trabajo || !id_trabajador || !tipo_pago) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: id_trabajo, id_trabajador, tipo_pago.'
            });
        }

        try {
            const nuevoAcuerdo = await AcuerdoService.crearAcuerdo({
                id_trabajo: parseInt(id_trabajo),
                id_trabajador: parseInt(id_trabajador),
                tipo_pago,
                valor_acordado,
                detalle_trueque,
                detalles,
                tiempo_estimado,
                condiciones
            });

            return res.status(201).json({
                message: "Acuerdo creado exitosamente.",
                acuerdo: nuevoAcuerdo
            });
        } catch (error) {
            console.error("Error en AcuerdoController.crearAcuerdo:", error);
            return res.status(500).json({ error: 'Error al crear el acuerdo.' });
        }
    },

    async actualizarAcuerdo(req, res) {
        const id = parseInt(req.params.id);

        try {
            const acuerdoExistente = await AcuerdoService.obtenerPorId(id);
            if (!acuerdoExistente) {
                return res.status(404).json({ error: 'Acuerdo no encontrado.' });
            }

            // Solo el empleador o trabajador pueden actualizar el acuerdo
            const esEmpleador = acuerdoExistente.trabajo.id_empleador === req.usuario.id_usuario;
            const esTrabajador = acuerdoExistente.id_trabajador === req.usuario.id_usuario;

            if (!esEmpleador && !esTrabajador) {
                return res.status(403).json({
                    error: 'No tienes permiso para actualizar este acuerdo.'
                });
            }

            const acuerdoActualizado = await AcuerdoService.actualizarAcuerdo(id, req.body);

            return res.status(200).json({
                message: "Acuerdo actualizado correctamente.",
                acuerdo: acuerdoActualizado
            });
        } catch (error) {
            console.error("Error en AcuerdoController.actualizarAcuerdo:", error);
            return res.status(500).json({ error: 'Error al actualizar el acuerdo.' });
        }
    },

    async eliminarAcuerdo(req, res) {
        const id = parseInt(req.params.id);

        try {
            const acuerdoExistente = await AcuerdoService.obtenerPorId(id);
            if (!acuerdoExistente) {
                return res.status(404).json({ error: 'Acuerdo no encontrado.' });
            }

            // Solo el empleador o trabajador pueden eliminar el acuerdo
            const esEmpleador = acuerdoExistente.trabajo.id_empleador === req.usuario.id_usuario;
            const esTrabajador = acuerdoExistente.id_trabajador === req.usuario.id_usuario;

            if (!esEmpleador && !esTrabajador) {
                return res.status(403).json({
                    error: 'No tienes permiso para eliminar este acuerdo.'
                });
            }

            await AcuerdoService.eliminarAcuerdo(id);

            return res.status(200).json({
                message: "Acuerdo eliminado correctamente."
            });
        } catch (error) {
            console.error("Error en AcuerdoController.eliminarAcuerdo:", error);
            return res.status(500).json({ error: 'Error al eliminar el acuerdo.' });
        }
    },

    async aceptarAcuerdo(req, res) {
        const id = parseInt(req.params.id);

        try {
            const acuerdoExistente = await AcuerdoService.obtenerPorId(id);
            if (!acuerdoExistente) {
                return res.status(404).json({ error: 'Acuerdo no encontrado.' });
            }

            const esEmpleador = acuerdoExistente.trabajo.id_empleador === req.usuario.id_usuario;
            const esTrabajador = acuerdoExistente.id_trabajador === req.usuario.id_usuario;

            if (!esEmpleador && !esTrabajador) {
                return res.status(403).json({
                    error: 'No tienes permiso para aceptar este acuerdo.'
                });
            }

            const acuerdoAceptado = await AcuerdoService.aceptarAcuerdo(id, esEmpleador);

            return res.status(200).json({
                message: "Acuerdo aceptado correctamente.",
                acuerdo: acuerdoAceptado
            });
        } catch (error) {
            console.error("Error en AcuerdoController.aceptarAcuerdo:", error);
            return res.status(500).json({ error: 'Error al aceptar el acuerdo.' });
        }
    }
};

module.exports = AcuerdoController;

