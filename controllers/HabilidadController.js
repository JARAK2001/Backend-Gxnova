const HabilidadService = require('../services/HabilidadService');
const axios = require('axios');
const FormData = require('form-data');

const HabilidadController = {
    async agregar(req, res) {
        try {
            const id_usuario = req.usuario.id_usuario;

            // Validar que se haya subido un archivo
            if (!req.file) {
                return res.status(400).json({ error: "Debe proveer un certificado o diploma válido para añadir la habilidad." });
            }

            console.log(`[HabilidadController] Obteniendo certificado para validación...`);

            // Subir el certificado a Cloudinary para poder guardarlo como referencia
            let certificado_url = null;
            try {
                certificado_url = await require('../services/CloudinaryService').uploadBuffer(
                    req.file.buffer,
                    req.file.originalname
                );
            } catch (uploadErr) {
                console.warn('[HabilidadController] No se pudo subir certificado a Cloudinary:', uploadErr.message);
            }

            // Construir el FormData con el archivo en memoria
            const form = new FormData();
            form.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype,
            });

            const SERVICE_URL = process.env.OBJECT_RECOGNITION_SERVICE_URL || "http://localhost:8080";
            let estado = 'aprobada';

            try {
                // Hacer la petición al microservicio de Python
                const validacionResponse = await axios.post(`${SERVICE_URL}/predict`, form, {
                    headers: {
                        ...form.getHeaders()
                    }
                });

                const validacion = validacionResponse.data;

                if (!validacion.is_valid) {
                    // La IA rechazó el certificado → guardar como pendiente_revision
                    console.log(`[HabilidadController] Certificado no validado por IA. Guardando como pendiente_revision.`);
                    estado = 'pendiente_revision';
                } else {
                    console.log(`[HabilidadController] Certificado verificado exitosamente por IA.`);
                }
            } catch (ServiceError) {
                // Si el servicio de IA no responde, guardar como pendiente_revision
                console.warn("[HabilidadController] Servicio de validación no disponible. Guardando como pendiente_revision:", ServiceError.message);
                estado = 'pendiente_revision';
            }

            // Guardar la habilidad con el estado correspondiente
            const habilidad = await HabilidadService.agregarHabilidad(id_usuario, req.body, estado, certificado_url);

            if (estado === 'pendiente_revision') {
                return res.status(202).json({
                    ...habilidad,
                    message: "Tu certificado no pudo ser validado automáticamente. Un administrador revisará tu solicitud pronto."
                });
            }

            res.status(201).json(habilidad);
        } catch (error) {
            console.error("[HabilidadController] Error general:", error);
            res.status(500).json({ error: error.message });
        }
    },

    async listarPorUsuario(req, res) {
        try {
            const { id } = req.params;
            const habilidades = await HabilidadService.obtenerHabilidadesUsuario(parseInt(id));
            res.json(habilidades);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const id_usuario = req.usuario.id_usuario;
            await HabilidadService.eliminarHabilidad(id, id_usuario);
            res.json({ message: 'Habilidad eliminada correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async buscarPorCategoria(req, res) {
        try {
            const { id } = req.params;
            const resultados = await HabilidadService.buscarPorCategoria(id);
            res.json(resultados);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = HabilidadController;
