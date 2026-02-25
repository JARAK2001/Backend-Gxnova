const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const AcuerdoService = {
    async obtenerAcuerdos(filtros = {}) {
        const where = {};

        if (filtros.id_trabajo) {
            where.id_trabajo = parseInt(filtros.id_trabajo);
        }

        if (filtros.id_trabajador) {
            where.id_trabajador = parseInt(filtros.id_trabajador);
        }

        return prisma.acuerdo.findMany({
            where,
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
                        apellido: true,
                        foto_perfil: true
                    }
                },
                transaccion: true,
                postulacion: {
                    select: {
                        id_postulacion: true,
                        estado: true
                    }
                }
            },
            orderBy: { fecha_creacion: 'desc' }
        });
    },

    async obtenerPorId(id) {
        return prisma.acuerdo.findUnique({
            where: { id_acuerdo: id },
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
                        telefono: true
                    }
                },
                transaccion: true,
                postulacion: true
            }
        });
    },

    async crearAcuerdo(data) {
        return prisma.acuerdo.create({
            data: {
                id_trabajo: data.id_trabajo,
                id_trabajador: data.id_trabajador,
                tipo_pago: data.tipo_pago,
                valor_acordado: data.valor_acordado ? parseFloat(data.valor_acordado) : null,
                detalle_trueque: data.detalle_trueque,
                detalles: data.detalles,
                tiempo_estimado: data.tiempo_estimado,
                condiciones: data.condiciones,
                aceptado_empleador: false,
                aceptado_trabajador: false
            },
            include: {
                trabajo: {
                    select: {
                        id_trabajo: true,
                        titulo: true
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
    },

    async actualizarAcuerdo(id, data) {
        const updateData = {};

        if (data.valor_acordado !== undefined) updateData.valor_acordado = data.valor_acordado ? parseFloat(data.valor_acordado) : null;
        if (data.detalle_trueque !== undefined) updateData.detalle_trueque = data.detalle_trueque;
        if (data.detalles !== undefined) updateData.detalles = data.detalles;
        if (data.tiempo_estimado !== undefined) updateData.tiempo_estimado = data.tiempo_estimado;
        if (data.condiciones !== undefined) updateData.condiciones = data.condiciones;
        if (data.aceptado_empleador !== undefined) updateData.aceptado_empleador = data.aceptado_empleador;
        if (data.aceptado_trabajador !== undefined) updateData.aceptado_trabajador = data.aceptado_trabajador;

        return prisma.acuerdo.update({
            where: { id_acuerdo: id },
            data: updateData,
            include: {
                trabajo: true,
                trabajador: true,
                transaccion: true
            }
        });
    },

    async eliminarAcuerdo(id) {
        return prisma.acuerdo.delete({
            where: { id_acuerdo: id }
        });
    },

    async aceptarAcuerdo(id, esEmpleador) {
        const updateData = esEmpleador
            ? { aceptado_empleador: true }
            : { aceptado_trabajador: true };

        return prisma.acuerdo.update({
            where: { id_acuerdo: id },
            data: updateData,
            include: {
                trabajo: true,
                trabajador: true
            }
        });
    }
};

module.exports = AcuerdoService;

