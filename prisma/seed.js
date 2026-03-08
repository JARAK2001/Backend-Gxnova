const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando el proceso de seeding...");
    const saltRounds = 10;

    // --- 1. Definir Contraseñas ---
    const password = await bcrypt.hash("password123", saltRounds);

    // --- 2. Crear Roles ---
    const [adminRol, empleadorRol, trabajadorRol] = await Promise.all([
        prisma.rol.upsert({ where: { nombre: 'Administrador' }, update: {}, create: { nombre: 'Administrador', descripcion: 'Control total.' } }),
        prisma.rol.upsert({ where: { nombre: 'Empleador' }, update: {}, create: { nombre: 'Empleador', descripcion: 'Puede publicar trabajos.' } }),
        prisma.rol.upsert({ where: { nombre: 'Trabajador' }, update: {}, create: { nombre: 'Trabajador', descripcion: 'Puede postularse.' } }),
    ]);
    console.log("Roles creados/verificados.");

    // --- 3. Crear Categorías ---
    const categoriasData = [
        { nombre: "Plomería", descripcion: "Reparación de tuberías y grifos" },
        { nombre: "Electricidad", descripcion: "Instalaciones y reparaciones eléctricas" },
        { nombre: "Limpieza", descripcion: "Limpieza de hogar y oficinas" },
        { nombre: "Jardinería", descripcion: "Mantenimiento de jardines" },
        { nombre: "Mudanzas", descripcion: "Ayuda con transporte y carga" },
        { nombre: "Pintura", descripcion: "Aplicación de pintura en interiores y exteriores" },
        { nombre: "Carpintería", descripcion: "Fabricación y reparación de muebles de madera" },
        { nombre: "Mecánica", descripcion: "Reparación de vehículos y maquinaria" },
        { nombre: "Albañilería", descripcion: "Construcción y remodelación de estructuras" },
        { nombre: "Clases Particulares", descripcion: "Tutorías en diversas materias" }
    ];

    const categorias = [];
    for (const cat of categoriasData) {
        // Usamos findFirst porque 'nombre' no es @unique en el schema actual (aunque debería serlo conceptualmente)
        // Para el seed, lo buscamos o creamos.
        let categoria = await prisma.categoria.findFirst({ where: { nombre: cat.nombre } });
        if (!categoria) {
            categoria = await prisma.categoria.create({ data: cat });
        }
        categorias.push(categoria);
    }
    console.log(`Categorías creadas: ${categorias.length}`);

    // --- 4. Crear Usuarios ---
    const usuariosData = [
        {
            nombre: "Admin",
            apellido: "System",
            correo: "admin@gxnova.com",
            rolId: adminRol.id_rol,
            telefono: "555-0000",
            verificado: true // Admin pre-verificado
        },
        {
            nombre: "Carlos",
            apellido: "Empleador",
            correo: "carlos@cliente.com",
            rolId: empleadorRol.id_rol,
            telefono: "555-0001",
            verificado: true // Empleador pre-verificado para pruebas
        },
        {
            nombre: "Ana",
            apellido: "Trabajadora",
            correo: "ana@worker.com",
            rolId: trabajadorRol.id_rol,
            telefono: "555-0002",
            verificado: true // Trabajadora pre-verificada para pruebas
        },
        {
            nombre: "Luis",
            apellido: "Trabajador",
            correo: "luis@worker.com",
            rolId: trabajadorRol.id_rol,
            telefono: "555-0003",
            verificado: true // Trabajador pre-verificado para pruebas
        },
        {
            nombre: "María",
            apellido: "González",
            correo: "maria@empleador.com",
            rolId: empleadorRol.id_rol,
            telefono: "555-0004",
            verificado: true // Empleadora adicional para pruebas
        },
        {
            nombre: "Juan",
            apellido: "Pérez",
            correo: "juan@worker.com",
            rolId: trabajadorRol.id_rol,
            telefono: "555-0005",
            verificado: true
        },
        {
            nombre: "Pedro",
            apellido: "Martínez",
            correo: "pedro@empleador.com",
            rolId: empleadorRol.id_rol,
            telefono: "555-0006",
            verificado: true
        },
        {
            nombre: "Sofia",
            apellido: "López",
            correo: "sofia@worker.com",
            rolId: trabajadorRol.id_rol,
            telefono: "555-0007",
            verificado: true
        },
        {
            nombre: "Laura",
            apellido: "García",
            correo: "laura@empleador.com",
            rolId: empleadorRol.id_rol,
            telefono: "555-0008",
            verificado: true
        },
        {
            nombre: "Diego",
            apellido: "Rodríguez",
            correo: "diego@worker.com",
            rolId: trabajadorRol.id_rol,
            telefono: "555-0009",
            verificado: true
        }
    ];

    const usuariosMap = {}; // Para acceder fácilmente después

    for (const u of usuariosData) {
        const usuario = await prisma.usuario.upsert({
            where: { correo: u.correo },
            update: {},
            create: {
                nombre: u.nombre,
                apellido: u.apellido,
                correo: u.correo,
                password_hash: password,
                telefono: u.telefono,
                estado: 'activo',
                verificado: u.verificado,
                fecha_verificacion: u.verificado ? new Date() : null,
                terminos_aceptados: true,
                fecha_aceptacion_terminos: new Date(),
                // No incluimos foto_cedula ni foto_rostro para usuarios de seed
                // Estos son usuarios de prueba pre-verificados
            }
        });

        // Asignar Rol
        try {
            await prisma.usuarioEnRol.create({
                data: { id_usuario: usuario.id_usuario, id_rol: u.rolId }
            });
        } catch (e) { /* Ignorar si ya existe */ }

        usuariosMap[u.correo] = usuario;
    }
    console.log("Usuarios creados (todos pre-verificados para pruebas).");

    // --- 5. Asignar Habilidades (Skills) ---
    const ana = usuariosMap["ana@worker.com"];
    const luis = usuariosMap["luis@worker.com"];
    const juan = usuariosMap["juan@worker.com"];
    const sofia = usuariosMap["sofia@worker.com"];
    const diego = usuariosMap["diego@worker.com"];

    if (ana) {
        await prisma.habilidad.createMany({
            data: [
                { id_usuario: ana.id_usuario, id_categoria: categorias[0].id_categoria, descripcion: "Experta en fugas", tarifa_hora: 45.00 }, // Plomería
                { id_usuario: ana.id_usuario, id_categoria: categorias[1].id_categoria, descripcion: "Instalaciones básicas", tarifa_hora: 50.00 } // Electricidad
            ],
            skipDuplicates: true
        });
    }

    if (luis) {
        await prisma.habilidad.createMany({
            data: [
                { id_usuario: luis.id_usuario, id_categoria: categorias[3].id_categoria, descripcion: "Poda y mantenimiento", tarifa_hora: 30.00 } // Jardinería
            ],
            skipDuplicates: true
        });
    }

    if (juan) {
        await prisma.habilidad.createMany({
            data: [
                { id_usuario: juan.id_usuario, id_categoria: categorias[6].id_categoria, descripcion: "Muebles a medida", tarifa_hora: 40.00 }, // Carpintería
                { id_usuario: juan.id_usuario, id_categoria: categorias[8].id_categoria, descripcion: "Construcción en general", tarifa_hora: 55.00 } // Albañilería
            ],
            skipDuplicates: true
        });
    }

    if (sofia) {
        await prisma.habilidad.createMany({
            data: [
                { id_usuario: sofia.id_usuario, id_categoria: categorias[9].id_categoria, descripcion: "Matemáticas y Física", tarifa_hora: 25.00 }, // Clases Particulares
                { id_usuario: sofia.id_usuario, id_categoria: categorias[5].id_categoria, descripcion: "Pintura de interiores", tarifa_hora: 35.00 } // Pintura
            ],
            skipDuplicates: true
        });
    }

    if (diego) {
        await prisma.habilidad.createMany({
            data: [
                { id_usuario: diego.id_usuario, id_categoria: categorias[7].id_categoria, descripcion: "Mecánica automotriz rápida", tarifa_hora: 60.00 } // Mecánica
            ],
            skipDuplicates: true
        });
    }
    console.log("Habilidades asignadas.");

    // --- 6. Crear Trabajos ---
    const carlos = usuariosMap["carlos@cliente.com"];
    const maria = usuariosMap["maria@empleador.com"];
    const pedro = usuariosMap["pedro@empleador.com"];
    const laura = usuariosMap["laura@empleador.com"];

    if (carlos) {
        await prisma.trabajo.createMany({
            data: [
                {
                    id_empleador: carlos.id_usuario,
                    id_categoria: categorias[0].id_categoria, // Plomería
                    titulo: "Reparar grifo cocina",
                    descripcion: "El grifo gotea constantemente.",
                    tipo_pago: "dinero",
                    monto_pago: 60.00,
                    ubicacion: "Centro, Calle 10",
                    latitud: 4.60,
                    longitud: -74.08,
                    estado: "publicado"
                },
                {
                    id_empleador: carlos.id_usuario,
                    id_categoria: categorias[3].id_categoria, // Jardinería
                    titulo: "Cortar pasto patio trasero",
                    descripcion: "Necesito alguien con cortadora de pasto.",
                    tipo_pago: "dinero",
                    monto_pago: 40.00,
                    ubicacion: "Norte, Av 19",
                    latitud: 4.70,
                    longitud: -74.05,
                    estado: "publicado"
                },
                {
                    id_empleador: carlos.id_usuario,
                    id_categoria: categorias[6].id_categoria, // Carpintería
                    titulo: "Hacer un escritorio a medida",
                    descripcion: "Necesito un escritorio de madera de 120x60cm.",
                    tipo_pago: "dinero",
                    monto_pago: 150.00,
                    ubicacion: "Occidente, Calle 80",
                    latitud: 4.69,
                    longitud: -74.12,
                    estado: "publicado"
                }
            ],
            skipDuplicates: true // Nota: createMany no soporta skipDuplicates en todas las DBs, pero en MySQL sí para inserts simples sin relaciones anidadas
        });
    }

    if (maria) {
        await prisma.trabajo.createMany({
            data: [
                {
                    id_empleador: maria.id_usuario,
                    id_categoria: categorias[7].id_categoria, // Mecánica
                    titulo: "Arreglar motor de carro",
                    descripcion: "Mi coche no arranca, parece problema del motor o batería.",
                    tipo_pago: "dinero",
                    monto_pago: 120.00,
                    ubicacion: "Sur, Av Boyaca",
                    latitud: 4.58,
                    longitud: -74.15,
                    estado: "publicado"
                }
            ],
            skipDuplicates: true
        });
    }

    if (pedro) {
        await prisma.trabajo.createMany({
            data: [
                {
                    id_empleador: pedro.id_usuario,
                    id_categoria: categorias[5].id_categoria, // Pintura
                    titulo: "Pintar sala y comedor",
                    descripcion: "Busco pintor para sala y comedor, pintura blanca mate.",
                    tipo_pago: "dinero",
                    monto_pago: 200.00,
                    ubicacion: "Centro, Carrera 7",
                    latitud: 4.62,
                    longitud: -74.06,
                    estado: "publicado"
                }
            ],
            skipDuplicates: true
        });
    }

    if (laura) {
        await prisma.trabajo.createMany({
            data: [
                {
                    id_empleador: laura.id_usuario,
                    id_categoria: categorias[9].id_categoria, // Clases Particulares
                    titulo: "Profesor de matemáticas urgentes",
                    descripcion: "Necesito tutoría de álgebra para mi hijo de secundaria.",
                    tipo_pago: "dinero",
                    monto_pago: 30.00,
                    ubicacion: "Norte, Calle 116",
                    latitud: 4.70,
                    longitud: -74.03,
                    estado: "publicado"
                }
            ],
            skipDuplicates: true
        });
    }
    console.log("Trabajos creados.");

    console.log("Seeding completado con éxito.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });