const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todas las conversaciones de un usuario (sea trabajador o empleador)
exports.obtenerConversacionesUsuario = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        console.log('Obteniendo conversaciones para usuario ID:', id_usuario);

        const conversaciones = await prisma.conversacion.findMany({
            where: {
                OR: [
                    { id_trabajador: id_usuario },
                    { id_empleador: id_usuario }
                ]
            },
            include: {
                trabajador: {
                    select: { id_usuario: true, nombre: true, apellido: true, foto_perfil: true }
                },
                empleador: {
                    select: { id_usuario: true, nombre: true, apellido: true, foto_perfil: true }
                },
                trabajo: {
                    select: { id_trabajo: true, titulo: true }
                },
                mensajes: {
                    orderBy: { enviado_en: 'desc' },
                    take: 1 // Solo traer el último mensaje para la lista
                }
            },
            orderBy: {
                actualizado_en: 'desc'
            }
        });

        res.status(200).json(conversaciones);
    } catch (error) {
        console.error('Error al obtener conversaciones:', error);
        if (error.stack) console.error(error.stack);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};

// Obtener historial de mensajes de una conversación específica
exports.obtenerMensajesDeConversacion = async (req, res) => {
    try {
        const id_conversacion = parseInt(req.params.id);
        const id_usuario = req.usuario.id_usuario;

        // Verificar que la conversación exista y el usuario sea parte de ella
        const conversacion = await prisma.conversacion.findUnique({
            where: { id_conversacion }
        });

        if (!conversacion || (conversacion.id_trabajador !== id_usuario && conversacion.id_empleador !== id_usuario)) {
            return res.status(403).json({ error: 'No tienes acceso a este chat' });
        }

        const mensajes = await prisma.mensaje.findMany({
            where: { id_conversacion },
            orderBy: { enviado_en: 'asc' }
        });

        res.status(200).json(mensajes);
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear un nuevo mensaje en una conversación existente o nueva
exports.enviarMensaje = async (req, res) => {
    try {
        // En una implementación real más robusta, este controlador recibiría el id_conversacion 
        // o los id_trabajador/id_empleador si es el primer mensaje.

        const { id_conversacion, id_receptor, id_trabajo, contenido } = req.body;
        const id_emisor = req.usuario.id_usuario;

        let convId = id_conversacion;

        // Si no hay id_conversacion, buscamos o creamos una basada en los participantes y el trabajo
        if (!convId && id_receptor) {
            // Buscamos si ya existe una conversación para este trabajo entre estos dos usuarios
            let conversacionRef = await prisma.conversacion.findFirst({
                where: {
                    AND: [
                        { id_trabajo: id_trabajo ? Number(id_trabajo) : null },
                        {
                            OR: [
                                { id_trabajador: id_emisor, id_empleador: id_receptor },
                                { id_trabajador: id_receptor, id_empleador: id_emisor }
                            ]
                        }
                    ]
                }
            });

            if (!conversacionRef) {
                // Si no existe, la creamos identificando roles
                let id_trabajador_final = id_emisor;
                let id_empleador_final = id_receptor;

                if (id_trabajo) {
                    const trabajo = await prisma.trabajo.findUnique({
                        where: { id_trabajo: Number(id_trabajo) }
                    });

                    if (trabajo) {
                        if (id_emisor === trabajo.id_empleador) {
                            id_empleador_final = id_emisor;
                            id_trabajador_final = id_receptor;
                        } else {
                            id_empleador_final = trabajo.id_empleador;
                            id_trabajador_final = id_emisor;
                        }
                    }
                }

                conversacionRef = await prisma.conversacion.create({
                    data: {
                        id_trabajador: id_trabajador_final,
                        id_empleador: id_empleador_final,
                        id_trabajo: id_trabajo ? Number(id_trabajo) : null
                    }
                });
            }
            convId = conversacionRef.id_conversacion;
        }

        if (!convId) {
            return res.status(400).json({ error: 'Faltan datos para la conversación' });
        }

        // Crear el mensaje
        const nuevoMensaje = await prisma.mensaje.create({
            data: {
                id_conversacion: Number(convId),
                id_emisor,
                contenido
            }
        });

        // Actualizar la fecha de la conversacion (para que suba en el panel izquierdo)
        await prisma.conversacion.update({
            where: { id_conversacion: Number(convId) },
            data: { actualizado_en: new Date() }
        });

        // 🚀 EMITIR EVENTO POR SOCKET.IO SI TODO SALIÓ BIEN A LA BD
        const io = req.app.get('socketio');
        if (io) {
            // Emite al "room" de la conversacion (ambos deberian estar unidos si tienen el chat abierto)
            io.to(`chat_${convId}`).emit('receive_message', nuevoMensaje);

            // También podemos emitir a la sala personal del receptor para mostrarle notificación flotante
            // en caso de que esté navegando en otra pantalla.
            if (id_receptor) {
                io.to(`user_${id_receptor}`).emit('new_chat_notification', {
                    chatId: convId,
                    mensaje: nuevoMensaje
                });
            }
        }

        res.status(201).json(nuevoMensaje);
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
