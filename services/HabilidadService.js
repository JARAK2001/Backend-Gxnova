const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const HabilidadService = {
    async agregarHabilidad(id_usuario, data) {
        return prisma.habilidad.create({
            data: {
                id_usuario,
                id_categoria: parseInt(data.id_categoria),
                descripcion: data.descripcion,
                tarifa_hora: data.tarifa_hora ? parseFloat(data.tarifa_hora) : null
            },
            include: {
                categoria: true
            }
        });
    },

    async obtenerHabilidadesUsuario(id_usuario) {
        return prisma.habilidad.findMany({
            where: { id_usuario },
            include: {
                categoria: true
            }
        });
    },

    async eliminarHabilidad(id_habilidad, id_usuario) {
        // Verificar que la habilidad pertenezca al usuario
        const habilidad = await prisma.habilidad.findUnique({
            where: { id_habilidad: parseInt(id_habilidad) }
        });

        if (!habilidad || habilidad.id_usuario !== id_usuario) {
            throw new Error("Habilidad no encontrada o no autorizada");
        }

        return prisma.habilidad.delete({
            where: { id_habilidad: parseInt(id_habilidad) }
        });
    },

    async buscarPorCategoria(id_categoria) {
        return prisma.habilidad.findMany({
            where: { id_categoria: parseInt(id_categoria) },
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        foto_perfil: true,
                        calificacionesRecibidas: {
                            select: { puntuacion: true }
                        }
                    }
                }
            }
        });
    }
};

module.exports = HabilidadService;
