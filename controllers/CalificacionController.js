const CalificacionService = require("../services/CalificacionService");
const TrabajoService = require("../services/TrabajoService");

const CalificacionController = {
    async crearCalificacion(req, res) {
        const { id_trabajo, id_usuario_receptor, puntuacion, comentario } = req.body;
        const id_usuario_emisor = req.usuario.id_usuario;

        if (!id_trabajo || !id_usuario_receptor || !puntuacion) {
            return res.status(400).json({ error: "Faltan datos obligatorios." });
        }

        try {
            // Verificar que el trabajo exista y esté completado (opcional, depende de reglas de negocio)
            const trabajo = await TrabajoService.obtenerPorId(parseInt(id_trabajo));
            if (!trabajo) {
                return res.status(404).json({ error: "Trabajo no encontrado." });
            }

            // Crear calificación por el id del receptor a el traajador
            const nuevaCalificacion = await CalificacionService.crearCalificacion({
                id_trabajo: parseInt(id_trabajo),
                id_usuario_emisor,
                id_usuario_receptor: parseInt(id_usuario_receptor),
                puntuacion: parseInt(puntuacion),
                comentario
            });

            return res.status(201).json({
                message: "Calificación enviada exitosamente.",
                calificacion: nuevaCalificacion
            });

        } catch (error) {
            if (error.message === "Ya has calificado este trabajo.") {
                return res.status(400).json({ error: error.message });
            }
            console.error("Error al crear calificación:", error);
            return res.status(500).json({ error: "Error interno al crear la calificación." });
        }
    },

    async obtenerCalificacionesUsuario(req, res) {
        const id_usuario = parseInt(req.params.id);
        try {
            const calificaciones = await CalificacionService.obtenerCalificacionesUsuario(id_usuario);
            return res.status(200).json({ calificaciones });
        } catch (error) {
            console.error("Error al obtener calificaciones:", error);
            return res.status(500).json({ error: "Error al obtener las calificaciones." });
        }
    },

    async obtenerPromedioUsuario(req, res) {
        const id_usuario = parseInt(req.params.id);
        try {
            const datos = await CalificacionService.obtenerPromedioUsuario(id_usuario);
            return res.status(200).json(datos);
        } catch (error) {
            console.error("Error al obtener promedio:", error);
            return res.status(500).json({ error: "Error al obtener el promedio." });
        }
    },

    async verificarSiYaCalifico(req, res) {
        const { id_trabajo } = req.query;
        const id_usuario_emisor = req.usuario.id_usuario;

        if (!id_trabajo) return res.status(400).json({ error: "Falta id_trabajo" });

        try {
            const calificacion = await CalificacionService.verificarCalificacion(parseInt(id_trabajo), id_usuario_emisor);
            return res.status(200).json({ yaCalifico: !!calificacion, calificacion });
        } catch (error) {
            console.error("Error al verificar calificación:", error);
            return res.status(500).json({ error: "Error interno." });
        }
    }
};

module.exports = CalificacionController;
