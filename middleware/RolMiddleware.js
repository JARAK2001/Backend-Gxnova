function rolMiddleware(...rolesPermitidos) {
    return (req, res, next) => {
        const usuario = req.usuario; 

        if (!usuario || !usuario.rolesAsignados) {
            // Error si authMiddleware falló
            return res.status(401).json({ error: "Token no válido o usuario no autenticado." });
        }

        // Extraer los nombres de los roles del usuario a una lista simple
        const nombresDeRoles = usuario.rolesAsignados.map(
            asignacion => asignacion.rol.nombre
        );

        // Verificar si hay alguna coincidencia entre los roles requeridos y los del usuario
        const tienePermiso = rolesPermitidos.some(rolPermitido => 
            nombresDeRoles.includes(rolPermitido)
        );
        
        if (tienePermiso) {
            next(); 
        } else {
            // 403 Forbidden: No tiene el permiso necesario.
            return res.status(403).json({
                error: "Acceso denegado. No tienes el rol necesario para esta acción."
            });
        }
    };
}

module.exports = { rolMiddleware };