require('dotenv').config();
const express = require('express');
const cors = require('cors');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del Servidor HTTP y WebSockets
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado al WebSocket:', socket.id);

    // Unir al usuario a su sala personal mediante su ID
    socket.on('join_personal_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`Usuario ${userId} se unió a su sala personal.`);
    });

    socket.on('join_chat', (chatId) => {
        socket.join(`chat_${chatId}`);
        console.log(`Usuario se unió a la sala de chat: chat_${chatId}`);
    });

    // Escuchar actualizaciones de ubicación del trabajador
    socket.on('update_location', (data) => {
        // data: { id_empleador, latitud_trabajador, longitud_trabajador, latitud_trabajo, longitud_trabajo }
        const { id_empleador, latitud_trabajador, longitud_trabajador, latitud_trabajo, longitud_trabajo } = data;
        
        if (!latitud_trabajador || !longitud_trabajador || !latitud_trabajo || !longitud_trabajo) return;

        // Fórmula de Haversine para calcular distancia
        const R = 6371e3; // Radio de la Tierra en metros
        const phi1 = latitud_trabajador * Math.PI / 180;
        const phi2 = latitud_trabajo * Math.PI / 180;
        const deltaPhi = (latitud_trabajo - latitud_trabajador) * Math.PI / 180;
        const deltaLambda = (longitud_trabajo - longitud_trabajador) * Math.PI / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                  Math.cos(phi1) * Math.cos(phi2) *
                  Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distancia = R * c; // en metros

        if (distancia <= 500) {
            // Emitimos la alarma a la sala personal del empleador
            io.to(`user_${id_empleador}`).emit('worker_arriving', {
                distancia: Math.round(distancia),
                mensaje: "Tu experto está llegando, ten todo listo"
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

// Adjuntar io a la app de express para usarlo en los controladores
app.set('socketio', io);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Rutas
const UsuarioRouter = require('./routes/UsuarioRouter');
const AuthRouter = require('./routes/AuthRouter');
const CategoriaRouter = require('./routes/CategoriaRouter');
const TrabajoRouter = require('./routes/TrabajoRouter');
const PostulacionRouter = require('./routes/PostulacionRouter');
const AcuerdoRouter = require('./routes/AcuerdoRouter');
const CalificacionRouter = require('./routes/CalificacionRouter');
const TransaccionRouter = require('./routes/TransaccionRouter');
const ReporteRouter = require('./routes/ReporteRouter');
const HistorialRouter = require('./routes/HistorialRouter');
const NotificacionRouter = require('./routes/NotificacionRouter');
const HabilidadRouter = require('./routes/HabilidadRouter');
const AdminRouter = require('./routes/AdminRouter');
const MensajeRouter = require('./routes/MensajeRouter');
const StatsRouter = require('./routes/statsRoutes');

app.use('/api/usuarios', UsuarioRouter);
app.use('/api/auth', AuthRouter);
app.use('/api/categorias', CategoriaRouter);
app.use('/api/trabajos', TrabajoRouter);
app.use('/api/postulaciones', PostulacionRouter);
app.use('/api/acuerdos', AcuerdoRouter);
app.use('/api/calificaciones', CalificacionRouter);
app.use('/api/admin', AdminRouter);
app.use('/api/transacciones', TransaccionRouter);
app.use('/api/reportes', ReporteRouter);
app.use('/api/historial', HistorialRouter);
app.use('/api/notificaciones', NotificacionRouter);
app.use('/api/habilidades', HabilidadRouter);
app.use('/api/chat', MensajeRouter);
app.use('/api/stats', StatsRouter);


// Ruta de prueba solo para ver si funcionaba
app.get('/', (req, res) => {
    res.json({ message: 'API GXNova Backend funcionando correctamente' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Error interno del servidor',
            status: err.status || 500
        }
    });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Ruta no encontrada',
            status: 404
        }
    });
});

// Iniciar servidor usando el HTTP Server (no app directamente)
server.listen(PORT, () => {
    console.log(`Servidor con WebSockets corriendo en http://localhost:${PORT}`);
});