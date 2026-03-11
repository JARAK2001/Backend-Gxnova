/**
 * EmailService — Usa la API REST de Brevo (ex-Sendinblue) para enviar emails transaccionales.
 * Compatible con Railway / Render / Heroku (no depende de puertos SMTP).
 *
 * Variables de entorno requeridas:
 *   BREVO_API_KEY      → Tu clave API de Brevo (Settings → API Keys)
 *   BREVO_SENDER_EMAIL → El email remitente verificado en Brevo
 *   BREVO_SENDER_NAME  → (Opcional) Nombre del remitente, por defecto "Gxnova"
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

class EmailService {
    constructor() {
        this.apiKey = null;
        this.senderEmail = null;
        this.senderName = null;
    }

    _getCredentials() {
        if (this.apiKey) return;

        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.BREVO_SENDER_EMAIL;

        if (!apiKey || !senderEmail) {
            console.error('[EmailService] CRÍTICO: BREVO_API_KEY o BREVO_SENDER_EMAIL no están definidos en las variables de entorno.');
            throw new Error('Missing Brevo credentials');
        }

        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
        this.senderName = process.env.BREVO_SENDER_NAME || 'Gxnova';
    }

    async _sendEmail({ toEmail, toName, subject, htmlContent }) {
        this._getCredentials();

        const payload = {
            sender: {
                name: this.senderName,
                email: this.senderEmail
            },
            to: [{ email: toEmail, name: toName || toEmail }],
            subject,
            htmlContent
        };

        const res = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': this.apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Brevo API error ${res.status}: ${errorBody}`);
        }

        return await res.json();
    }

    async enviarCorreoVerificacion(correoDestino, nombreUsuario, codigo) {
        try {
            const result = await this._sendEmail({
                toEmail: correoDestino,
                toName: nombreUsuario,
                subject: `${codigo} es tu código de verificación de Gxnova`,
                htmlContent: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.4);">
                        
                        <!-- Header naranja con gradiente -->
                        <div style="background: linear-gradient(135deg, #c2410c 0%, #ea580c 40%, #f97316 70%, #fb923c 100%); padding: 36px 30px; text-align: center; position: relative;">
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.3);">
                                <span style="font-size: 28px;">🔐</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Gxnova</h1>
                            <p style="color: #ffedd5; margin: 8px 0 0 0; font-size: 14px; font-weight: 500; opacity: 0.9;">Verificación de identidad</p>
                        </div>

                        <!-- Contenido principal oscuro -->
                        <div style="padding: 36px 40px; background: #1e293b;">
                            <h2 style="color: #f1f5f9; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">Hola, ${nombreUsuario} 👋</h2>
                            <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin-bottom: 28px;">
                                Recibimos una solicitud para verificar tu correo electrónico en Gxnova. Usa el siguiente código para completar tu verificación:
                            </p>

                            <!-- Código destacado -->
                            <div style="background: linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.1)); border: 1.5px solid rgba(249,115,22,0.4); border-radius: 16px; padding: 28px; text-align: center; margin: 0 0 28px 0;">
                                <p style="color: #fb923c; font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 12px 0;">Tu código de verificación</p>
                                <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 18px 24px; display: inline-block; border: 1px solid rgba(249,115,22,0.3);">
                                    <span style="font-size: 44px; font-weight: 900; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace;">${codigo}</span>
                                </div>
                                <p style="color: #64748b; font-size: 12px; margin: 14px 0 0 0;">⏱ Este código expira en <strong style="color: #fb923c;">15 minutos</strong></p>
                            </div>

                            <!-- Alerta de seguridad -->
                            <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 14px 18px; margin-bottom: 28px;">
                                <p style="color: #fca5a5; font-size: 13px; line-height: 1.6; margin: 0;">
                                    🛡️ Si <strong>no solicitaste</strong> este código, ignora este correo. Tu cuenta está segura. Nunca compartiremos tu código con nadie.
                                </p>
                            </div>

                            <p style="color: #475569; font-size: 14px; border-top: 1px solid #334155; padding-top: 20px; margin-top: 0; line-height: 1.6;">
                                Saludos,<br>
                                <strong style="color: #94a3b8;">El equipo de seguridad de Gxnova</strong>
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="background-color: #0f172a; padding: 18px; text-align: center; border-top: 1px solid #1e293b;">
                            <p style="color: #334155; font-size: 11px; margin: 0;">
                                © ${new Date().getFullYear()} Gxnova — Conectando talento con oportunidades
                            </p>
                        </div>
                    </div>
                `
            });

            console.log(`[EmailService] Código de verificación enviado a: ${correoDestino} (messageId: ${result.messageId})`);
            return true;
        } catch (error) {
            console.error('[EmailService] Error al enviar correo de verificación:', error.message);
            return false;
        }
    }

    async enviarCorreoBienvenida(correoDestino, nombreUsuario) {
        try {
            const result = await this._sendEmail({
                toEmail: correoDestino,
                toName: nombreUsuario,
                subject: '¡Bienvenido a Gxnova! 🚀 Tu nueva plataforma de trabajo',
                htmlContent: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        
                        <!-- Header / Banner Naranja -->
                        <div style="background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px;">Gxnova</h1>
                            <p style="color: #ffedd5; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Conectando talento con oportunidades</p>
                        </div>

                        <!-- Content -->
                        <div style="padding: 30px 40px; background-color: #ffffff;">
                            <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-top: 0;">¡Hola ${nombreUsuario}! 👋</h2>
                            
                            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                                Nos emociona darte la bienvenida a <strong>Gxnova</strong>. Tu perfil ha sido creado exitosamente y tu identidad verificada.
                            </p>

                            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                                Estás a un solo paso de empezar a explorar las mejores oportunidades o de encontrar al talento ideal para tus proyectos.
                            </p>

                            <!-- Botón CTA -->
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="https://frontend-gxnova-production-cd27.up.railway.app/" style="background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(249,115,22,0.4);">
                                    Ir a mi Dashboard
                                </a>
                            </div>

                            <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                                <h3 style="color: #c2410c; margin: 0 0 5px 0; font-size: 15px;">¿Qué sigue ahora?</h3>
                                <ul style="color: #475569; padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <li>Explora los trabajos disponibles.</li>
                                    <li>Activa el Rol de Empleador si deseas publicar tus requerimientos.</li>
                                    <li>Sube tus habilidades y certificados para destacar.</li>
                                </ul>
                            </div>
                            
                            <p style="color: #64748b; font-size: 15px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
                                <br><br>
                                Saludos,<br>
                                <strong>El equipo de Gxnova</strong>
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} Gxnova. Todos los derechos reservados.
                            </p>
                        </div>
                    </div>
                `
            });

            console.log(`[EmailService] Correo de bienvenida enviado a: ${correoDestino} (messageId: ${result.messageId})`);
            return true;
        } catch (error) {
            console.error('[EmailService] Error al enviar correo de bienvenida:', error.message);
            return false;
        }
    }
}

module.exports = new EmailService();
