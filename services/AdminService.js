const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

const AdminService = {
    async obtenerEstadisticas() {
        const totalUsuarios = await prisma.usuario.count();
        const totalTrabajos = await prisma.trabajo.count();
        const totalCalificaciones = await prisma.calificacion.count();

        // Trabajos por estado
        const trabajosPorEstado = await prisma.trabajo.groupBy({
            by: ['estado'],
            _count: {
                estado: true
            }
        });

        // Usuarios activos vs suspendidos
        const usuariosPorEstado = await prisma.usuario.groupBy({
            by: ['estado'],
            _count: {
                estado: true
            }
        });

        return {
            totalUsuarios,
            totalTrabajos,
            totalCalificaciones,
            trabajosPorEstado,
            usuariosPorEstado
        };
    },

    async obtenerCrecimientoUsuarios() {
        // Agrupar usuarios por día de registro
        const usuarios = await prisma.usuario.findMany({
            select: { fecha_registro: true }
        });

        const crecimiento = {};
        usuarios.forEach(u => {
            const fecha = new Date(u.fecha_registro);
            const diaMesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
            crecimiento[diaMesAnio] = (crecimiento[diaMesAnio] || 0) + 1;
        });

        return Object.entries(crecimiento)
            .map(([fecha, cantidad]) => ({ fecha, cantidad }))
            .sort((a, b) => a.fecha.localeCompare(b.fecha));
    },

    async obtenerTopUsuarios() {
        // Usuarios con mejor promedio de calificación
        // Necesitamos calcular el promedio de calificaciones recibidas
        const usuarios = await prisma.usuario.findMany({
            take: 10,
            where: {
                calificacionesRecibidas: {
                    some: {} // Solo usuarios que tengan calificaciones
                }
            },
            include: {
                calificacionesRecibidas: {
                    select: { puntuacion: true }
                }
            }
        });

        return usuarios.map(u => {
            const total = u.calificacionesRecibidas.reduce((sum, c) => sum + c.puntuacion, 0);
            const promedio = u.calificacionesRecibidas.length > 0 ? total / u.calificacionesRecibidas.length : 0;
            return {
                id_usuario: u.id_usuario,
                nombre: u.nombre,
                apellido: u.apellido,
                promedio: parseFloat(promedio.toFixed(1)),
                total_calificaciones: u.calificacionesRecibidas.length
            };
        }).sort((a, b) => b.promedio - a.promedio);
    },

    async obtenerDistribucionCategorias() {
        const categorias = await prisma.categoria.findMany({
            include: {
                _count: {
                    select: { trabajos: true }
                }
            }
        });

        return categorias.map(c => ({
            id_categoria: c.id_categoria,
            nombre: c.nombre,
            count: c._count.trabajos
        })).sort((a, b) => b.count - a.count); // Opcional: ordenar por mayor popularidad
    },

    async cambiarEstadoUsuario(id, estado) {
        return prisma.usuario.update({
            where: { id_usuario: parseInt(id) },
            data: { estado }
        });
    },

    async crearPersonalUsuario(datos) {
        const { nombre, apellido, correo, password, rol } = datos;

        // Verificar si el correo ya existe
        const existe = await prisma.usuario.findUnique({
            where: { correo }
        });
        if (existe) {
            throw new Error('El correo ya está registrado.');
        }

        // Buscar el rol (por defecto Administrador si no se encuentra otro, o validar)
        const rolDB = await prisma.rol.findUnique({
            where: { nombre: rol || 'Administrador' }
        });
        if (!rolDB) {
            throw new Error(`El rol ${rol} no existe en el sistema.`);
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Crear el usuario con validaciones saltadas (es admin)
        return prisma.usuario.create({
            data: {
                nombre,
                apellido,
                correo,
                password_hash,
                estado: 'activo',
                verificado: true,
                terminos_aceptados: true,
                correo_verificado: true,
                rolesAsignados: {
                    create: {
                        id_rol: rolDB.id_rol
                    }
                }
            },
            select: {
                id_usuario: true,
                nombre: true,
                apellido: true,
                correo: true,
                estado: true,
                fecha_registro: true,
                rolesAsignados: {
                    include: { rol: true }
                }
            }
        });
    },

    async eliminarTrabajo(id) {
        // Cambio de estado a 'cancelado'.
        return prisma.trabajo.update({
            where: { id_trabajo: parseInt(id) },
            data: { estado: 'cancelado' }
        });
    },

    async obtenerUsuariosPendientesVerificacion() {
        return prisma.usuario.findMany({
            where: {
                AND: [
                    { verificado: false },
                    { foto_cedula: { not: null } },
                    { foto_perfil: { not: null } }
                ]
            },
            select: {
                id_usuario: true,
                nombre: true,
                apellido: true,
                correo: true,
                fecha_registro: true,
                foto_cedula: true,
                foto_perfil: true,
                estado: true
            },
            orderBy: {
                fecha_registro: 'desc'
            }
        });
    },

    async verificarUsuario(id, aprobado, motivoRechazo = null) {
        if (aprobado) {
            return prisma.usuario.update({
                where: { id_usuario: parseInt(id) },
                data: {
                    verificado: true,
                    fecha_verificacion: new Date()
                }
            });
        } else {
            return prisma.usuario.update({
                where: { id_usuario: parseInt(id) },
                data: {
                    foto_cedula: null,
                    foto_perfil: null,
                    verificado: false,
                }
            });
        }
    },

    async obtenerHabilidadesPendientes() {
        return prisma.habilidad.findMany({
            where: { estado: 'pendiente_revision' },
            include: {
                categoria: true,
                usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        correo: true,
                        foto_perfil: true
                    }
                }
            },
            orderBy: { id_habilidad: 'desc' }
        });
    },

    async validarHabilidad(id, aprobado) {
        const nuevoEstado = aprobado ? 'aprobada' : 'rechazada';
        return prisma.habilidad.update({
            where: { id_habilidad: parseInt(id) },
            data: { estado: nuevoEstado },
            include: { categoria: true, usuario: { select: { id_usuario: true, nombre: true, apellido: true, correo: true } } }
        });
    }
};

module.exports = AdminService;
