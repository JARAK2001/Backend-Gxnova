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