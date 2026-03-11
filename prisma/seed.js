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
                correo_verificado: true,  // Todos los usuarios seed están pre-verificados
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
                    titulo: "Reparar tubería en la cocina",
                    descripcion: "Se reventó el tubo principal debajo del lavaplatos.",
                    tipo_pago: "dinero",
                    monto_pago: 80000.00,
                    ubicacion: "Barrio La Esmeralda, Popayán",
                    latitud: 2.450,
                    longitud: -76.595,
                    estado: "publicado"
                },
                {
                    id_empleador: carlos.id_usuario,
                    id_categoria: categorias[3].id_categoria, // Jardinería
                    titulo: "Poda de jardín exterior",
                    descripcion: "Necesito cortar el pasto y podar dos arbustos pequeños.",
                    tipo_pago: "dinero",
                    monto_pago: 50000.00,
                    ubicacion: "Campanario, Popayán",
                    latitud: 2.460,
                    longitud: -76.585,
                    estado: "publicado"
                },
                {
                    id_empleador: carlos.id_usuario,
                    id_categoria: categorias[6].id_categoria, // Carpintería
                    titulo: "Instalación de repisas",
                    descripcion: "Necesito instalar 3 repisas de madera en la sala.",
                    tipo_pago: "dinero",
                    monto_pago: 60000.00,
                    ubicacion: "Barrio Bolívar, Popayán",
                    latitud: 2.445,
                    longitud: -76.600,
                    estado: "publicado"
                },
                {
                    id_empleador: carlos.id_usuario,
                    id_categoria: categorias[1].id_categoria, // Electricidad
                    titulo: "Cambio de cableado eléctrico viejo",
                    descripcion: "El pasillo tiene un corto circuito, hay que revisar el cableado.",
                    tipo_pago: "dinero",
                    monto_pago: 120000.00,
                    ubicacion: "Centro Histórico, Popayán",
                    latitud: 2.441,
                    longitud: -76.606,
                    estado: "publicado"
                }
            ],
            skipDuplicates: true
        });
    }

    if (maria) {
        await prisma.trabajo.createMany({
            data: [
                {
                    id_empleador: maria.id_usuario,
                    id_categoria: categorias[7].id_categoria, // Mecánica
                    titulo: "Cambio de aceite y frenos a moto",
                    descripcion: "Necesito cambio de aceite y pastillas de freno para una Yamaha FZ.",
                    tipo_pago: "dinero",
                    monto_pago: 45000.00,
                    ubicacion: "Tulcán, Popayán",
                    latitud: 2.445,
                    longitud: -76.590,
                    estado: "publicado"
                },
                {
                    id_empleador: maria.id_usuario,
                    id_categoria: categorias[2].id_categoria, // Limpieza
                    titulo: "Limpieza profunda de apartamento",
                    descripcion: "Aseo general de un apartamento de 2 habitaciones.",
                    tipo_pago: "dinero",
                    monto_pago: 70000.00,
                    ubicacion: "Barrio Pomona, Popayán",
                    latitud: 2.435,
                    longitud: -76.598,
                    estado: "publicado"
                },
                {
                    id_empleador: maria.id_usuario,
                    id_categoria: categorias[8].id_categoria, // Albañilería
                    titulo: "Resanar pared húmeda",
                    descripcion: "Hay humedad en un cuarto y necesito que raspen, estuquen y pinten.",
                    tipo_pago: "dinero",
                    monto_pago: 150000.00,
                    ubicacion: "Sector Catay, Popayán",
                    latitud: 2.455,
                    longitud: -76.580,
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
                    titulo: "Pintar fachada de casa de 1 piso",
                    descripcion: "Pintura blanca para la fachada exterior.",
                    tipo_pago: "dinero",
                    monto_pago: 200000.00,
                    ubicacion: "Barrio Cadillal, Popayán",
                    latitud: 2.448,
                    longitud: -76.610,
                    estado: "publicado"
                },
                {
                    id_empleador: pedro.id_usuario,
                    id_categoria: categorias[4].id_categoria, // Mudanzas
                    titulo: "Trasteo pequeño de muebles",
                    descripcion: "Mover una cama, una nevera y dos escritorios al barrio vecino.",
                    tipo_pago: "dinero",
                    monto_pago: 90000.00,
                    ubicacion: "Barrio Modelo, Popayán",
                    latitud: 2.452,
                    longitud: -76.602,
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
                    titulo: "Refuerzo escolar en matemáticas grado 9",
                    descripcion: "Dos horas de clase para mi hijo que tiene examen de álgebra.",
                    tipo_pago: "dinero",
                    monto_pago: 60000.00,
                    ubicacion: "La Venta, Popayán",
                    latitud: 2.430,
                    longitud: -76.610,
                    estado: "publicado"
                },
                {
                    id_empleador: laura.id_usuario,
                    id_categoria: categorias[0].id_categoria, // Plomería
                    titulo: "Instalar lavadora nueva",
                    descripcion: "Conectar las mangueras de agua y desagüe de la lavadora.",
                    tipo_pago: "dinero",
                    monto_pago: 40000.00,
                    ubicacion: "Barrio Santa Inés, Popayán",
                    latitud: 2.458,
                    longitud: -76.592,
                    estado: "publicado"
                },
                {
                    id_empleador: laura.id_usuario,
                    id_categoria: categorias[2].id_categoria, // Limpieza
                    titulo: "Limpieza después de fiesta (domingo)",
                    descripcion: "Aseo en el salón social de mi conjunto residencial.",
                    tipo_pago: "dinero",
                    monto_pago: 80000.00,
                    ubicacion: "Sector Los Hoyos, Popayán",
                    latitud: 2.443,
                    longitud: -76.589,
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