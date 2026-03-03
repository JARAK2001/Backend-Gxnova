const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TrabajoService = {
    async obtenerTrabajos(filtros = {}) {
        const where = {};

        // 🚀 NUEVA LÓGICA: Filtrar por habilidades SOLO si:
        // 1. El usuario es Trabajador PURO (por seguridad/UX).
        // 2. O el usuario (independientemente de sus roles) solicita explícitamente el filtro (soloHabilidades === 'true').
        if (filtros.id_usuario_actual) {
            const usuario = await prisma.usuario.findUnique({
                where: { id_usuario: filtros.id_usuario_actual },
                include: { rolesAsignados: { include: { rol: true } } }
            });

            const roles = usuario ? usuario.rolesAsignados.map(r => r.rol.nombre) : [];
            const esTrabajador = roles.includes('Trabajador');
            const esPrivilegiado = roles.includes('Empleador') || roles.includes('Administrador');
            const deseaFiltrar = filtros.soloHabilidades === 'true';

            // Ejecutamos el filtro si es trabajador puro O si cualquier usuario con habilidades lo pide manualmente
            if ((esTrabajador && !esPrivilegiado) || deseaFiltrar) {
                const habilidades = await prisma.habilidad.findMany({
                    where: { id_usuario: filtros.id_usuario_actual },
                    select: { id_categoria: true }
                });

                if (habilidades && habilidades.length > 0) {
                    const categoriasIds = habilidades.map(h => h.id_categoria);
                    where.id_categoria = { in: categoriasIds };
                } else {
                    // Si se forzó el filtro o es trabajador puro sin habilidades, no ve nada
                    return [];
                }
            }
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        if (filtros.id_categoria && !where.id_categoria) {
            where.id_categoria = parseInt(filtros.id_categoria);
        } else if (filtros.id_categoria && where.id_categoria && where.id_categoria.in) {
            // Si ya había filtro por habilidades, y además el usuario filtró en la UI por una categoría en específico
            const catId = parseInt(filtros.id_categoria);
            // Solo aplicar si el filtro UI está dentro de sus habilidades permitidas
            if (where.id_categoria.in.includes(catId)) {
                where.id_categoria = catId;
            } else {
                where.id_categoria = -1; // No tiene permiso para ver esta categoría
            }
        }

        if (filtros.id_empleador) {
            where.id_empleador = parseInt(filtros.id_empleador);
        }

        if (filtros.tipo_pago) {
            where.tipo_pago = filtros.tipo_pago;
        }

        if (filtros.busqueda) {
            where.OR = [
                { titulo: { contains: filtros.busqueda } },
                { descripcion: { contains: filtros.busqueda } }
            ];
        }

        if (filtros.ubicacion) {
            where.ubicacion = { contains: filtros.ubicacion };
        }

        if (filtros.urgente === 'true') {
            const manana = new Date();
            manana.setDate(manana.getDate() + 1);

            where.fecha_estimada = {
                lte: manana,
                gte: new Date()
            };
        }

        return prisma.trabajo.findMany({
            where,
            include: {
                empleador: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        foto_perfil: true
                    }
                },
                categoria: {
                    select: {
                        id_categoria: true,
                        nombre: true
                    }
                },
                postulaciones: {
                    select: {
                        id_postulacion: true,
                        estado: true
                    }
                }
            },
            orderBy: { fecha_creacion: 'desc' },
            take: filtros.limit || undefined,
            skip: filtros.skip || undefined
        });
    },

    async obtenerTrabajosRecomendados(id_usuario) {
        // 1. Obtener las habilidades del usuario
        const habilidades = await prisma.habilidad.findMany({
            where: { id_usuario: id_usuario },
            select: { id_categoria: true }
        });

        if (!habilidades || habilidades.length === 0) {
            return []; // Si no tiene habilidades, no hay recomendados
        }

        // 2. Extraer los IDs de las categorías
        const categoriasIds = habilidades.map(h => h.id_categoria);

        // 3. Buscar trabajos activos en esas categorías
        return prisma.trabajo.findMany({
            where: {
                estado: 'publicado',
                id_categoria: { in: categoriasIds },
                id_empleador: { not: id_usuario } // No recomendar sus propios trabajos
            },
            include: {
                empleador: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        foto_perfil: true
                    }
                },
                categoria: {
                    select: {
                        id_categoria: true,
                        nombre: true
                    }
                },
                postulaciones: {
                    select: {
                        id_postulacion: true,
                        estado: true
                    }
                }
            },
            orderBy: { fecha_creacion: 'desc' }
        });
    },

    async obtenerPorId(id) {
        return prisma.trabajo.findUnique({
            where: { id_trabajo: id },
            include: {
                empleador: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        apellido: true,
                        correo: true,
                        foto_perfil: true,
                        telefono: true
                    }
                },
                categoria: true,
                postulaciones: {
                    include: {
                        trabajador: {
                            select: {
                                id_usuario: true,
                                nombre: true,
                                apellido: true,
                                foto_perfil: true
                            }
                        }
                    }
                },
                acuerdos: {
                    include: {
                        trabajador: {
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

    async crearTrabajo(data) {
        return prisma.trabajo.create({
            data: {
                id_empleador: data.id_empleador,
                id_categoria: data.id_categoria,
                titulo: data.titulo,
                descripcion: data.descripcion,
                tipo_pago: data.tipo_pago,
                monto_pago: data.monto_pago ? parseFloat(data.monto_pago) : null,
                descripcion_trueque: data.descripcion_trueque,
                ubicacion: data.ubicacion,
                latitud: data.latitud ? parseFloat(data.latitud) : null,
                longitud: data.longitud ? parseFloat(data.longitud) : null,
                fecha_estimada: data.fecha_estimada ? new Date(data.fecha_estimada) : null,
                foto: data.foto || null,
                estado: data.estado || 'publicado'
            },
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
        });
    },

    async actualizarTrabajo(id, data) {
        const updateData = {};

        if (data.titulo) updateData.titulo = data.titulo;
        if (data.descripcion) updateData.descripcion = data.descripcion;
        if (data.id_categoria) updateData.id_categoria = parseInt(data.id_categoria);
        if (data.tipo_pago) updateData.tipo_pago = data.tipo_pago;
        if (data.monto_pago !== undefined) updateData.monto_pago = data.monto_pago ? parseFloat(data.monto_pago) : null;
        if (data.descripcion_trueque !== undefined) updateData.descripcion_trueque = data.descripcion_trueque;
        if (data.ubicacion) updateData.ubicacion = data.ubicacion;
        if (data.latitud !== undefined) updateData.latitud = data.latitud ? parseFloat(data.latitud) : null;
        if (data.longitud !== undefined) updateData.longitud = data.longitud ? parseFloat(data.longitud) : null;
        if (data.fecha_estimada) updateData.fecha_estimada = new Date(data.fecha_estimada);
        if (data.estado) updateData.estado = data.estado;

        return prisma.trabajo.update({
            where: { id_trabajo: id },
            data: updateData,
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
        });
    },

    async eliminarTrabajo(id) {
        return prisma.trabajo.delete({
            where: { id_trabajo: id }
        });
    }
};

module.exports = TrabajoService;