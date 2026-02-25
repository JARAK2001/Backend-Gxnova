require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT

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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});