const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Middleware para proteger rutas que son exclusivas de usuarios Premium.
 * Debe ejecutarse DESPUÉS de `requireAuth` para asegurar que `req.user` existe.
 */
const requirePremium = async (req, res, next) => {
  try {
    const userId = req.usuario?.id_usuario;

    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: userId },
      select: { nivel_suscripcion: true, suscripcion_fin: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (user.nivel_suscripcion !== 'premium') {
      return res.status(403).json({ 
        error: "Acceso denegado. Se requiere una suscripción Premium para esta función.",
        requiresUpgrade: true 
      });
    }

    // Verificar si la suscripción no ha expirado
    const now = new Date();
    if (user.suscripcion_fin && now > user.suscripcion_fin) {
         return res.status(403).json({ 
            error: "Suscripción expirada. Por favor, renueva tu plan Premium.",
            requiresUpgrade: true 
          });
    }

    next();
  } catch (error) {
    console.error("Error en middleware requirePremium:", error);
    res.status(500).json({ error: "Error interno verificando la suscripción" });
  }
};

module.exports = { requirePremium };
