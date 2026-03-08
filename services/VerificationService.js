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

        // Verificar que el rostro no esté duplicado usando la Búsqueda Masiva del microservicio local
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
                foto_rostro: true,
            },
        });

        if (usuariosVerificados.length === 0) {
            console.log("[VerificationService] No hay usuarios verificados, no hay duplicados");
            return true;
        }

        // Extraer lista de URLs de rostros
        const urlRostrosRegistrados = usuariosVerificados.map(u => u.foto_rostro);

        console.log(`[VerificationService] Enviando ${urlRostrosRegistrados.length} rostros al microservicio para búsqueda rápida...`);

        // Llamar al endpoint /find-match del microservicio
        const duplicadoEncontrado = await FaceVerificationService.buscarDuplicado(
            fotoRostroUrl,
            urlRostrosRegistrados
        );

        if (duplicadoEncontrado) {
            console.warn("[VerificationService] Se detectó un rostro duplicado en la base de datos.");
            throw new Error("Este rostro ya está registrado con otro usuario");
        }

        console.log("[VerificationService] No se encontraron duplicados");
        console.log("[VerificationService] Verificación completada exitosamente");

        return true;
    },
};

module.exports = VerificationService;

