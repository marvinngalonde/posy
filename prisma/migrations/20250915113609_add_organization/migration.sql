-- CreateTable
CREATE TABLE `organization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `postal_code` VARCHAR(20) NULL,
    `tax_number` VARCHAR(100) NULL,
    `website` VARCHAR(255) NULL,
    `logo` VARCHAR(500) NULL,
    `bank_name` VARCHAR(255) NULL,
    `bank_account` VARCHAR(100) NULL,
    `bank_branch` VARCHAR(255) NULL,
    `swift_code` VARCHAR(50) NULL,
    `iban` VARCHAR(100) NULL,
    `currency` VARCHAR(10) NULL DEFAULT 'USD',
    `timezone` VARCHAR(50) NULL DEFAULT 'UTC',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
