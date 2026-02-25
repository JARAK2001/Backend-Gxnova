const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const HistorialService = {
    async obtenerHistoriales(filtros = {}) {
        const where = {};

        if (filtros.id_usuario) {
            where.id_usuario = parseInt(filtros.id_usuario);
        }

        if (filtros.id_trabajo) {
            where.id_trabajo = parseInt(filtros.id_trabajo);
        }

        return prisma.historial.findMany({
            where,
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        foto_perfil: true
                    }
                },
                trabajo: {
                    select: {
                        id_trabajo: true,
                        titulo: true,
                        estado: true
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
    },

    async obtenerPorId(id) {
        return prisma.historial.findUnique({
            where: { id_historial: id },
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true
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
                        },
                        categoria: true
                    }
                }
            }
        });
    },

    async crearHistorial(data) {
        return prisma.historial.create({
            data: {
                id_usuario: data.id_usuario,
                id_trabajo: data.id_trabajo,
                descripcion: data.descripcion
            },
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true
                    }
                },
                trabajo: {
                    select: {
                        id_trabajo: true,
                        titulo: true
                    }
                }
            }
        });
    },

    async eliminarHistorial(id) {
        return prisma.historial.delete({
            where: { id_historial: id }
        });
    }
};

module.exports = HistorialService;

