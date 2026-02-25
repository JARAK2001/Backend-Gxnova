const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NotificacionService = require("./NotificacionService");

const TransaccionService = {
    async obtenerTransacciones(filtros = {}) {
        const where = {};

        if (filtros.id_acuerdo) {
            where.id_acuerdo = parseInt(filtros.id_acuerdo);
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        return prisma.transaccion.findMany({
            where,
            include: {
                acuerdo: {
                    include: {
                        trabajo: {
                            select: {
                                id_trabajo: true,
                                titulo: true,
                                empleador: {
                                    select: {
                                        id_usuario: true,
                                        nombre: true,
                                        apellido: true
                                    }
                                }
                            }
                        },
                        trabajador: {
                            select: {
                                id_usuario: true,
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
    },

    async obtenerPorId(id) {
        return prisma.transaccion.findUnique({
            where: { id_transaccion: id },
            include: {
                acuerdo: {
                    include: {
                        trabajo: {
                            include: {
                                empleador: {
                                    select: {
                                        id_usuario: true,
                                        nombre: true,
                                        apellido: true,
                                        correo: true
                                    }
                                },
                                categoria: true
                            }
                        },
                        trabajador: {
                            select: {
                                id_usuario: true,
                                nombre: true,
                                apellido: true,
                                correo: true
                            }
                        }
                    }
                }
            }
        });
    },

    async crearTransaccion(data) {
        return prisma.transaccion.create({
            data: {
                id_acuerdo: data.id_acuerdo,
                tipo_pago: data.tipo_pago,
                detalle: data.detalle,
                estado: 'pendiente'
            },
            include: {
                acuerdo: {
                    include: {
                        trabajo: {
                            select: {
                                id_trabajo: true,
                                titulo: true
                            }
                        }
                    }
                }
            }
        });
    },

    async actualizarTransaccion(id, data) {
        const updateData = {};

        if (data.detalle !== undefined) updateData.detalle = data.detalle;
        if (data.estado) updateData.estado = data.estado;

        return prisma.transaccion.update({
            where: { id_transaccion: id },
            data: updateData,
            include: {
                acuerdo: {
                    include: {
                        trabajo: true,
                        trabajador: true
                    }
                }
            }
        });
    },

    async eliminarTransaccion(id) {
        return prisma.transaccion.delete({
            where: { id_transaccion: id }
        });
    },

    async completarTransaccion(id) {
        return prisma.transaccion.update({
            where: { id_transaccion: id },
            data: { estado: 'completado' },
            include: {
                acuerdo: {
                    include: {
                        trabajo: true,
                        trabajador: true
                    }
                }
            }
        });
    },

    // =========================================================
    // FLUJO DINERO — Doble confirmación
    // =========================================================
    async confirmarPago(id_transaccion, id_usuario) {
        const transaccion = await this.obtenerPorId(id_transaccion);

        if (!transaccion) {
            throw { status: 404, message: 'Transacción no encontrada.' };
        }

        if (transaccion.tipo_pago !== 'dinero') {
            throw { status: 400, message: 'Esta transacción no es de tipo dinero. Usa /confirmar-intercambio.' };
        }

        if (transaccion.estado === 'completado') {
            throw { status: 400, message: 'Esta transacción ya está completada.' };
        }

        const idEmpleador = transaccion.acuerdo.trabajo.empleador.id_usuario;
        const idTrabajador = transaccion.acuerdo.trabajador.id_usuario;
        const idTrabajo = transaccion.acuerdo.trabajo.id_trabajo;

        const esEmpleador = id_usuario === idEmpleador;
        const esTrabajador = id_usuario === idTrabajador;

        if (!esEmpleador && !esTrabajador) {
            throw { status: 403, message: 'No tienes permiso para confirmar esta transacción.' };
        }

        // PASO 1 – Empleador marca el pago como realizado
        if (esEmpleador) {
            if (transaccion.confirmado_empleador) {
                throw { status: 400, message: 'Ya confirmaste el pago.' };
            }

            const actualizada = await prisma.transaccion.update({
                where: { id_transaccion },
                data: {
                    confirmado_empleador: true,
                    estado: 'pagado_empleador'
                }
            });

            // Notificar al trabajador
            await NotificacionService.crearNotificacion({
                id_usuario: idTrabajador,
                tipo: 'pago_realizado',
                mensaje: `El empleador marcó el pago del trabajo "${transaccion.acuerdo.trabajo.titulo}" como realizado. Por favor confirma que recibiste el dinero.`,
                enlace: `/detalles/${idTrabajo}`
            });

            return { ...actualizada, mensaje: 'Pago marcado. Esperando confirmación del trabajador.' };
        }

        // PASO 2 – Trabajador confirma que recibió el pago
        if (esTrabajador) {
            if (!transaccion.confirmado_empleador) {
                throw { status: 400, message: 'El empleador aún no ha marcado el pago como realizado.' };
            }
            if (transaccion.confirmado_trabajador) {
                throw { status: 400, message: 'Ya confirmaste la recepción del pago.' };
            }

            // Ambas partes confirmaron → completar en una transacción atómica
            const [transaccionCompletada] = await prisma.$transaction([
                prisma.transaccion.update({
                    where: { id_transaccion },
                    data: {
                        confirmado_trabajador: true,
                        estado: 'completado'
                    }
                }),
                prisma.trabajo.update({
                    where: { id_trabajo: idTrabajo },
                    data: { estado: 'completado' }
                })
            ]);

            // Notificar al empleador
            await NotificacionService.crearNotificacion({
                id_usuario: idEmpleador,
                tipo: 'transaccion_completada',
                mensaje: `El trabajador confirmó la recepción del pago. El trabajo "${transaccion.acuerdo.trabajo.titulo}" ha sido cerrado.`,
                enlace: `/detalles/${idTrabajo}`
            });

            return { ...transaccionCompletada, mensaje: 'Pago confirmado. Trabajo completado exitosamente.' };
        }
    },

    // =========================================================
    // FLUJO TRUEQUE — Doble confirmación
    // =========================================================
    async confirmarIntercambio(id_transaccion, id_usuario) {
        const transaccion = await this.obtenerPorId(id_transaccion);

        if (!transaccion) {
            throw { status: 404, message: 'Transacción no encontrada.' };
        }

        if (transaccion.tipo_pago !== 'trueque') {
            throw { status: 400, message: 'Esta transacción no es de tipo trueque. Usa /confirmar-pago.' };
        }

        if (transaccion.estado === 'completado') {
            throw { status: 400, message: 'Esta transacción ya está completada.' };
        }

        const idEmpleador = transaccion.acuerdo.trabajo.empleador.id_usuario;
        const idTrabajador = transaccion.acuerdo.trabajador.id_usuario;
        const idTrabajo = transaccion.acuerdo.trabajo.id_trabajo;

        const esEmpleador = id_usuario === idEmpleador;
        const esTrabajador = id_usuario === idTrabajador;

        if (!esEmpleador && !esTrabajador) {
            throw { status: 403, message: 'No tienes permiso para confirmar esta transacción.' };
        }

        if (esEmpleador && transaccion.confirmado_empleador) {
            throw { status: 400, message: 'Ya confirmaste el intercambio.' };
        }
        if (esTrabajador && transaccion.confirmado_trabajador) {
            throw { status: 400, message: 'Ya confirmaste el intercambio.' };
        }

        const updateData = esEmpleador
            ? { confirmado_empleador: true }
            : { confirmado_trabajador: true };

        // Verificar si el otro ya confirmó
        const otroYaConfirmo = esEmpleador
            ? transaccion.confirmado_trabajador
            : transaccion.confirmado_empleador;

        if (otroYaConfirmo) {
            // Ambas partes confirmaron → completar en una transacción atómica
            const [transaccionCompletada] = await prisma.$transaction([
                prisma.transaccion.update({
                    where: { id_transaccion },
                    data: { ...updateData, estado: 'completado' }
                }),
                prisma.trabajo.update({
                    where: { id_trabajo: idTrabajo },
                    data: { estado: 'completado' }
                })
            ]);

            // Notificar a ambos
            const idOtro = esEmpleador ? idTrabajador : idEmpleador;
            await NotificacionService.crearNotificacion({
                id_usuario: idOtro,
                tipo: 'intercambio_completado',
                mensaje: `¡Intercambio completado! El trabajo "${transaccion.acuerdo.trabajo.titulo}" ha sido cerrado exitosamente.`,
                enlace: `/detalles/${idTrabajo}`
            });

            return { ...transaccionCompletada, mensaje: 'Intercambio confirmado por ambas partes. Trabajo completado.' };
        }

        // Solo uno confirmó → guardar el check y notificar al otro
        const estadoIntermedio = esEmpleador ? 'intercambio_empleador' : 'intercambio_trabajador';

        const actualizada = await prisma.transaccion.update({
            where: { id_transaccion },
            data: { ...updateData, estado: estadoIntermedio }
        });

        const idOtro = esEmpleador ? idTrabajador : idEmpleador;
        const rolQueFalta = esEmpleador ? 'el trabajador' : 'el empleador';

        await NotificacionService.crearNotificacion({
            id_usuario: idOtro,
            tipo: 'confirmar_intercambio',
            mensaje: `Se ha registrado tu parte del intercambio en "${transaccion.acuerdo.trabajo.titulo}". Falta que ${rolQueFalta} confirme para cerrar el trabajo.`,
            enlace: `/detalles/${idTrabajo}`
        });

        return { ...actualizada, mensaje: `Tu confirmación fue guardada. Esperando que ${rolQueFalta} confirme.` };
    },

    // =========================================================
    // EVIDENCIA — Subir URL de comprobante
    // =========================================================
    async subirEvidencia(id_transaccion, evidencia_url, id_usuario) {
        const transaccion = await this.obtenerPorId(id_transaccion);

        if (!transaccion) {
            throw { status: 404, message: 'Transacción no encontrada.' };
        }

        const idEmpleador = transaccion.acuerdo.trabajo.empleador.id_usuario;
        const idTrabajador = transaccion.acuerdo.trabajador.id_usuario;

        if (id_usuario !== idEmpleador && id_usuario !== idTrabajador) {
            throw { status: 403, message: 'No tienes permiso para subir evidencia en esta transacción.' };
        }

        return prisma.transaccion.update({
            where: { id_transaccion },
            data: { evidencia_url }
        });
    }
};

module.exports = TransaccionService;
