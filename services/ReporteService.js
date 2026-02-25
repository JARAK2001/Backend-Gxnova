const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ReporteService = {
    async obtenerReportes(filtros = {}) {
        const where = {};

        if (filtros.id_reportante) {
            where.id_reportante = parseInt(filtros.id_reportante);
        }

        if (filtros.id_reportado) {
            where.id_reportado = parseInt(filtros.id_reportado);
        }

        if (filtros.id_trabajo) {
            where.id_trabajo = parseInt(filtros.id_trabajo);
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        if (filtros.tipo) {
            where.tipo = filtros.tipo;
        }

        return prisma.reporte.findMany({
            where,
            include: {
                reportante: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        correo: true
                    }
                },
                reportado: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        correo: true
                    }
                },
                trabajo: {
                    select: {
                        id_trabajo: true,
                        titulo: true
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
    },

    async obtenerPorId(id) {
        return prisma.reporte.findUnique({
            where: { id_reporte: id },
            include: {
                reportante: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        correo: true,
                        telefono: true
                    }
                },
                reportado: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        correo: true,
                        telefono: true
                    }
                },
                trabajo: {
                    include: {
                        empleador: {
                            select: {
                                id_usuario: true,
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                }
            }
        });
    },

    async crearReporte(data) {
        return prisma.reporte.create({
            data: {
                id_reportante: data.id_reportante,
                id_reportado: data.id_reportado,
                id_trabajo: data.id_trabajo ? parseInt(data.id_trabajo) : null,
                tipo: data.tipo,
                descripcion: data.descripcion,
                evidencia: data.evidencia,
                estado: 'pendiente'
            },
            include: {
                reportante: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true
                    }
                },
                reportado: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });
    },

    async actualizarReporte(id, data) {
        const updateData = {};

        if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
        if (data.evidencia !== undefined) updateData.evidencia = data.evidencia;
        if (data.estado) updateData.estado = data.estado;

        return prisma.reporte.update({
            where: { id_reporte: id },
            data: updateData,
            include: {
                reportante: true,
                reportado: true,
                trabajo: true
            }
        });
    },

    async eliminarReporte(id) {
        return prisma.reporte.delete({
            where: { id_reporte: id }
        });
    },

    async resolverReporte(id) {
        return prisma.reporte.update({
            where: { id_reporte: id },
            data: { estado: 'resuelto' },
            include: {
                reportante: true,
                reportado: true,
                trabajo: true
            }
        });
    }
};

module.exports = ReporteService;

