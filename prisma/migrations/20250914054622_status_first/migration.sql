-- CreateTable
CREATE TABLE `adjustments` (
    `id` VARCHAR(36) NOT NULL,
    `reference` VARCHAR(100) NOT NULL,
    `warehouse_id` VARCHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `type` ENUM('addition', 'subtraction') NOT NULL,
    `notes` TEXT NULL,
    `created_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `adjustments_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `adjustment_items` (
    `id` VARCHAR(36) NOT NULL,
    `adjustment_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `type` ENUM('addition', 'subtraction') NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `pre_stock` VARCHAR(50) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(36) NOT NULL,
    `employee_id` VARCHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `time_in` TIME NULL,
    `time_out` TIME NULL,
    `break_time` INTEGER NULL DEFAULT 0,
    `total_hours` DECIMAL(4, 2) NULL DEFAULT 0.00,
    `status` ENUM('present', 'absent', 'late', 'half_day') NOT NULL DEFAULT 'present',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brands` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `tax_number` VARCHAR(100) NULL,
    `logo` VARCHAR(500) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currencies` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `symbol` VARCHAR(10) NOT NULL,
    `exchange_rate` DECIMAL(10, 4) NULL DEFAULT 1.0000,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `currencies_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `tax_number` VARCHAR(100) NULL,
    `credit_limit` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total_sales` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total_paid` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total_due` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(36) NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(36) NOT NULL,
    `employee_id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `department_id` VARCHAR(36) NULL,
    `shift_id` VARCHAR(36) NULL,
    `position` VARCHAR(255) NULL,
    `salary` DECIMAL(10, 2) NULL,
    `hire_date` DATE NULL,
    `address` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `employees_employee_id_key`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `office_shifts` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holidays` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_types` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `days_allowed` INTEGER NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_requests` (
    `id` VARCHAR(36) NOT NULL,
    `employee_id` VARCHAR(36) NOT NULL,
    `leave_type_id` VARCHAR(36) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `days` INTEGER NOT NULL,
    `reason` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `approved_by` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_categories` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(36) NOT NULL,
    `reference` VARCHAR(100) NOT NULL,
    `category_id` VARCHAR(36) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `date` DATE NOT NULL,
    `description` TEXT NULL,
    `attachment` VARCHAR(500) NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `created_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `expenses_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `barcode` VARCHAR(255) NULL,
    `category_id` VARCHAR(36) NULL,
    `brand_id` VARCHAR(36) NULL,
    `unit_id` VARCHAR(36) NULL,
    `warehouse_id` VARCHAR(36) NULL,
    `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `stock` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `alert_quantity` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `products_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchases` (
    `id` VARCHAR(36) NOT NULL,
    `reference` VARCHAR(100) NOT NULL,
    `supplier_id` VARCHAR(36) NULL,
    `warehouse_id` VARCHAR(36) NULL,
    `date` DATE NOT NULL,
    `subtotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `shipping` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `paid` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `due` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `status` ENUM('pending', 'received', 'cancelled') NOT NULL DEFAULT 'pending',
    `payment_status` ENUM('unpaid', 'partial', 'paid') NOT NULL DEFAULT 'unpaid',
    `notes` TEXT NULL,
    `created_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `purchases_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_items` (
    `id` VARCHAR(36) NOT NULL,
    `purchase_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit_cost` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_returns` (
    `id` VARCHAR(36) NOT NULL,
    `reference` VARCHAR(100) NOT NULL,
    `purchase_id` VARCHAR(36) NOT NULL,
    `supplier_id` VARCHAR(36) NOT NULL,
    `warehouse_id` VARCHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `subtotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `shipping` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'completed',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `purchase_returns_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_return_items` (
    `id` VARCHAR(36) NOT NULL,
    `return_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `purchase_item_id` VARCHAR(36) NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit_cost` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(100) NOT NULL,
    `customer_id` VARCHAR(36) NULL,
    `warehouse_id` VARCHAR(36) NULL,
    `date` DATE NOT NULL,
    `valid_until` DATE NULL,
    `subtotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `shipping` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'sent', 'accepted', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `created_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `quotations_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_items` (
    `id` VARCHAR(36) NOT NULL,
    `quotation_id` INTEGER NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `id` VARCHAR(36) NOT NULL,
    `reference` VARCHAR(100) NOT NULL,
    `customer_id` VARCHAR(36) NULL,
    `warehouse_id` VARCHAR(36) NULL,
    `date` DATE NOT NULL,
    `subtotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `shipping` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `paid` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `due` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `payment_status` ENUM('unpaid', 'partial', 'paid') NOT NULL DEFAULT 'unpaid',
    `notes` TEXT NULL,
    `created_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `sales_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_items` (
    `id` VARCHAR(36) NOT NULL,
    `sale_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_returns` (
    `id` VARCHAR(36) NOT NULL,
    `reference` VARCHAR(100) NOT NULL,
    `sale_id` VARCHAR(36) NOT NULL,
    `customer_id` VARCHAR(36) NOT NULL,
    `warehouse_id` VARCHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `subtotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `shipping` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'completed',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `sales_returns_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_return_items` (
    `id` VARCHAR(36) NOT NULL,
    `return_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `sale_item_id` VARCHAR(36) NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `tax_number` VARCHAR(100) NULL,
    `total_purchases` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total_paid` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total_due` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transfers` (
    `id` VARCHAR(36) NOT NULL,
    `reference` VARCHAR(100) NOT NULL,
    `from_warehouse_id` VARCHAR(36) NOT NULL,
    `to_warehouse_id` VARCHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `subtotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `shipping` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `created_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `transfers_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transfer_items` (
    `id` VARCHAR(36) NOT NULL,
    `transfer_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit_cost` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `tax` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `short_name` VARCHAR(50) NOT NULL,
    `base_unit` VARCHAR(255) NULL,
    `operator` VARCHAR(10) NULL,
    `operation_value` DECIMAL(10, 4) NULL DEFAULT 1.0000,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'manager', 'user') NOT NULL DEFAULT 'user',
    `avatar` VARCHAR(500) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouses` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `zip_code` VARCHAR(20) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `key` VARCHAR(255) NOT NULL,
    `value` TEXT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `adjustments` ADD CONSTRAINT `adjustments_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adjustments` ADD CONSTRAINT `adjustments_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adjustment_items` ADD CONSTRAINT `adjustment_items_adjustment_id_fkey` FOREIGN KEY (`adjustment_id`) REFERENCES `adjustments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adjustment_items` ADD CONSTRAINT `adjustment_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `office_shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_purchase_id_fkey` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_returns` ADD CONSTRAINT `purchase_returns_purchase_id_fkey` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_returns` ADD CONSTRAINT `purchase_returns_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_returns` ADD CONSTRAINT `purchase_returns_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_return_items` ADD CONSTRAINT `purchase_return_items_return_id_fkey` FOREIGN KEY (`return_id`) REFERENCES `purchase_returns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_return_items` ADD CONSTRAINT `purchase_return_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_return_items` ADD CONSTRAINT `purchase_return_items_purchase_item_id_fkey` FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_returns` ADD CONSTRAINT `sales_returns_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_returns` ADD CONSTRAINT `sales_returns_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_returns` ADD CONSTRAINT `sales_returns_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_return_items` ADD CONSTRAINT `sales_return_items_return_id_fkey` FOREIGN KEY (`return_id`) REFERENCES `sales_returns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_return_items` ADD CONSTRAINT `sales_return_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_return_items` ADD CONSTRAINT `sales_return_items_sale_item_id_fkey` FOREIGN KEY (`sale_item_id`) REFERENCES `sale_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_from_warehouse_id_fkey` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_to_warehouse_id_fkey` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer_items` ADD CONSTRAINT `transfer_items_transfer_id_fkey` FOREIGN KEY (`transfer_id`) REFERENCES `transfers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer_items` ADD CONSTRAINT `transfer_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
