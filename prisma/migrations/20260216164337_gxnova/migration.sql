-- CreateTable
CREATE TABLE `Usuario` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `correo` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `foto_perfil` VARCHAR(255) NULL,
    `fecha_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` ENUM('activo', 'suspendido') NOT NULL DEFAULT 'activo',
    `foto_cedula` VARCHAR(255) NULL,
    `foto_rostro` VARCHAR(255) NULL,
    `verificado` BOOLEAN NOT NULL DEFAULT false,
    `fecha_verificacion` DATETIME(3) NULL,

    UNIQUE INDEX `Usuario_correo_key`(`correo`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rol` (
    `id_rol` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NULL,

    UNIQUE INDEX `Rol_nombre_key`(`nombre`),
    PRIMARY KEY (`id_rol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UsuarioEnRol` (
    `id_usuario_en_rol` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `id_rol` INTEGER NOT NULL,
    `fecha_asignacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UsuarioEnRol_id_usuario_id_rol_key`(`id_usuario`, `id_rol`),
    PRIMARY KEY (`id_usuario_en_rol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categoria` (
    `id_categoria` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,

    PRIMARY KEY (`id_categoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Habilidad` (
    `id_habilidad` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `id_categoria` INTEGER NOT NULL,
    `descripcion` TEXT NULL,
    `tarifa_hora` DECIMAL(65, 30) NULL,

    UNIQUE INDEX `Habilidad_id_usuario_id_categoria_key`(`id_usuario`, `id_categoria`),
    PRIMARY KEY (`id_habilidad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Trabajo` (
    `id_trabajo` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empleador` INTEGER NOT NULL,
    `id_categoria` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `tipo_pago` ENUM('dinero', 'trueque') NOT NULL,
    `monto_pago` DECIMAL(65, 30) NULL,
    `descripcion_trueque` VARCHAR(255) NULL,
    `ubicacion` VARCHAR(150) NOT NULL,
    `latitud` DOUBLE NULL,
    `longitud` DOUBLE NULL,
    `fecha_estimada` DATETIME(3) NULL,
    `foto` VARCHAR(255) NULL,
    `estado` ENUM('publicado', 'en_proceso', 'completado', 'cancelado') NOT NULL DEFAULT 'publicado',
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_trabajo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Postulacion` (
    `id_postulacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_trabajo` INTEGER NOT NULL,
    `id_trabajador` INTEGER NOT NULL,
    `id_acuerdo` INTEGER NULL,
    `mensaje` TEXT NULL,
    `estado` ENUM('pendiente', 'aceptada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    `fecha_postulacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Postulacion_id_acuerdo_key`(`id_acuerdo`),
    PRIMARY KEY (`id_postulacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Acuerdo` (
    `id_acuerdo` INTEGER NOT NULL AUTO_INCREMENT,
    `id_trabajo` INTEGER NOT NULL,
    `id_trabajador` INTEGER NOT NULL,
    `tipo_pago` ENUM('dinero', 'trueque') NOT NULL,
    `valor_acordado` DECIMAL(65, 30) NULL,
    `detalle_trueque` TEXT NULL,
    `detalles` TEXT NULL,
    `tiempo_estimado` VARCHAR(50) NULL,
    `condiciones` TEXT NULL,
    `aceptado_empleador` BOOLEAN NOT NULL DEFAULT false,
    `aceptado_trabajador` BOOLEAN NOT NULL DEFAULT false,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_acuerdo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Calificacion` (
    `id_calificacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_trabajo` INTEGER NOT NULL,
    `id_usuario_emisor` INTEGER NOT NULL,
    `id_usuario_receptor` INTEGER NOT NULL,
    `puntuacion` SMALLINT UNSIGNED NOT NULL,
    `comentario` TEXT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_calificacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaccion` (
    `id_transaccion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_acuerdo` INTEGER NOT NULL,
    `tipo_pago` ENUM('dinero', 'trueque') NOT NULL,
    `detalle` VARCHAR(255) NULL,
    `estado` ENUM('pendiente', 'completado') NOT NULL DEFAULT 'pendiente',
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Transaccion_id_acuerdo_key`(`id_acuerdo`),
    PRIMARY KEY (`id_transaccion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reporte` (
    `id_reporte` INTEGER NOT NULL AUTO_INCREMENT,
    `id_reportante` INTEGER NOT NULL,
    `id_reportado` INTEGER NOT NULL,
    `id_trabajo` INTEGER NULL,
    `tipo` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,
    `evidencia` VARCHAR(255) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` ENUM('pendiente', 'resuelto') NOT NULL DEFAULT 'pendiente',

    PRIMARY KEY (`id_reporte`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Historial` (
    `id_historial` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `id_trabajo` INTEGER NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_historial`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notificacion` (
    `id_notificacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `tipo` VARCHAR(100) NOT NULL,
    `mensaje` TEXT NULL,
    `enlace` VARCHAR(255) NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_notificacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UsuarioEnRol` ADD CONSTRAINT `UsuarioEnRol_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioEnRol` ADD CONSTRAINT `UsuarioEnRol_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `Rol`(`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Habilidad` ADD CONSTRAINT `Habilidad_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Habilidad` ADD CONSTRAINT `Habilidad_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `Categoria`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trabajo` ADD CONSTRAINT `Trabajo_id_empleador_fkey` FOREIGN KEY (`id_empleador`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trabajo` ADD CONSTRAINT `Trabajo_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `Categoria`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Postulacion` ADD CONSTRAINT `Postulacion_id_trabajo_fkey` FOREIGN KEY (`id_trabajo`) REFERENCES `Trabajo`(`id_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Postulacion` ADD CONSTRAINT `Postulacion_id_trabajador_fkey` FOREIGN KEY (`id_trabajador`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Postulacion` ADD CONSTRAINT `Postulacion_id_acuerdo_fkey` FOREIGN KEY (`id_acuerdo`) REFERENCES `Acuerdo`(`id_acuerdo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Acuerdo` ADD CONSTRAINT `Acuerdo_id_trabajo_fkey` FOREIGN KEY (`id_trabajo`) REFERENCES `Trabajo`(`id_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Acuerdo` ADD CONSTRAINT `Acuerdo_id_trabajador_fkey` FOREIGN KEY (`id_trabajador`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calificacion` ADD CONSTRAINT `Calificacion_id_trabajo_fkey` FOREIGN KEY (`id_trabajo`) REFERENCES `Trabajo`(`id_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calificacion` ADD CONSTRAINT `Calificacion_id_usuario_emisor_fkey` FOREIGN KEY (`id_usuario_emisor`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Calificacion` ADD CONSTRAINT `Calificacion_id_usuario_receptor_fkey` FOREIGN KEY (`id_usuario_receptor`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaccion` ADD CONSTRAINT `Transaccion_id_acuerdo_fkey` FOREIGN KEY (`id_acuerdo`) REFERENCES `Acuerdo`(`id_acuerdo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reporte` ADD CONSTRAINT `Reporte_id_trabajo_fkey` FOREIGN KEY (`id_trabajo`) REFERENCES `Trabajo`(`id_trabajo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reporte` ADD CONSTRAINT `Reporte_id_reportante_fkey` FOREIGN KEY (`id_reportante`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reporte` ADD CONSTRAINT `Reporte_id_reportado_fkey` FOREIGN KEY (`id_reportado`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Historial` ADD CONSTRAINT `Historial_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Historial` ADD CONSTRAINT `Historial_id_trabajo_fkey` FOREIGN KEY (`id_trabajo`) REFERENCES `Trabajo`(`id_trabajo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacion` ADD CONSTRAINT `Notificacion_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
