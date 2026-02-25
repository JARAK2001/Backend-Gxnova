const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CategoriaService = {
    async obtenerCategorias() {
        return prisma.categoria.findMany({
            orderBy: { nombre: 'asc' }
        });
    },

    async obtenerPorId(id) {
        return prisma.categoria.findUnique({
            where: { id_categoria: id },
            include: {
                trabajos: {
                    select: {
                        id_trabajo: true,
                        titulo: true,
                        estado: true,
                        fecha_creacion: true
                    }
                }
            }
        });
    },

    async crearCategoria(data) {
        return prisma.categoria.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion
            }
        });
    },

    async actualizarCategoria(id, data) {
        return prisma.categoria.update({
            where: { id_categoria: id },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion
            }
        });
    },

    async eliminarCategoria(id) {
        // Verificar si tiene trabajos asociados
        const categoria = await prisma.categoria.findUnique({
            where: { id_categoria: id },
            include: { trabajos: true }
        });

        if (categoria && categoria.trabajos.length > 0) {
            throw new Error("No se puede eliminar una categoría con trabajos asociados.");
        }

        return prisma.categoria.delete({
            where: { id_categoria: id }
        });
    }
};

module.exports = CategoriaService;

