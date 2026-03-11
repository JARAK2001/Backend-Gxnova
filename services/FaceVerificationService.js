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
            // Validar que exista la URL del servicio y quitar barras finales
            let SERVICE_URL = process.env.FACIAL_RECOGNITION_SERVICE_URL || "http://localhost:8000";
            if (SERVICE_URL.endsWith('/')) {
                SERVICE_URL = SERVICE_URL.slice(0, -1);
            }

            // Llamada al microservicio local
            const response = await axios.post(
                `${SERVICE_URL}/compare-faces`,
                {
                    imageUrl1: urlImagen1,
                    imageUrl2: urlImagen2
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = response.data;

            console.log(`[FaceRecognition] Comparación de rostros - Distancia: ${data.distance}`);

            const coincide = data.match;

            console.log(
                `[FaceRecognition] Resultado: ${coincide ? "COINCIDE" : "NO COINCIDE"} (Distancia: ${data.distance})`
            );

            return coincide;
        } catch (error) {
            // Manejo de errores específicos del microservicio
            if (error.response?.data) {
                console.error("[FaceRecognition] Error del servicio:", error.response.data);
                throw new Error(`ErrorFacial: ${error.response.data.detail || "Error al procesar la imagen."}`);
            }

            console.error("[FaceRecognition] Error inesperado:", error.message);
            throw new Error("ErrorFacial: Error de comunicación con el microservicio facial en la comparación.");
        }
    },

    /**
     * Busca si un rostro ya existe en una lista de urls candidatas
     * @param {string} targetUrl URL del rostro a buscar
     * @param {string[]} candidateUrls URLs de rostros ya registrados
     * @returns {Promise<boolean>} true si encontró un duplicado
     */
    async buscarDuplicado(targetUrl, candidateUrls) {
        try {
            let SERVICE_URL = process.env.FACIAL_RECOGNITION_SERVICE_URL || "http://localhost:8000";
            if (SERVICE_URL.endsWith('/')) {
                SERVICE_URL = SERVICE_URL.slice(0, -1);
            }

            if (!candidateUrls || candidateUrls.length === 0) return false;

            const response = await axios.post(
                `${SERVICE_URL}/find-match`,
                {
                    targetUrl: targetUrl,
                    candidateUrls: candidateUrls
                },
                {
                    headers: { "Content-Type": "application/json" }
                }
            );

            const data = response.data;
            console.log(`[FaceRecognition] Búsqueda de duplicados - ¿Encontrado?: ${data.matchFound}`);

            return data.matchFound;
        } catch (error) {
            console.error("[FaceRecognition] Error al buscar duplicados:", error.message);
            throw new Error("ErrorFacial: Error de comunicación con el microservicio facial en la búsqueda de duplicados.");
        }
    }
};

module.exports = FaceVerificationService;
