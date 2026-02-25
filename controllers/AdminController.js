const AdminService = require("../services/AdminService");
const UsuarioService = require("../services/UsuarioService");
const TrabajoService = require("../services/TrabajoService");
const ReporteService = require("../services/ReporteService");
const ConfigService = require("../services/ConfigService");
const RolService = require("../services/RolService");

const AdminController = {
    // ============ ROLES ============
    async obtenerRoles(req, res) {
        try {
            const roles = await RolService.obtenerRoles();
            res.json({ roles });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error al obtener roles" });
        }
    },

    async crearRol(req, res) {
        try {
            const nuevoRol = await RolService.crearRol(req.body);
            res.status(201).json({ message: "Rol creado", rol: nuevoRol });
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    },

    async actualizarRol(req, res) {
        const { id } = req.params;
        try {
            const rolActualizado = await RolService.actualizarRol(id, req.body);
            res.json({ message: "Rol actualizado", rol: rolActualizado });
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    },

    async eliminarRol(req, res) {
        const { id } = req.params;
        try {
            await RolService.eliminarRol(id);
            res.json({ message: "Rol eliminado" });
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    },

    // ============ CONFIGURACIÓN ============
    async obtenerConfiguracion(req, res) {
        try {
            const config = await ConfigService.obtenerConfiguracion();
            res.json(config);
        } catch (error) {
            console.error("Error obteniendo config:", error);
            res.status(500).json({ error: "Error al obtener configuración" });
        }
    },

    async actualizarConfiguracion(req, res) {
        try {
            const nuevaConfig = req.body;
            const updated = await ConfigService.guardarConfiguracion(nuevaConfig);
            res.json({ message: "Configuración actualizada", config: updated });
        } catch (error) {
            console.error("Error actualizando config:", error);
            res.status(500).json({ error: "Error al actualizar configuración" });
        }
    },

    async obtenerEstadisticas(req, res) {
        try {
            const stats = await AdminService.obtenerEstadisticas();
            res.json(stats);
        } catch (error) {
            console.error("Error obteniendo estadísticas:", error);
            res.status(500).json({ error: "Error al obtener estadísticas" });
        }
    },

    async obtenerAnaliticas(req, res) {
        try {
            const [crecimiento, topUsuarios, distribucion] = await Promise.all([
                AdminService.obtenerCrecimientoUsuarios(),
                AdminService.obtenerTopUsuarios(),
                AdminService.obtenerDistribucionCategorias()
            ]);

            res.json({
                crecimiento,
                topUsuarios,
                distribucion
            });
        } catch (error) {
            console.error("Error obteniendo analíticas:", error);
            res.status(500).json({ error: "Error al obtener analíticas" });
        }
    },

    async obtenerTodosLosUsuarios(req, res) {
        try {
            // Reutilizamos servicio existente, pero podríamos paginar aquí.
            const usuarios = await UsuarioService.obtenerUsuarios();
            res.json({ usuarios });
        } catch (error) {
            res.status(500).json({ error: "Error al obtener usuarios" });
        }
    },

    async cambiarEstadoUsuario(req, res) {
        const { id } = req.params;
        const { estado } = req.body; // 'activo' o 'suspendido'

        if (!['activo', 'suspendido'].includes(estado)) {
            return res.status(400).json({ error: "Estado inválido" });
        }

        try {
            const usuario = await AdminService.cambiarEstadoUsuario(id, estado);
            res.json({ message: `Usuario ${estado} correctamente`, usuario });
        } catch (error) {
            console.error("Error cambiando estado usuario:", error);
            res.status(500).json({ error: "Error al cambiar estado" });
        }
    },

    async obtenerTodosLosTrabajos(req, res) {
        try {
            // Necesitamos un método para ver TODOS los trabajos (incluso borrados/cancelados si aplicara)
            // TrabajoService.obtenerTodos() suele traer los publicados.
            // Vamos a usar TrabajoService.obtenerTodos si existe o creamos uno.
            // Asumiendo que TrabajoService.obtenerTodos trae todo sin flitros por defecto
            const trabajos = await TrabajoService.obtenerTrabajos({});
            res.json({ trabajos });
        } catch (error) {
            console.error("Error obteniendo trabajos:", error);
            res.status(500).json({ error: "Error al obtener trabajos" });
        }
    },

    async obtenerPendientesVerificacion(req, res) {
        try {
            const usuarios = await AdminService.obtenerUsuariosPendientesVerificacion();
            res.json({ usuarios });
        } catch (error) {
            console.error("Error obteniendo pendientes:", error);
            res.status(500).json({ error: "Error al obtener usuarios pendientes" });
        }
    },

    async verificarUsuario(req, res) {
        const { id } = req.params;
        const { aprobado, motivo } = req.body;

        try {
            const usuario = await AdminService.verificarUsuario(id, aprobado, motivo);
            if (aprobado) {
                res.json({ message: "Usuario verificado correctamente", usuario });
            } else {
                res.json({ message: "Verificación rechazada. El usuario deberá subir documentos nuevamente.", usuario });
            }
        } catch (error) {
            console.error("Error en verificación:", error);
            res.status(500).json({ error: "Error al procesar la verificación" });
        }
    },

    async eliminarTrabajo(req, res) {
        const { id } = req.params;
        try {
            await AdminService.eliminarTrabajo(id);
            res.json({ message: "Trabajo cancelado/eliminado por administración" });
        } catch (error) {
            console.error("Error eliminando trabajo:", error);
            res.status(500).json({ error: "Error al eliminar trabajo" });
        }
    },

    // ============ REPORTES ============
    async obtenerReportes(req, res) {
        try {
            const filtros = {
                estado: req.query.estado,
                tipo: req.query.tipo
            };
            const reportes = await ReporteService.obtenerReportes(filtros);
            res.json({ reportes });
        } catch (error) {
            console.error("Error obteniendo reportes:", error);
            res.status(500).json({ error: "Error al obtener reportes" });
        }
    },

    async resolverReporte(req, res) {
        const { id } = req.params;
        try {
            const reporte = await ReporteService.resolverReporte(parseInt(id));
            res.json({ message: "Reporte resuelto correctamente", reporte });
        } catch (error) {
            console.error("Error resolviendo reporte:", error);
            res.status(500).json({ error: "Error al resolver reporte" });
        }
    },

    async rechazarReporte(req, res) {
        const { id } = req.params;
        try {
            // Simplemente marcamos como resuelto sin tomar acción
            const reporte = await ReporteService.resolverReporte(parseInt(id));
            res.json({ message: "Reporte rechazado", reporte });
        } catch (error) {
            console.error("Error rechazando reporte:", error);
            res.status(500).json({ error: "Error al rechazar reporte" });
        }
    }
};

module.exports = AdminController;
