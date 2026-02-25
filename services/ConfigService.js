const fs = require('fs').promises;
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../config/system_config.json');

// Asegurar que existe el archivo/directorio
const initConfig = async () => {
    try {
        await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
        try {
            await fs.access(CONFIG_FILE);
        } catch {
            // Valores por defecto
            const defaultConfig = {
                comisionPorcentaje: 10,
                moneda: 'COP',
                linkAndroid: '',
                linkIOS: '',
                mensajeBienvenida: '¡Bienvenido a GXNova!',
                notificacionesPush: true,
                modoMantenimiento: false,
                emailSoporte: 'soporte@gxnova.com'
            };
            await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
        }
    } catch (error) {
        console.error("Error inicializando config:", error);
    }
};

initConfig();

const ConfigService = {

    async obtenerConfiguracion() {
        try {
            const data = await fs.readFile(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error("Error leyendo config:", error);
            return {};
        }
    },

    async guardarConfiguracion(nuevaConfig) {
        try {
            // Leer actual para fusionar
            const actual = await this.obtenerConfiguracion();
            const actualizada = { ...actual, ...nuevaConfig };

            await fs.writeFile(CONFIG_FILE, JSON.stringify(actualizada, null, 2));
            return actualizada;
        } catch (error) {
            console.error("Error guardando config:", error);
            throw error;
        }
    }
};

module.exports = ConfigService;
