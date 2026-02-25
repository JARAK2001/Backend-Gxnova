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
        { nombre: "Mudanzas", descripcion: "Ayuda con transporte y carga" }
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
    // Ana sabe Plomería y Electricidad
    const ana = usuariosMap["ana@worker.com"];
    const luis = usuariosMap["luis@worker.com"];

    if (ana) {
        await prisma.habilidad.createMany({
            data: [
                { id_usuario: ana.id_usuario, id_categoria: categorias[0].id_categoria, descripcion: "Experta en fugas", tarifa_hora: 45.00 }, // Plomería
                { id_usuario: ana.id_usuario, id_categoria: categorias[1].id_categoria, descripcion: "Instalaciones básicas", tarifa_hora: 50.00 } // Electricidad
            ],
            skipDuplicates: true
        });
    }

    // Luis sabe Jardinería
    if (luis) {
        await prisma.habilidad.createMany({
            data: [
                { id_usuario: luis.id_usuario, id_categoria: categorias[3].id_categoria, descripcion: "Poda y mantenimiento", tarifa_hora: 30.00 }
            ],
            skipDuplicates: true
        });
    }
    console.log("Habilidades asignadas.");

    // --- 6. Crear Trabajos ---
    const carlos = usuariosMap["carlos@cliente.com"];

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
                }
            ],
            skipDuplicates: true // Nota: createMany no soporta skipDuplicates en todas las DBs, pero en MySQL sí para inserts simples sin relaciones anidadas
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