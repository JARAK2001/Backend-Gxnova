const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UsuarioService = require("./UsuarioService");
const VerificationService = require("./VerificationService");
const EmailService = require("./EmailService");

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

const generarCodigo6Digitos = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
};

const limpiarUsuario = (usuario) => {
    if (!usuario) return null;
    const { password_hash, ...resto } = usuario;
    return resto;
};

const AuthServices = {
    async register(data) {
        const { nombre, apellido, correo, password, telefono, rolNombre, terminosAceptados, foto_cedula_path, foto_perfil_path, selfie_path } = data;

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
            terminos_aceptados: terminosAceptados,
            fecha_aceptacion_terminos: new Date()
        };

        // Si se proporciona telefono, agregarlo
        if (telefono) {
            datosUsuario.telefono = telefono;
        }

        // Agregar foto_perfil si existe
        if (foto_perfil_path) {
            datosUsuario.foto_perfil = foto_perfil_path;
        }

        // ===== CREAR EL USUARIO SIN VERIFICACIÓN FACIAL =====
        // Las fotos se subirán en el Paso 3, después de verificar el correo
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

        // Generar código de verificación de correo
        const codigo = generarCodigo6Digitos();
        const expiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        await prisma.usuario.update({
            where: { id_usuario: nuevoUsuario.id_usuario },
            data: {
                codigo_verificacion: codigo,
                codigo_verificacion_expira: expiracion,
                correo_verificado: false,
            }
        });

        // Enviar correo con el código (sin bloquear el flujo)
        EmailService.enviarCorreoVerificacion(nuevoUsuario.correo, nuevoUsuario.nombre, codigo).catch(err => {
            console.error("[AuthServices] Aviso: No se pudo enviar el correo de verificación", err.message);
        });

        const token = generarToken(nuevoUsuario);

        return {
            message: "Usuario registrado. Por favor verifica tu correo.",
            usuario: limpiarUsuario(usuarioConRol),
            token,
            requiereVerificacion: true,
        };
    },

    async verificarIdentidadUsuario({ correo, foto_cedula_path, foto_perfil_path, selfie_path }) {
        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario) throw new Error("Usuario no encontrado.");
        if (!usuario.correo_verificado) throw new Error("Primero debes verificar tu correo.");
        if (usuario.verificado) throw new Error("Este usuario ya tiene su identidad verificada.");

        if (!foto_cedula_path || !selfie_path) {
            throw new Error("La foto de cédula y la selfie son obligatorias para verificar la identidad.");
        }

        // Ejecutar verificación con el microservicio Docker
        try {
            const esVerificado = await VerificationService.verificarIdentidad(
                foto_cedula_path,
                selfie_path
            );

            if (esVerificado) {
                const datosActualizacion = {
                    foto_cedula: foto_cedula_path,
                    foto_rostro: selfie_path,
                    verificado: true,
                    fecha_verificacion: new Date(),
                };

                if (foto_perfil_path) {
                    datosActualizacion.foto_perfil = foto_perfil_path;
                }

                await prisma.usuario.update({
                    where: { correo },
                    data: datosActualizacion
                });

                console.log(`[AuthServices] Identidad verificada exitosamente para: ${correo}`);

                // Enviar correo de bienvenida al completar todo el proceso
                const usuarioActualizado = await UsuarioService.obtenerPorId(usuario.id_usuario);
                EmailService.enviarCorreoBienvenida(usuario.correo, usuario.nombre).catch(() => {});

                const token = generarToken(usuario);
                return {
                    message: "Identidad verificada exitosamente. ¡Bienvenido a Gxnova!",
                    usuario: limpiarUsuario(usuarioActualizado),
                    token,
                };
            }
        } catch (error) {
            console.error("[AuthServices] Error en verificación de identidad:", error.message);
            throw error;
        }
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

        // Verificar si el correo fue confirmado
        if (!usuario.correo_verificado) {
            // Reenviar código si expiró
            const ahora = new Date();
            const expirado = !usuario.codigo_verificacion_expira || usuario.codigo_verificacion_expira < ahora;
            if (expirado) {
                const nuevoCodigo = generarCodigo6Digitos();
                const nuevaExpiracion = new Date(Date.now() + 15 * 60 * 1000);
                await prisma.usuario.update({
                    where: { id_usuario: usuario.id_usuario },
                    data: { codigo_verificacion: nuevoCodigo, codigo_verificacion_expira: nuevaExpiracion }
                });
                EmailService.enviarCorreoVerificacion(usuario.correo, usuario.nombre, nuevoCodigo).catch(err => {
                    console.error("[AuthServices] Aviso: No se pudo reenviar el código", err.message);
                });
            }
            return {
                requiereVerificacion: true,
                correo: usuario.correo,
                message: "Debes verificar tu correo antes de iniciar sesión. Se envió un nuevo código."
            };
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

    async verificarCodigo({ correo, codigo }) {
        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario) throw new Error("Usuario no encontrado.");
        if (usuario.correo_verificado) return { message: "El correo ya fue verificado." };

        if (!usuario.codigo_verificacion || usuario.codigo_verificacion !== codigo) {
            throw new Error("Código incorrecto.");
        }
        if (new Date() > new Date(usuario.codigo_verificacion_expira)) {
            throw new Error("El código ha expirado. Solicita uno nuevo.");
        }

        await prisma.usuario.update({
            where: { correo },
            data: {
                correo_verificado: true,
                codigo_verificacion: null,
                codigo_verificacion_expira: null,
            }
        });

        const usuarioActualizado = await UsuarioService.obtenerPorId(usuario.id_usuario);
        const token = generarToken(usuario);

        // El correo de bienvenida se enviará en el Paso 3 al verificar la identidad

        return {
            message: "Correo verificado exitosamente.",
            usuario: limpiarUsuario(usuarioActualizado),
            token,
        };
    },

    async reenviarCodigo({ correo }) {
        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario) throw new Error("Usuario no encontrado.");
        if (usuario.correo_verificado) throw new Error("El correo ya fue verificado.");

        const nuevoCodigo = generarCodigo6Digitos();
        const nuevaExpiracion = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.usuario.update({
            where: { correo },
            data: { codigo_verificacion: nuevoCodigo, codigo_verificacion_expira: nuevaExpiracion }
        });

        await EmailService.enviarCorreoVerificacion(usuario.correo, usuario.nombre, nuevoCodigo);
        return { message: "Código reenviado exitosamente." };
    },
};

module.exports = AuthServices;
