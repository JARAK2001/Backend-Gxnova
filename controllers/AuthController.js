const AuthServices = require("../services/AuthServices");

const AuthController = {

    async register(req, res) {
        const { nombre, apellido, correo, password, telefono, rolNombre, terminosAceptados } = req.body;

        try {
            if (!correo || !password) {
                return res.status(400).json({ message: 'El correo y la contraseña son obligatorios.' });
            }
            if (!terminosAceptados || terminosAceptados === 'false') {
                return res.status(400).json({ message: 'Debes aceptar los Términos y Condiciones y la Política de Privacidad.' });
            }

            const result = await AuthServices.register({
                nombre, apellido, correo, password, telefono, rolNombre,
                terminosAceptados: terminosAceptados === 'true' || terminosAceptados === true
            });

            // Respuesta de Éxito HTTP 201 Created
            return res.status(201).json({
                message: result.message,
                usuario: result.usuario,
                token: result.token,
                requiereVerificacion: result.requiereVerificacion  // ← necesario para el Paso 2
            });

        } catch (error) {
            // Manejo de Errores
            // Si el servicio detecta que el correo ya existe:
            if (error.message.includes("ya está registrado")) {
                return res.status(409).json({ message: error.message }); // 409 Conflict
            }

            // Si el servicio detecta que el rol no es válido:
            if (error.message.includes("no es válido") || error.message.includes("no encontrado")) {
                return res.status(400).json({ message: error.message }); // 400 Bad Request
            }

            // Errores de verificación facial
            if (error.message.includes("no coincide con la cédula")) {
                return res.status(400).json({ message: "El rostro de la selfie no coincide con la foto de la cédula" });
            }

            if (error.message.includes("ya está registrado con otro usuario")) {
                return res.status(400).json({ message: "Este rostro ya está registrado. No se permite duplicar identidades." });
            }

            if (error.message.includes("ErrorFacial:")) {
                return res.status(400).json({ message: error.message.replace("ErrorFacial: ", "") });
            }

            if (error.message.includes("obligatorias")) {
                return res.status(400).json({ message: error.message });
            }

            console.error("Error en AuthController.register:", error.message);
            return res.status(500).json({ message: `Error interno del servidor. Detalle: ${error.message}` });
        }
    },

    async login(req, res) {
        const { correo, password } = req.body;

        try {
            // Validación mínima del Controller
            if (!correo || !password) {
                return res.status(400).json({ message: 'Faltan credenciales.' });
            }

            // Llamada al Servicio
            const result = await AuthServices.login({
                correo,
                password,
            });

            // Respuesta de Éxito HTTP 200 OK
            return res.status(200).json(result);

        } catch (error) {
            // Manejo de Errores
            // Si el servicio lanza un error de credenciales:
            if (error.message.includes("Credenciales inválidas")) {
                return res.status(401).json({ message: 'Correo o contraseña incorrectos.' }); // 401 Unauthorized
            }

            console.error("Error en AuthController.login:", error.message);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    async logout(req, res) {
        await AuthServices.logout();
        return res.status(200).json({ message: "Sesión cerrada. El token JWT debe ser eliminado por el cliente." });
    },

    async verificarIdentidad(req, res) {
        const { correo } = req.body;
        if (!correo) {
            return res.status(400).json({ message: 'El correo es obligatorio.' });
        }

        let foto_cedula_path = null;
        let foto_perfil_path = null;
        let selfie_path = null;

        if (req.files) {
            if (req.files.foto_cedula?.[0]) foto_cedula_path = req.files.foto_cedula[0].path;
            if (req.files.foto_perfil?.[0]) foto_perfil_path = req.files.foto_perfil[0].path;
            if (req.files.selfie?.[0]) selfie_path = req.files.selfie[0].path;
        }

        try {
            const result = await AuthServices.verificarIdentidadUsuario({
                correo, foto_cedula_path, foto_perfil_path, selfie_path
            });
            return res.status(200).json(result);
        } catch (error) {
            if (error.message.includes('no coincide') || error.message.includes('duplicado') ||
                error.message.includes('ya está registrado') || error.message.includes('ErrorFacial')) {
                return res.status(400).json({ message: error.message.replace('ErrorFacial: ', '') });
            }
            console.error('[AuthController] Error verificarIdentidad:', error.message);
            return res.status(500).json({ message: error.message });
        }
    },

    async verificarCorreo(req, res) {
        const { correo, codigo } = req.body;
        if (!correo || !codigo) {
            return res.status(400).json({ message: 'El correo y el código son obligatorios.' });
        }
        try {
            const result = await AuthServices.verificarCodigo({ correo, codigo });
            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },

    async reenviarCodigo(req, res) {
        const { correo } = req.body;
        if (!correo) {
            return res.status(400).json({ message: 'El correo es obligatorio.' });
        }
        try {
            const result = await AuthServices.reenviarCodigo({ correo });
            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },
};

module.exports = AuthController;