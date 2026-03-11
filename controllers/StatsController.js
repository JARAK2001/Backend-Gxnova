const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener coordenadas de los trabajos para el Heatmap (Zonas de Alta Demanda)
const getHeatmapData = async (req, res) => {
    try {
        // Obtenemos los trabajos que tienen latitud y longitud
        const trabajos = await prisma.trabajo.findMany({
            where: {
                latitud: { not: null },
                longitud: { not: null },
                estado: { in: ['publicado', 'en_proceso'] } // Mostramos los que están activos o recién tomados
            },
            select: {
                latitud: true,
                longitud: true,
                categoria: { select: { nombre: true } }
            }
        });

        res.json({ success: true, trabajos });
    } catch (error) {
        console.error('Error al obtener datos del heatmap:', error);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
};

// Obtener ganancias del trabajador agrupadas por ubicación/barrio (Recharts)
const getWorkerEarnings = async (req, res) => {
    try {
        const id_trabajador = req.usuario.id_usuario;

        // Obtenemos los acuerdos completados de este trabajador donde el pago es dinero
        const acuerdos = await prisma.acuerdo.findMany({
            where: {
                id_trabajador,
                tipo_pago: 'dinero',
                transaccion: {
                    estado: 'completado'
                }
            },
            include: {
                trabajo: {
                    select: {
                        ubicacion: true
                    }
                }
            }
        });

        // Agrupamos por barrio (ubicacion)
        const gananciasPorBarrio = {};

        acuerdos.forEach(acuerdo => {
            const barrio = acuerdo.trabajo.ubicacion || 'Desconocido';
            const monto = parseFloat(acuerdo.valor_acordado) || 0;

            if (gananciasPorBarrio[barrio]) {
                gananciasPorBarrio[barrio] += monto;
            } else {
                gananciasPorBarrio[barrio] = monto;
            }
        });

        // Convertimos a array para Recharts
        const data = Object.keys(gananciasPorBarrio).map(barrio => ({
            name: barrio,
            ingresos: gananciasPorBarrio[barrio]
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error al obtener ganancias del trabajador:', error);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
};

module.exports = {
    getHeatmapData,
    getWorkerEarnings
};
