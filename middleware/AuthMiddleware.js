const jwt = require('jsonwebtoken');
const UsuarioService = require('../services/UsuarioService');

if (!process.env.JWT_SECRET_KEY) {
    throw new Error("ERROR: Falta JWT_SECRET_KEY en .env para el middleware.");
}

const verificarJWT = async (req, res, next) => {
    try {
        // Obtener el token del encabezado Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
        }

        // El encabezado es típicamente "Bearer TOKEN_AQUI"
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Formato de token inválido (se espera Bearer <token>).' });
        }

        // Verificamos la validez del token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        const usuario = await UsuarioService.obtenerPorId(decoded.id); 

        if (!usuario) {
            return res.status(401).json({ error: 'Token válido, pero el usuario ya no existe.' });
        }
        
        req.usuario = usuario;

        // Pasar al siguiente middleware o al controlador
        next();

    } catch (error) {
        // Captura errores de JWT
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado. Por favor, vuelva a iniciar sesión.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido o malformado.' });
        }
        
        // Otros errores internos
        console.error("Error en middleware JWT:", error);
        return res.status(500).json({ error: 'Error interno del servidor al verificar la autenticación.' });
    }
};

module.exports = verificarJWT;