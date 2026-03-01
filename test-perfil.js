async function test() {
    // 1. Iniciar sesión como Ana (Trabajadora)
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'ana@worker.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 2. Obtener Perfil
    const perfilRes = await fetch('http://localhost:4000/api/usuarios/perfil', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    console.log("OBTENER PERFIL STATUS:", perfilRes.status);
    const bodyText = await perfilRes.text();
    console.log("OBTENER PERFIL BODY:", bodyText.substring(0, 100) + "...");
}

test();
