async function test() {
    // 1. Iniciar sesión como Ana (Trabajadora)
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'ana@worker.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log("LOGIN STATUS:", loginRes.status);
    if (!loginRes.ok) {
        console.log("LOGIN ERROR:", loginData);
        return;
    }
    const token = loginData.token;

    // 2. Intentar agregar rol Empleador
    console.log("Haciendo petición POST a /api/usuarios/agregar-rol con token:", token.substring(0, 15) + "...");
    const addRoleRes = await fetch('http://localhost:4000/api/usuarios/agregar-rol', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rol: 'Empleador' })
    });

    console.log("AGREGAR ROL STATUS:", addRoleRes.status);
    const bodyText = await addRoleRes.text();
    console.log("AGREGAR ROL BODY:", bodyText);
}

test();
