const axios = require("axios");

const FaceVerificationService = {
    /**
     * Compara dos rostros usando Face++ API
     * @param {string} urlImagen1 - URL pública de la primera imagen
     * @param {string} urlImagen2 - URL pública de la segunda imagen
     * @returns {Promise<boolean>} - true si los rostros coinciden (confianza >= 70%)
     */
    async compararRostros(urlImagen1, urlImagen2) {
        try {
            // Validar que existan las credenciales
            if (!process.env.FACEPP_API_KEY || !process.env.FACEPP_API_SECRET) {
                throw new Error(
                    "ERROR: Faltan credenciales de Face++ API en variables de entorno"
                );
            }

            // Llamada a Face++ API
            const response = await axios.post(
                "https://api-us.faceplusplus.com/facepp/v3/compare",
                new URLSearchParams({
                    api_key: process.env.FACEPP_API_KEY,
                    api_secret: process.env.FACEPP_API_SECRET,
                    image_url1: urlImagen1,
                    image_url2: urlImagen2,
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            const { confidence, faces1, faces2 } = response.data;

            console.log(`[Face++] Comparación de rostros - Confianza: ${confidence}%`);

            // Verificar que se detectaron rostros en ambas imágenes
            if (!faces1 || faces1.length === 0) {
                console.warn("[Face++] No se detectó rostro en la primera imagen");
                return false;
            }

            if (!faces2 || faces2.length === 0) {
                console.warn("[Face++] No se detectó rostro en la segunda imagen");
                return false;
            }

            // Umbral de confianza: 70%
            const UMBRAL_CONFIANZA = 70;
            const coincide = confidence >= UMBRAL_CONFIANZA;

            console.log(
                `[Face++] Resultado: ${coincide ? "COINCIDE" : "NO COINCIDE"} (${confidence}% >= ${UMBRAL_CONFIANZA}%)`
            );

            return coincide;
        } catch (error) {
            // Manejo de errores específicos de Face++ API
            if (error.response?.data) {
                console.error("[Face++] Error de API:", error.response.data);

                // Errores comunes de Face++ API
                const errorMsg = error.response.data.error_message;
                if (errorMsg?.includes("INVALID_IMAGE_URL")) {
                    throw new Error("URL de imagen inválida o inaccesible");
                }
                if (errorMsg?.includes("IMAGE_ERROR")) {
                    throw new Error("Error al procesar la imagen. Verifica el formato.");
                }
                if (errorMsg?.includes("CONCURRENCY_LIMIT_EXCEEDED")) {
                    throw new Error("Límite de concurrencia excedido. Intenta nuevamente.");
                }
            }

            console.error("[Face++] Error inesperado:", error.message);
            throw new Error("Error al verificar rostros con Face++ API");
        }
    },
};

module.exports = FaceVerificationService;
