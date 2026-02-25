const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NotificacionService = {
    async obtenerNotificaciones(filtros = {}) {
        const where = {};

        if (filtros.id_usuario) {
            where.id_usuario = parseInt(filtros.id_usuario);
        }

        if (filtros.leida !== undefined) {
            where.leida = filtros.leida === 'true';
        }

        if (filtros.tipo) {
            where.tipo = filtros.tipo;
        }

        return prisma.notificacion.findMany({
            where,
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
    },

    async obtenerPorId(id) {
        return prisma.notificacion.findUnique({
            where: { id_notificacion: id },
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        correo: true
                    }
                }
            }
        });
    },

    async crearNotificacion(data) {
        return prisma.notificacion.create({
            data: {
                id_usuario: data.id_usuario,
                tipo: data.tipo,
                mensaje: data.mensaje,
                enlace: data.enlace || null,
                leida: false
            },
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });
    },

    async actualizarNotificacion(id, data) {
        const updateData = {};

        if (data.mensaje !== undefined) updateData.mensaje = data.mensaje;
        if (data.leida !== undefined) updateData.leida = data.leida;
        if (data.tipo !== undefined) updateData.tipo = data.tipo;

        return prisma.notificacion.update({
            where: { id_notificacion: id },
            data: updateData,
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });
    },

    async eliminarNotificacion(id) {
        return prisma.notificacion.delete({
            where: { id_notificacion: id }
        });
    },

    async marcarComoLeida(id) {
        return prisma.notificacion.update({
            where: { id_notificacion: id },
            data: { leida: true },
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true
                    }
                }
            }
        });
    },

    async marcarTodasComoLeidas(idUsuario) {
        return prisma.notificacion.updateMany({
            where: {
                id_usuario: idUsuario,
                leida: false
            },
            data: { leida: true }
        });
    },

    async obtenerNoLeidas(idUsuario) {
        return prisma.notificacion.findMany({
            where: {
                id_usuario: idUsuario,
                leida: false
            },
            orderBy: { fecha: 'desc' }
        });
    }
};

module.exports = NotificacionService;

