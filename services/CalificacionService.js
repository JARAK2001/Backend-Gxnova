const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CalificacionService = {
    async crearCalificacion(data) {
        // Verificar si ya existe una calificación para este trabajo del mismo emisor
        const existente = await prisma.calificacion.findFirst({
            where: {
                id_trabajo: data.id_trabajo,
                id_usuario_emisor: data.id_usuario_emisor
            }
        });

        if (existente) {
            throw new Error("Ya has calificado este trabajo.");
        }

        return prisma.calificacion.create({
            data: {
                id_trabajo: data.id_trabajo,
                id_usuario_emisor: data.id_usuario_emisor,
                id_usuario_receptor: data.id_usuario_receptor,
                puntuacion: data.puntuacion,
                comentario: data.comentario
            },
            include: {
                emisor: {
                    select: {
                        nombre: true,
                        apellido: true,
                        foto_perfil: true
                    }
                }
            }
        });
    },

    async obtenerCalificacionesUsuario(id_usuario) {
        return prisma.calificacion.findMany({
            where: { id_usuario_receptor: id_usuario },
            include: {
                emisor: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        foto_perfil: true
                    }
                },
                trabajo: {
                    select: {
                        titulo: true
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
    },

    async obtenerPromedioUsuario(id_usuario) {
        const aggregations = await prisma.calificacion.aggregate({
            _avg: {
                puntuacion: true
            },
            _count: {
                puntuacion: true
            },
            where: {
                id_usuario_receptor: id_usuario
            }
        });

        return {
            promedio: aggregations._avg.puntuacion || 0,
            cantidad: aggregations._count.puntuacion || 0
        };
    },

    // Verificar si un usuario ya calificó un trabajo específico
    async verificarCalificacion(id_trabajo, id_usuario_emisor) {
        return prisma.calificacion.findFirst({
            where: {
                id_trabajo: id_trabajo,
                id_usuario_emisor: id_usuario_emisor
            }
        });
    }
};

module.exports = CalificacionService;
