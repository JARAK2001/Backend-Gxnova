const FaceVerificationService = require("./FaceVerificationService");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const VerificationService = {
    /**
     * Verifica la identidad del usuario comparando la foto de la cédula y la selfie.
     * También verifica que el rostro no esté duplicado en la base de datos.
     *
     * @param {string} fotoCedulaUrl - URL de Cloudinary de la imagen de la cédula
     * @param {string} fotoRostroUrl - URL de Cloudinary de la selfie
     * @returns {Promise<boolean>} - true si la verificación es exitosa
     * @throws {Error} - Si el rostro no coincide o está duplicado
     */
    async verificarIdentidad(fotoCedulaUrl, fotoRostroUrl) {
        console.log("[VerificationService] Iniciando verificación de identidad...");

        // Validar que existan ambas URLs
        if (!fotoCedulaUrl || !fotoRostroUrl) {
            console.warn("[VerificationService] Faltan URLs de imágenes");
            throw new Error("Faltan imágenes para verificación");
        }

        // Verificar que la selfie coincida con la cédula
        console.log("[VerificationService] Paso 1: Verificando selfie vs cédula...");
        const coincideConCedula = await FaceVerificationService.compararRostros(
            fotoCedulaUrl,
            fotoRostroUrl
        );

        if (!coincideConCedula) {
            console.warn("[VerificationService] El rostro no coincide con la cédula");
            throw new Error("El rostro no coincide con la cédula");
        }

        console.log("[VerificationService] Selfie coincide con cédula");

        // Verificar que el rostro no esté duplicado
        console.log("[VerificationService] Paso 2: Verificando duplicados...");

        // Obtener todos los usuarios verificados con foto_rostro
        const usuariosVerificados = await prisma.usuario.findMany({
            where: {
                verificado: true,
                foto_rostro: {
                    not: null,
                },
            },
            select: {
                id_usuario: true,
                foto_rostro: true,
                correo: true,
            },
        });

        console.log(
            `[VerificationService] Comparando contra ${usuariosVerificados.length} usuarios verificados...`
        );

        if (usuariosVerificados.length === 0) {
            console.log("[VerificationService] No hay usuarios verificados, no hay duplicados");
            return true;
        }

        // Comparar en paralelo usando Promise.all()
        const comparaciones = usuariosVerificados.map(async (usuario) => {
            try {
                const coincide = await FaceVerificationService.compararRostros(
                    usuario.foto_rostro,
                    fotoRostroUrl
                );

                if (coincide) {
                    console.warn(
                        `[VerificationService] Rostro duplicado detectado con usuario: ${usuario.correo}`
                    );
                    return { duplicado: true, usuario };
                }

                return { duplicado: false };
            } catch (error) {
                console.error(
                    `[VerificationService] Error comparando con usuario ${usuario.id_usuario}:`,
                    error.message
                );
                // Si falla una comparación, continuamos con las demás
                return { duplicado: false };
            }
        });

        // Ejecutar todas las comparaciones en paralelo
        const resultados = await Promise.all(comparaciones);

        // Verificar si alguna comparación encontró un duplicado
        const duplicadoEncontrado = resultados.find((r) => r.duplicado);

        if (duplicadoEncontrado) {
            throw new Error("Este rostro ya está registrado con otro usuario");
        }

        console.log("[VerificationService] No se encontraron duplicados");
        console.log("[VerificationService] Verificación completada exitosamente");

        return true;
    },
};

module.exports = VerificationService;

