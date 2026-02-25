const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const UsuarioService = {

    async obtenerUsuarios() {
        return prisma.usuario.findMany({
            include: {
                rolesAsignados: {
                    include: {
                        rol: true
                    }
                }
            },
            orderBy: {
                fecha_registro: 'desc'
            }
        });
    },

    async obtenerPorId(id) {
        return prisma.usuario.findUnique({
            where: { id_usuario: id },
            include: {
                rolesAsignados: {
                    select: {
                        rol: {
                            select: { id_rol: true, nombre: true },
                        },
                    },
                },
                habilidades: {
                    include: {
                        categoria: true
                    }
                }
            },
        });
    },

    async obtenerPorCorreo(correo) {
        return prisma.usuario.findUnique({
            where: { correo },
        });
    },

    async crearUsuario(data) {
        return prisma.usuario.create({ data });
    },

    async obtenerRolPorNombre(nombre) {
        return prisma.rol.findUnique({
            where: { nombre },
            select: { id_rol: true }
        });
    },

    async asignarRolAUsuario(id_usuario, id_rol) {
        return prisma.usuarioEnRol.create({
            data: {
                id_usuario,
                id_rol,
            }
        });
    },

    async agregarRol(id_usuario, nombre_rol) {
        const rol = await prisma.rol.findUnique({ where: { nombre: nombre_rol } });
        if (!rol) throw new Error("Rol no encontrado");

        const existe = await prisma.usuarioEnRol.findUnique({
            where: {
                id_usuario_id_rol: {
                    id_usuario: parseInt(id_usuario),
                    id_rol: rol.id_rol
                }
            }
        });

        if (existe) return existe;

        return prisma.usuarioEnRol.create({
            data: {
                id_usuario: parseInt(id_usuario),
                id_rol: rol.id_rol
            }
        });
    },

    async actualizarUsuario(id, data) {
        return prisma.usuario.update({
            where: { id_usuario: id },
            data,
        });
    },

    async eliminarUsuario(id) {
        return prisma.usuario.delete({
            where: { id_usuario: id },
        });
    },

    async obtenerPerfilPublico(id) {
        // Fetch user with related data
        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario: id },
            select: {
                id_usuario: true,
                nombre: true,
                apellido: true,
                correo: true,
                telefono: true,
                foto_perfil: true,
                fecha_registro: true,
                habilidades: {
                    include: {
                        categoria: true
                    }
                },
                calificacionesRecibidas: {
                    select: {
                        puntuacion: true,
                        comentario: true,
                        fecha: true,
                        emisor: {
                            select: {
                                nombre: true,
                                apellido: true
                            }
                        }
                    },
                    orderBy: {
                        fecha: 'desc'
                    },
                    take: 5 // Last 5 reviews
                },
                postulaciones: {
                    where: {
                        estado: 'aceptada'
                    },
                    include: {
                        trabajo: {
                            select: {
                                estado: true
                            }
                        }
                    }
                }
            }
        });

        if (!usuario) return null;

        // Calculate rating statistics
        const calificaciones = await prisma.calificacion.findMany({
            where: { id_usuario_receptor: id },
            select: { puntuacion: true }
        });

        const totalCalificaciones = calificaciones.length;
        const promedioCalificacion = totalCalificaciones > 0
            ? calificaciones.reduce((sum, cal) => sum + cal.puntuacion, 0) / totalCalificaciones
            : 0;

        // Count completed jobs
        const trabajosCompletados = usuario.postulaciones.filter(
            post => post.trabajo.estado === 'completado'
        ).length;

        // Return formatted profile
        return {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            telefono: usuario.telefono,
            foto_perfil: usuario.foto_perfil,
            fecha_registro: usuario.fecha_registro,
            habilidades: usuario.habilidades,
            estadisticas: {
                promedioCalificacion: Math.round(promedioCalificacion * 10) / 10,
                totalCalificaciones,
                trabajosCompletados
            },
            calificacionesRecientes: usuario.calificacionesRecibidas
        };
    },
};

module.exports = UsuarioService;
