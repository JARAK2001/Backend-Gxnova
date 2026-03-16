const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class SubscriptionController {
  // Simulación de mejora a Premium (En producción esto integraría Stripe/MercadoPago)
  static async upgradeToPremium(req, res) {
    try {
      const { id_usuario } = req.usuario; // Obtenido del token JWT
      
      // Suscripción de 30 días
      const inicio = new Date();
      const fin = new Date();
      fin.setDate(fin.getDate() + 30);

      const updatedUser = await prisma.usuario.update({
        where: { id_usuario: id_usuario },
        data: {
          nivel_suscripcion: 'premium',
          suscripcion_inicio: inicio,
          suscripcion_fin: fin
        },
        select: {
          id_usuario: true,
          nivel_suscripcion: true,
          suscripcion_inicio: true,
          suscripcion_fin: true
        }
      });

      return res.status(200).json({
        message: "Suscripción actualizada a Premium con éxito.",
        subscription: updatedUser
      });

    } catch (error) {
      console.error("Error al mejorar suscripción:", error);
      return res.status(500).json({ error: "Error interno del servidor al procesar la suscripción." });
    }
  }

  // Verificar estado de suscripción (ej. al loguearse o cargar el dashboard)
  static async getSubscriptionStatus(req, res) {
    try {
      const { id_usuario } = req.usuario;

      const user = await prisma.usuario.findUnique({
        where: { id_usuario: id_usuario },
        select: {
          nivel_suscripcion: true,
          suscripcion_inicio: true,
          suscripcion_fin: true
        }
      });

      if (!user) {
         return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Validar si la suscripción expiró
      let isActive = false;
      if (user.nivel_suscripcion === 'premium' && user.suscripcion_fin) {
          const now = new Date();
          isActive = now <= user.suscripcion_fin;
          
          // Opcional: Auto-downgrade si expiró (se podría hacer mediante un cron job también)
          if (!isActive) {
             await prisma.usuario.update({
                 where: { id_usuario },
                 data: { nivel_suscripcion: 'free' }
             });
             user.nivel_suscripcion = 'free';
          }
      }

      return res.status(200).json({
        nivel_suscripcion: user.nivel_suscripcion,
        activa: isActive,
        expira_en: user.suscripcion_fin
      });

    } catch (error) {
       console.error("Error obteniendo estado de suscripción:", error);
       return res.status(500).json({ error: "Error al obtener la información de suscripción." });
    }
  }
}

module.exports = SubscriptionController;
