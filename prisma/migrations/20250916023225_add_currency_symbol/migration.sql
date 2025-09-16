-- AlterTable
ALTER TABLE `organization` ADD COLUMN `currency_symbol` VARCHAR(5) NULL DEFAULT '$',
    ADD COLUMN `date_format` VARCHAR(20) NULL DEFAULT 'MM/DD/YYYY',
    ADD COLUMN `fax` VARCHAR(50) NULL,
    ADD COLUMN `invoice_footer` TEXT NULL,
    ADD COLUMN `invoice_prefix` VARCHAR(10) NULL DEFAULT 'INV',
    ADD COLUMN `language` VARCHAR(5) NULL DEFAULT 'en',
    ADD COLUMN `payment_terms` TEXT NULL,
    ADD COLUMN `quotation_footer` TEXT NULL,
    ADD COLUMN `quotation_prefix` VARCHAR(10) NULL DEFAULT 'QUO',
    ADD COLUMN `registration_number` VARCHAR(100) NULL,
    ADD COLUMN `terms_conditions` TEXT NULL;

-- CreateTable
CREATE TABLE `invoice_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `invoice_items_invoice_id_fkey`(`invoice_id`),
    INDEX `invoice_items_product_id_fkey`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(100) NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `warehouse_id` INTEGER NOT NULL,
    `sale_id` INTEGER NULL,
    `quotation_id` INTEGER NULL,
    `date` DATE NOT NULL,
    `due_date` DATE NULL,
    `subtotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `shipping` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `paid` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `due` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `status` ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'draft',
    `payment_status` ENUM('unpaid', 'partial', 'paid') NOT NULL DEFAULT 'unpaid',
    `notes` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `invoices_reference_key`(`reference`),
    INDEX `invoices_created_by_fkey`(`created_by`),
    INDEX `invoices_customer_id_fkey`(`customer_id`),
    INDEX `invoices_quotation_id_fkey`(`quotation_id`),
    INDEX `invoices_sale_id_fkey`(`sale_id`),
    INDEX `invoices_warehouse_id_fkey`(`warehouse_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
