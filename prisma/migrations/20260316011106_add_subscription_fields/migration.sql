-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `nivel_suscripcion` ENUM('free', 'premium') NOT NULL DEFAULT 'free',
    ADD COLUMN `suscripcion_fin` DATETIME(3) NULL,
    ADD COLUMN `suscripcion_inicio` DATETIME(3) NULL;
