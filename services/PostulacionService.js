const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NotificacionService = require("./NotificacionService");

const PostulacionService = {
    async obtenerPostulaciones(filtros = {}) {
        const where = {};

        if (filtros.id_trabajo) {
            where.id_trabajo = parseInt(filtros.id_trabajo);
        }

        if (filtros.id_trabajador) {
            where.id_trabajador = parseInt(filtros.id_trabajador);
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        return prisma.postulacion.findMany({
            where,
            include: {
                trabajo: {
                    select: {
                        id_trabajo: true,
                        titulo: true,
                        estado: true,
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
                        apellido: true,
                        foto_perfil: true
                    }
                },
                acuerdo: {
                    select: {
                        id_acuerdo: true,
                        aceptado_empleador: true,
                        aceptado_trabajador: true
                    }
                }
            },
            orderBy: { fecha_postulacion: 'desc' }
        });
    },

    async obtenerPorId(id) {
        return prisma.postulacion.findUnique({
            where: { id_postulacion: id },
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
                        correo: true,
                        foto_perfil: true,
                        telefono: true
                    }
                },
                acuerdo: true
            }
        });
    },

    async crearPostulacion(data) {
        const nuevaPostulacion = await prisma.postulacion.create({
            data: {
                id_trabajo: data.id_trabajo,
                id_trabajador: data.id_trabajador,
                mensaje: data.mensaje,
                estado: 'pendiente'
            },
            include: {
                trabajo: {
                    select: {
                        id_trabajo: true,
                        titulo: true,
                        id_empleador: true
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
        });

        // Notificar al empleador
        await NotificacionService.crearNotificacion({
            id_usuario: nuevaPostulacion.trabajo.id_empleador,
            tipo: 'postulacion',
            mensaje: `Nueva postulación para tu trabajo "${nuevaPostulacion.trabajo.titulo}" de ${nuevaPostulacion.trabajador.nombre} ${nuevaPostulacion.trabajador.apellido}`,
            enlace: `/detalles/${nuevaPostulacion.trabajo.id_trabajo}`
        });

        return nuevaPostulacion;
    },

    async actualizarPostulacion(id, data) {
        const updateData = {};

        if (data.mensaje !== undefined) updateData.mensaje = data.mensaje;
        if (data.estado) updateData.estado = data.estado;
        if (data.id_acuerdo) updateData.id_acuerdo = parseInt(data.id_acuerdo);

        return prisma.postulacion.update({
            where: { id_postulacion: id },
            data: updateData,
            include: {
                trabajo: true,
                trabajador: true,
                acuerdo: true
            }
        });
    },

    async eliminarPostulacion(id) {
        return prisma.postulacion.delete({
            where: { id_postulacion: id }
        });
    },

    async aceptarPostulacion(id) {
        // Usamos una transacción para asegurar consistencia
        const postulacion = await prisma.$transaction(async (prisma) => {
            // Obtener la postulación con el trabajo completo antes de actualizar
            const postActual = await prisma.postulacion.findUnique({
                where: { id_postulacion: id },
                include: { trabajo: true }
            });

            // Actualizar la postulación a "aceptada"
            const post = await prisma.postulacion.update({
                where: { id_postulacion: id },
                data: { estado: 'aceptada' },
                include: {
                    trabajo: true,
                    trabajador: true
                }
            });

            // Si la postulación no tiene acuerdo vinculado, crear uno automáticamente
            if (!postActual.id_acuerdo) {
                const acuerdo = await prisma.acuerdo.create({
                    data: {
                        id_trabajo: post.id_trabajo,
                        id_trabajador: post.id_trabajador,
                        tipo_pago: post.trabajo.tipo_pago,
                        valor_acordado: post.trabajo.monto_pago || null,
                        detalle_trueque: post.trabajo.descripcion_trueque || null,
                        aceptado_empleador: true,
                        aceptado_trabajador: false
                    }
                });

                // Vincular el acuerdo a la postulación
                await prisma.postulacion.update({
                    where: { id_postulacion: id },
                    data: { id_acuerdo: acuerdo.id_acuerdo }
                });
            }

            // Actualizar el trabajo a "en_proceso"
            await prisma.trabajo.update({
                where: { id_trabajo: post.id_trabajo },
                data: { estado: 'en_proceso' }
            });

            return post;
        });

        // Notificar al trabajador
        await NotificacionService.crearNotificacion({
            id_usuario: postulacion.id_trabajador,
            tipo: 'postulacion_aceptada',
            mensaje: `¡Felicidades! Tu postulación para "${postulacion.trabajo.titulo}" ha sido aceptada.`,
            enlace: `/detalles/${postulacion.trabajo.id_trabajo}`
        });

        return postulacion;
    },

    async rechazarPostulacion(id) {
        const postulacion = await prisma.postulacion.update({
            where: { id_postulacion: id },
            data: { estado: 'rechazada' },
            include: {
                trabajo: true,
                trabajador: true
            }
        });

        // Notificar al trabajador
        await NotificacionService.crearNotificacion({
            id_usuario: postulacion.id_trabajador,
            tipo: 'postulacion_rechazada',
            mensaje: `Tu postulación para "${postulacion.trabajo.titulo}" ha sido rechazada.`,
            enlace: `/detalles/${postulacion.trabajo.id_trabajo}`
        });

        return postulacion;
    }
};

module.exports = PostulacionService;

