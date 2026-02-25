const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UsuarioService = require("./UsuarioService");
const VerificationService = require("./VerificationService");

// Validación de variable de entorno
if (!process.env.JWT_SECRET_KEY) {
    throw new Error("ERROR: Falta JWT_SECRET_KEY en .env");
}

const generarToken = (usuario) => {
    return jwt.sign(
        { id: usuario.id_usuario, correo: usuario.correo },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1d" }
    );
};

const limpiarUsuario = (usuario) => {
    if (!usuario) return null;
    const { password_hash, ...resto } = usuario;
    return resto;
};

const AuthServices = {
    async register(data) {
        const { nombre, apellido, correo, password, telefono, rolNombre, foto_cedula_path, foto_perfil_path, selfie_path } = data;

        const usuarioExistente = await UsuarioService.obtenerPorCorreo(correo);
        if (usuarioExistente) {
            throw new Error("El correo electrónico ya está registrado.");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Preparar datos del usuario 
        const datosUsuario = {
            nombre,
            apellido,
            correo,
            password_hash: passwordHash,
        };

        // Si se proporciona telefono, agregarlo
        if (telefono) {
            datosUsuario.telefono = telefono;
        }

        // Agregar foto_perfil si existe
        if (foto_perfil_path) {
            datosUsuario.foto_perfil = foto_perfil_path;
        }

        // ===== VERIFICACIÓN FACIAL OBLIGATORIA PARA EMPLEADOR Y TRABAJADOR =====
        // Validar que ambas imágenes (cédula y selfie) estén presentes
        if (!foto_cedula_path || !selfie_path) {
            throw new Error("La foto de cédula y la selfie son obligatorias para el registro");
        }

        // Guardar foto_cedula
        datosUsuario.foto_cedula = foto_cedula_path;

        // Intentar verificar identidad con Face++
        try {
            const esVerificado = await VerificationService.verificarIdentidad(
                foto_cedula_path,
                selfie_path
            );

            if (esVerificado) {
                // Guardar la selfie verificada
                datosUsuario.foto_rostro = selfie_path;
                datosUsuario.verificado = true;
                datosUsuario.fecha_verificacion = new Date();

                console.log("[AuthServices] Usuario verificado exitosamente con Face++");
            }
        } catch (error) {
            // Si la verificación falla, lanzar el error específico
            console.error("[AuthServices] Error en verificación facial:", error.message);
            throw error; // Propagar el error (rostro no coincide o duplicado)
        }

        const nuevoUsuario = await UsuarioService.crearUsuario(datosUsuario);

        // Determinar el rol si no se proporciona, usar "Trabajador" por defecto
        const nombreRol = rolNombre || "Trabajador";

        // Validar que el rol existe
        const rol = await prisma.rol.findUnique({
            where: { nombre: nombreRol }
        });

        if (!rol) {
            throw new Error(`Error: El rol '${nombreRol}' no es válido o no existe. Roles disponibles: Administrador, Empleador, Trabajador.`);
        }

        // Asignar el rol al usuario
        await prisma.usuarioEnRol.create({
            data: {
                id_usuario: nuevoUsuario.id_usuario,
                id_rol: rol.id_rol,
            }
        });

        const usuarioConRol = await UsuarioService.obtenerPorId(
            nuevoUsuario.id_usuario
        );

        const token = generarToken(nuevoUsuario);

        return {
            message: "Usuario registrado correctamente.",
            usuario: limpiarUsuario(usuarioConRol),
            token
        };
    },

    async login(data) {
        const { correo, password } = data;

        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario) {
            throw new Error("Credenciales inválidas");
        }

        const passwordMatch = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordMatch) {
            throw new Error("Credenciales inválidas");
        }

        // Cargar usuario completo con roles
        const usuarioConRol = await UsuarioService.obtenerPorId(usuario.id_usuario);

        const token = generarToken(usuario);

        return {
            usuario: limpiarUsuario(usuarioConRol),
            token
        };
    },

    async logout() {
        return true;
    },
};

module.exports = AuthServices;
