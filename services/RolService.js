const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const RolService = {

    async obtenerRoles() {
        return prisma.rol.findMany({
            include: {
                _count: {
                    select: { usuarios: true }
                }
            }
        });
    },

    async obtenerPorId(id) {
        return prisma.rol.findUnique({
            where: { id_rol: parseInt(id) }
        });
    },

    async crearRol(data) {
        // Validar si ya existe
        const existe = await prisma.rol.findUnique({
            where: { nombre: data.nombre }
        });
        if (existe) throw new Error("El rol ya existe");

        return prisma.rol.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion
            }
        });
    },

    async actualizarRol(id, data) {
        // Proteger roles críticos
        const rolActual = await prisma.rol.findUnique({ where: { id_rol: parseInt(id) } });
        const rolesCriticos = ['Administrador', 'Trabajador', 'Empleador'];

        if (rolesCriticos.includes(rolActual.nombre) && data.nombre && data.nombre !== rolActual.nombre) {
            throw new Error("No se puede cambiar el nombre de roles del sistema");
        }

        return prisma.rol.update({
            where: { id_rol: parseInt(id) },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion
            }
        });
    },

    async eliminarRol(id) {
        const rol = await prisma.rol.findUnique({ where: { id_rol: parseInt(id) } });
        const rolesCriticos = ['Administrador', 'Trabajador', 'Empleador'];

        if (rolesCriticos.includes(rol.nombre)) {
            throw new Error("No se pueden eliminar roles críticos del sistema");
        }

        // Verificar si tiene usuarios asignados
        const asignaciones = await prisma.usuarioEnRol.count({
            where: { id_rol: parseInt(id) }
        });

        if (asignaciones > 0) {
            throw new Error("No se puede eliminar un rol que tiene usuarios asignados");
        }

        return prisma.rol.delete({
            where: { id_rol: parseInt(id) }
        });
    }
};

module.exports = RolService;
