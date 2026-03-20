// Test production API - get trabajadores to see tarifa_hora format
async function test() {
    try {
        const res = await fetch('https://backend-gxnova-production-2a16.up.railway.app/api/usuarios/trabajadores');
        const data = await res.json();
        console.log('Status:', res.status);
        if (data.trabajadores && data.trabajadores.length > 0) {
            const w = data.trabajadores[0];
            console.log('First worker:', w.nombre, w.apellido);
            console.log('Skills count:', w.habilidades ? w.habilidades.length : 'none');
            console.log('Skills:', JSON.stringify(w.habilidades, null, 2));
        } else {
            console.log('Response:', JSON.stringify(data).substring(0, 500));
        }
    } catch(e) {
        console.error('Error:', e.message);
    }
}
test();
