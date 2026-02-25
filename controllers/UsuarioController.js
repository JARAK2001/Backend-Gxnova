const UsuarioService = require("../services/UsuarioService");
const bcrypt = require("bcryptjs");

// Helper para limpiar el objeto antes de devolverlo al cliente
const limpiarUsuario = (usuario) => {
    if (!usuario) return null;
    const { password_hash, ...resto } = usuario;
    return resto;
};


const UsuarioController = {

    async obtenerPerfil(req, res) {
        try {
            if (!req.usuario) {
                // Esto solo pasa si el middleware falla
                return res.status(401).json({ error: "Usuario no autenticado." });
            }

            // El objeto req.usuario ya contiene todos los datos cargados por el JWT middleware
            return res.status(200).json({ usuario: limpiarUsuario(req.usuario) });

        } catch (error) {
            console.error("Error en UsuarioController.obtenerPerfil:", error);
            return res.status(500).json({ error: 'Error al obtener el perfil.' });
        }
    },

    async actualizarUsuario(req, res) {
        // OBTENER el ID de la URL (ruta: /usuarios/:id)
        const idUsuarioRuta = parseInt(req.params.id);

        try {
            // CONTROL DE AUTORIZACIÓN: Usamos el ID del TOKEN para verificar.
            if (req.usuario.id_usuario !== idUsuarioRuta) {
                // 403 Forbidden: No tiene permiso para modificar otro perfil.
                return res.status(403).json({ error: "Acceso prohibido. No puede actualizar otro perfil." });
            }

            // Filtrar solo los campos permitidos y hashear la contraseña si existe
            const { nombre, apellido, correo, password, telefono, foto_perfil } = req.body;

            const datosAActualizar = {};
            if (nombre) datosAActualizar.nombre = nombre;
            if (apellido) datosAActualizar.apellido = apellido;
            if (telefono) datosAActualizar.telefono = telefono;

            // Si hay archivo subido, usar esa ruta. Si no, usar la URL si se envió texto.
            if (req.file) {
                // Cloudinary URL desde el middleware
                datosAActualizar.foto_perfil = req.file.path;
            } else if (foto_perfil) {
                datosAActualizar.foto_perfil = foto_perfil;
            }

            if (correo) datosAActualizar.correo = correo;

            // Si se envía una nueva contraseña, la hasheamos ANTES de enviarla al servicio
            if (password) {
                datosAActualizar.password_hash = await bcrypt.hash(password, 10);
            }

            if (Object.keys(datosAActualizar).length === 0) {
                return res.status(400).json({ error: "No hay datos válidos para actualizar." });
            }

            // Llamada al Servicio Una sola llamada a la DB
            const usuarioActualizado = await UsuarioService.actualizarUsuario(
                idUsuarioRuta,
                datosAActualizar
            );

            // Respuesta Limpiamos el hash antes de devolver
            return res.status(200).json({
                message: "Usuario actualizado correctamente",
                usuario: limpiarUsuario(usuarioActualizado)
            });

        } catch (error) {
            console.error("Error en UsuarioController.actualizarUsuario:", error);
            // Si hay error de unicidad ejemplo correo ya existe, Prisma lo captura
            return res.status(500).json({ error: 'Error al actualizar el usuario.' });
        }
    },

    async eliminarUsuario(req, res) {
        const idUsuarioRuta = parseInt(req.params.id);

        try {
            // CONTROL DE AUTORIZACIÓN: Usamos el ID del TOKEN para verificar.
            if (req.usuario.id_usuario !== idUsuarioRuta) {
                return res.status(403).json({ error: "Acceso prohibido. No puede eliminar otra cuenta." });
            }

            // Buscar antes de eliminar para devolver 404 si no existe
            const existe = await UsuarioService.obtenerPorId(idUsuarioRuta);
            if (!existe) {
                return res.status(404).json({ error: "Usuario no encontrado." });
            }

            // Llamada al Servicio
            await UsuarioService.eliminarUsuario(idUsuarioRuta);

            return res.status(204).send();

        } catch (error) {
            console.error("Error en UsuarioController.eliminarUsuario:", error);
            return res.status(500).json({ error: 'Error al eliminar el usuario.' });
        }
    },

    async obtenerUsuarioPorCorreo(req, res) {
        // Asume que el correo viene como query parameter: /usuarios/buscar-correo?correo=test@ejemplo.com
        const correo = req.query.correo;

        if (!correo) {
            return res.status(400).json({ error: 'Falta el parámetro de correo.' });
        }

        try {
            const usuario = await UsuarioService.obtenerPorCorreo(correo);

            if (!usuario) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }

            // Devolvemos el usuario limpio
            return res.status(200).json({ usuario: limpiarUsuario(usuario) });

        } catch (error) {
            console.error("Error en UsuarioController.obtenerUsuarioPorCorreo:", error);
            return res.status(500).json({ error: 'Error al obtener el usuario por correo.' });
        }
    },

    async crearUsuario(req, res) {
        // Recibimos el nombre del rol deseado
        const { nombre, apellido, correo, password, rolNombre } = req.body;

        if (!correo || !password || !rolNombre) {
            return res.status(400).json({ message: 'Correo, contraseña y rol son obligatorios.' });
        }

        try {
            // Verificar si ya existe
            const usuarioExistente = await UsuarioService.obtenerPorCorreo(correo);
            if (usuarioExistente) {
                return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
            }

            // Buscar el Rol
            const rol = await UsuarioService.obtenerRolPorNombre(rolNombre);
            if (!rol) {
                return res.status(400).json({ message: `El rol '${rolNombre}' no es válido o no existe.` });
            }
            const idRol = rol.id_rol;

            // Hash de Contraseña
            const passwordHash = await bcrypt.hash(password, 10);

            // Crear el usuario
            const nuevoUsuario = await UsuarioService.crearUsuario({
                nombre,
                apellido,
                correo,
                password_hash: passwordHash,
            });

            await UsuarioService.asignarRolAUsuario(nuevoUsuario.id_usuario, idRol);

            // Respuesta
            return res.status(201).json({
                message: `Usuario creado exitosamente y rol '${rolNombre}' asignado.`,
                usuario: limpiarUsuario(nuevoUsuario),
                rolAsignado: rolNombre
            });

        } catch (error) {
            console.error("Error en UsuarioController.crearUsuario:", error);
            return res.status(500).json({ message: 'Error interno al crear el usuario.' });
        }
    },

    async agregarRol(req, res) {
        try {
            const id_usuario = req.usuario.id_usuario;
            const { rol } = req.body; // "Trabajador" o "Empleador"

            if (!rol) {
                return res.status(400).json({ error: "El nombre del rol es requerido" });
            }

            const nuevoRol = await UsuarioService.agregarRol(id_usuario, rol);
            res.status(200).json({ message: "Rol agregado correctamente", rol: nuevoRol });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },

    async obtenerUsuarios(req, res) {
        try {
            const usuarios = await UsuarioService.obtenerUsuarios();
            return res.status(200).json({ usuarios });
        } catch (error) {
            console.error("Error en UsuarioController.obtenerUsuarios:", error);
            return res.status(500).json({ error: 'Error interno al obtener los usuarios.' });
        }
    },

    async obtenerPerfilPublico(req, res) {
        try {
            const idUsuario = parseInt(req.params.id);

            if (isNaN(idUsuario)) {
                return res.status(400).json({ error: 'ID de usuario inválido.' });
            }

            const perfil = await UsuarioService.obtenerPerfilPublico(idUsuario);

            if (!perfil) {
                return res.status(404).json({ error: 'Usuario no encontrado.' });
            }

            return res.status(200).json({ perfil });

        } catch (error) {
            console.error("Error en UsuarioController.obtenerPerfilPublico:", error);
            return res.status(500).json({ error: 'Error al obtener el perfil público.' });
        }
    },
};

module.exports = UsuarioController;