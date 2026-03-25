const FaceVerificationService = require("./FaceVerificationService");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const VerificationService = {
    /**
     * Verifica la identidad del usuario a partir de su selfie.
     * Verifica que el rostro no esté duplicado en la base de datos.
     *
     * @param {string} fotoRostroUrl - URL de Cloudinary de la selfie
     * @returns {Promise<boolean>} - true si la verificación es exitosa
     * @throws {Error} - Si el rostro está duplicado
     */
    async verificarIdentidad(fotoRostroUrl) {
        console.log("[VerificationService] Iniciando verificación de identidad...");

        // Validar que exista la URL
        if (!fotoRostroUrl) {
            console.warn("[VerificationService] Falta URL de selfie");
            throw new Error("Falta la imagen para verificación");
        }

        // Verificar que el rostro no esté duplicado usando la Búsqueda Masiva del microservicio local
        console.log("[VerificationService] Verificando duplicados...");

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
        const { matchFound } = await FaceVerificationService.buscarDuplicado(
            fotoRostroUrl,
            urlRostrosRegistrados
        );

        if (matchFound) {
            console.warn("[VerificationService] Se detectó un rostro duplicado en la base de datos.");
            throw new Error("Este rostro ya está registrado con otro usuario");
        }

        console.log("[VerificationService] No se encontraron duplicados");
        console.log("[VerificationService] Verificación completada exitosamente");

        return true;
    },
};

module.exports = VerificationService;

