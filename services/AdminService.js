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

    async obtenerTendenciasTrabajos() {
        const trabajos = await prisma.trabajo.findMany({
            select: { fecha_creacion: true }
        });

        const tendencia = {};
        trabajos.forEach(t => {
            const fecha = new Date(t.fecha_creacion);
            const diaMesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
            tendencia[diaMesAnio] = (tendencia[diaMesAnio] || 0) + 1;
        });

        return Object.entries(tendencia)
            .map(([fecha, cantidad]) => ({ fecha, cantidad }))
            .sort((a, b) => a.fecha.localeCompare(b.fecha));
    },

    async obtenerOfertaVsDemanda() {
        const resultados = await prisma.$queryRaw`
            SELECT 
                c.nombre AS categoria,
                COUNT(DISTINCT t.id_trabajo) AS trabajos,
                COUNT(p.id_postulacion) AS postulaciones
            FROM Categoria c
            LEFT JOIN Trabajo t ON c.id_categoria = t.id_categoria
            LEFT JOIN Postulacion p ON t.id_trabajo = p.id_trabajo
            GROUP BY c.nombre
            ORDER BY trabajos DESC
        `;
        
        return resultados.map(r => ({
            categoria: r.categoria,
            trabajos: Number(r.trabajos),
            postulaciones: Number(r.postulaciones)
        }));
    },

    async obtenerRecomendacionesSistema() {
        const recomendaciones = [];

        // 1. Analizar Oferta vs Demanda
        const resultadosDemanda = await prisma.$queryRaw`
            SELECT 
                c.nombre AS categoria,
                COUNT(DISTINCT t.id_trabajo) AS trabajos,
                COUNT(p.id_postulacion) AS postulaciones
            FROM Categoria c
            LEFT JOIN Trabajo t ON c.id_categoria = t.id_categoria
            LEFT JOIN Postulacion p ON t.id_trabajo = p.id_trabajo
            GROUP BY c.nombre
        `;
        
        resultadosDemanda.forEach(r => {
            const trabajos = Number(r.trabajos);
            const postulaciones = Number(r.postulaciones);
            const categoria = r.categoria;

            if (trabajos >= 2 && postulaciones === 0) {
                recomendaciones.push({
                    tipo: 'alerta',
                    titulo: 'Fuga de Oportunidades',
                    mensaje: `La categoría "${categoria}" tiene ${trabajos} trabajos recientes pero 0 postulaciones en curso.`,
                    prioridad: 'alta'
                });
            } else if (trabajos > 0 && postulaciones >= (trabajos * 3)) {
                recomendaciones.push({
                    tipo: 'info',
                    titulo: 'Alta Competencia en ' + categoria,
                    mensaje: `Mucha oferta de trabajadores (Promedio de ${Math.floor(postulaciones/trabajos)} postulantes por trabajo).`,
                    prioridad: 'media'
                });
            }
        });

        // 2. Trabajos estancados (>3 días)
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 3);
        const trabajosEstancados = await prisma.trabajo.count({
            where: {
                estado: 'publicado',
                fecha_creacion: { lt: fechaLimite },
                postulaciones: { none: {} }
            }
        });

        if (trabajosEstancados > 0) {
            recomendaciones.push({
                tipo: 'warning',
                titulo: 'Trabajos Estancados',
                mensaje: `Existen ${trabajosEstancados} trabajos publicados hace más de 3 días sin postulaciones. Considere notificar a los trabajadores.`,
                prioridad: 'alta'
            });
        }

        // 3. Chequear crecimiento de usuarios
        const ultimos7Dias = new Date();
        ultimos7Dias.setDate(ultimos7Dias.getDate() - 7);
        const nuevosUsuarios = await prisma.usuario.count({
            where: { fecha_registro: { gte: ultimos7Dias } }
        });

        if (nuevosUsuarios === 0) {
             recomendaciones.push({
                tipo: 'warning',
                titulo: 'Bajo Nivel de Registros',
                mensaje: `No hay nuevos usuarios registrados en los últimos 7 días. Requiere campaña activa.`,
                prioridad: 'media'
            });
        }

        if (recomendaciones.length === 0) {
             recomendaciones.push({
                tipo: 'success',
                titulo: 'Sistema Estable',
                mensaje: `Las métricas operativas de la plataforma se encuentran en niveles óptimos.`,
                prioridad: 'baja'
            });
        }

        return recomendaciones;
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
