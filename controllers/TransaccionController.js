const TransaccionService = require("../services/TransaccionService");

const TransaccionController = {
    async obtenerTransacciones(req, res) {
        try {
            const filtros = {
                id_acuerdo: req.query.id_acuerdo,
                estado: req.query.estado
            };

            const transacciones = await TransaccionService.obtenerTransacciones(filtros);
            return res.status(200).json({ transacciones });
        } catch (error) {
            console.error("Error en TransaccionController.obtenerTransacciones:", error);
            return res.status(500).json({ error: 'Error al obtener las transacciones.' });
        }
    },

    async obtenerTransaccionPorId(req, res) {
        const id = parseInt(req.params.id);

        try {
            const transaccion = await TransaccionService.obtenerPorId(id);

            if (!transaccion) {
                return res.status(404).json({ error: 'Transacción no encontrada.' });
            }

            return res.status(200).json({ transaccion });
        } catch (error) {
            console.error("Error en TransaccionController.obtenerTransaccionPorId:", error);
            return res.status(500).json({ error: 'Error al obtener la transacción.' });
        }
    },

    async crearTransaccion(req, res) {
        const { id_acuerdo, tipo_pago, detalle } = req.body;

        if (!id_acuerdo || !tipo_pago) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: id_acuerdo, tipo_pago.'
            });
        }

        try {
            const nuevaTransaccion = await TransaccionService.crearTransaccion({
                id_acuerdo: parseInt(id_acuerdo),
                tipo_pago,
                detalle
            });

            return res.status(201).json({
                message: "Transacción creada exitosamente.",
                transaccion: nuevaTransaccion
            });
        } catch (error) {
            console.error("Error en TransaccionController.crearTransaccion:", error);
            return res.status(500).json({ error: 'Error al crear la transacción.' });
        }
    },

    async actualizarTransaccion(req, res) {
        const id = parseInt(req.params.id);

        try {
            const transaccionExistente = await TransaccionService.obtenerPorId(id);
            if (!transaccionExistente) {
                return res.status(404).json({ error: 'Transacción no encontrada.' });
            }

            const transaccionActualizada = await TransaccionService.actualizarTransaccion(id, req.body);

            return res.status(200).json({
                message: "Transacción actualizada correctamente.",
                transaccion: transaccionActualizada
            });
        } catch (error) {
            console.error("Error en TransaccionController.actualizarTransaccion:", error);
            return res.status(500).json({ error: 'Error al actualizar la transacción.' });
        }
    },

    async eliminarTransaccion(req, res) {
        const id = parseInt(req.params.id);

        try {
            const transaccionExistente = await TransaccionService.obtenerPorId(id);
            if (!transaccionExistente) {
                return res.status(404).json({ error: 'Transacción no encontrada.' });
            }

            await TransaccionService.eliminarTransaccion(id);

            return res.status(200).json({
                message: "Transacción eliminada correctamente."
            });
        } catch (error) {
            console.error("Error en TransaccionController.eliminarTransaccion:", error);
            return res.status(500).json({ error: 'Error al eliminar la transacción.' });
        }
    },

    async completarTransaccion(req, res) {
        const id = parseInt(req.params.id);

        try {
            const transaccionExistente = await TransaccionService.obtenerPorId(id);
            if (!transaccionExistente) {
                return res.status(404).json({ error: 'Transacción no encontrada.' });
            }

            const transaccionCompletada = await TransaccionService.completarTransaccion(id);

            return res.status(200).json({
                message: "Transacción completada correctamente.",
                transaccion: transaccionCompletada
            });
        } catch (error) {
            console.error("Error en TransaccionController.completarTransaccion:", error);
            return res.status(500).json({ error: 'Error al completar la transacción.' });
        }
    },

    // =========================================================
    // FLUJO DINERO — Confirmar pago
    // =========================================================
    async confirmarPago(req, res) {
        const id = parseInt(req.params.id);
        const id_usuario = req.usuario.id_usuario;

        try {
            const resultado = await TransaccionService.confirmarPago(id, id_usuario);
            return res.status(200).json(resultado);
        } catch (error) {
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            console.error("Error en TransaccionController.confirmarPago:", error);
            return res.status(500).json({ error: 'Error al confirmar el pago.' });
        }
    },

    // =========================================================
    // FLUJO TRUEQUE — Confirmar intercambio
    // =========================================================
    async confirmarIntercambio(req, res) {
        const id = parseInt(req.params.id);
        const id_usuario = req.usuario.id_usuario;

        try {
            const resultado = await TransaccionService.confirmarIntercambio(id, id_usuario);
            return res.status(200).json(resultado);
        } catch (error) {
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            console.error("Error en TransaccionController.confirmarIntercambio:", error);
            return res.status(500).json({ error: 'Error al confirmar el intercambio.' });
        }
    },

    // =========================================================
    // EVIDENCIA — Subir URL de comprobante
    // =========================================================
    async subirEvidencia(req, res) {
        const id = parseInt(req.params.id);
        const { evidencia_url } = req.body;
        const id_usuario = req.usuario.id_usuario;

        if (!evidencia_url) {
            return res.status(400).json({ error: 'El campo evidencia_url es obligatorio.' });
        }

        try {
            const transaccion = await TransaccionService.subirEvidencia(id, evidencia_url, id_usuario);
            return res.status(200).json({
                message: 'Evidencia registrada correctamente.',
                transaccion
            });
        } catch (error) {
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            console.error("Error en TransaccionController.subirEvidencia:", error);
            return res.status(500).json({ error: 'Error al subir la evidencia.' });
        }
    }
};

module.exports = TransaccionController;
