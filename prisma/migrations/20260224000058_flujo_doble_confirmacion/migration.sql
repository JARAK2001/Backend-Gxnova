-- AlterTable
ALTER TABLE `transaccion` ADD COLUMN `confirmado_empleador` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `confirmado_trabajador` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `evidencia_url` VARCHAR(500) NULL,
    MODIFY `estado` ENUM('pendiente', 'pagado_empleador', 'intercambio_empleador', 'intercambio_trabajador', 'completado') NOT NULL DEFAULT 'pendiente';
