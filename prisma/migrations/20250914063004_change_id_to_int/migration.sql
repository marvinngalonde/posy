/*
  Warnings:

  - The primary key for the `adjustment_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `adjustment_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `adjustment_id` on the `adjustment_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `product_id` on the `adjustment_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `adjustments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `adjustments` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `warehouse_id` on the `adjustments` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `attendance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `employee_id` on the `attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `brands` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `brands` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `companies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `currencies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `currencies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `customers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `departments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `departments` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `employees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `employee_id` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Int`.
  - The primary key for the `expense_categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `expense_categories` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `expenses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `expenses` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `holidays` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `holidays` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `leave_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `leave_requests` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `employee_id` on the `leave_requests` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `leave_type_id` on the `leave_requests` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `leave_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `leave_types` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `office_shifts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `office_shifts` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `products` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `products` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `purchase_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `purchase_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `purchase_id` on the `purchase_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `product_id` on the `purchase_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `purchase_return_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `purchase_return_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `return_id` on the `purchase_return_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `product_id` on the `purchase_return_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `purchase_returns` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `purchase_returns` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `purchase_id` on the `purchase_returns` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `supplier_id` on the `purchase_returns` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `warehouse_id` on the `purchase_returns` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `purchases` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `purchases` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `quotation_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `quotation_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `product_id` on the `quotation_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `sale_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `sale_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `sale_id` on the `sale_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `product_id` on the `sale_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `sales` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `sales_return_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `sales_return_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `return_id` on the `sales_return_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `product_id` on the `sales_return_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `sales_returns` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `sales_returns` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `sale_id` on the `sales_returns` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `customer_id` on the `sales_returns` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `warehouse_id` on the `sales_returns` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `suppliers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `transfer_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `transfer_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `transfer_id` on the `transfer_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `product_id` on the `transfer_items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `transfers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `transfers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `from_warehouse_id` on the `transfers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `to_warehouse_id` on the `transfers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `units` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `units` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - The primary key for the `warehouses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `warehouses` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - Made the column `created_by` on table `adjustments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `company_id` on table `departments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `department_id` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `shift_id` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category_id` on table `expenses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `expenses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `approved_by` on table `leave_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category_id` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `brand_id` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `unit_id` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `warehouse_id` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `purchase_item_id` on table `purchase_return_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `supplier_id` on table `purchases` required. This step will fail if there are existing NULL values in that column.
  - Made the column `warehouse_id` on table `purchases` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `purchases` required. This step will fail if there are existing NULL values in that column.
  - Made the column `customer_id` on table `quotations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `warehouse_id` on table `quotations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `quotations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `customer_id` on table `sales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `warehouse_id` on table `sales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `sales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sale_item_id` on table `sales_return_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `transfers` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `adjustment_items` DROP FOREIGN KEY `adjustment_items_adjustment_id_fkey`;

-- DropForeignKey
ALTER TABLE `adjustment_items` DROP FOREIGN KEY `adjustment_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `adjustments` DROP FOREIGN KEY `adjustments_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `adjustments` DROP FOREIGN KEY `adjustments_warehouse_id_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_employee_id_fkey`;

-- DropForeignKey
ALTER TABLE `departments` DROP FOREIGN KEY `departments_company_id_fkey`;

-- DropForeignKey
ALTER TABLE `employees` DROP FOREIGN KEY `employees_department_id_fkey`;

-- DropForeignKey
ALTER TABLE `employees` DROP FOREIGN KEY `employees_shift_id_fkey`;

-- DropForeignKey
ALTER TABLE `expenses` DROP FOREIGN KEY `expenses_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `expenses` DROP FOREIGN KEY `expenses_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `leave_requests` DROP FOREIGN KEY `leave_requests_approved_by_fkey`;

-- DropForeignKey
ALTER TABLE `leave_requests` DROP FOREIGN KEY `leave_requests_employee_id_fkey`;

-- DropForeignKey
ALTER TABLE `leave_requests` DROP FOREIGN KEY `leave_requests_leave_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_brand_id_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_unit_id_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_warehouse_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_items` DROP FOREIGN KEY `purchase_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_items` DROP FOREIGN KEY `purchase_items_purchase_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_return_items` DROP FOREIGN KEY `purchase_return_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_return_items` DROP FOREIGN KEY `purchase_return_items_purchase_item_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_return_items` DROP FOREIGN KEY `purchase_return_items_return_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_returns` DROP FOREIGN KEY `purchase_returns_purchase_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_returns` DROP FOREIGN KEY `purchase_returns_supplier_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_returns` DROP FOREIGN KEY `purchase_returns_warehouse_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_supplier_id_fkey`;

-- DropForeignKey
ALTER TABLE `purchases` DROP FOREIGN KEY `purchases_warehouse_id_fkey`;

-- DropForeignKey
ALTER TABLE `quotation_items` DROP FOREIGN KEY `quotation_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_warehouse_id_fkey`;

-- DropForeignKey
ALTER TABLE `sale_items` DROP FOREIGN KEY `sale_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `sale_items` DROP FOREIGN KEY `sale_items_sale_id_fkey`;

-- DropForeignKey
ALTER TABLE `sales` DROP FOREIGN KEY `sales_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `sales` DROP FOREIGN KEY `sales_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `sales` DROP FOREIGN KEY `sales_warehouse_id_fkey`;

-- DropForeignKey
ALTER TABLE `sales_return_items` DROP FOREIGN KEY `sales_return_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `sales_return_items` DROP FOREIGN KEY `sales_return_items_return_id_fkey`;

-- DropForeignKey
ALTER TABLE `sales_return_items` DROP FOREIGN KEY `sales_return_items_sale_item_id_fkey`;

-- DropForeignKey
ALTER TABLE `sales_returns` DROP FOREIGN KEY `sales_returns_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `sales_returns` DROP FOREIGN KEY `sales_returns_sale_id_fkey`;

-- DropForeignKey
ALTER TABLE `sales_returns` DROP FOREIGN KEY `sales_returns_warehouse_id_fkey`;

-- DropForeignKey
ALTER TABLE `transfer_items` DROP FOREIGN KEY `transfer_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `transfer_items` DROP FOREIGN KEY `transfer_items_transfer_id_fkey`;

-- DropForeignKey
ALTER TABLE `transfers` DROP FOREIGN KEY `transfers_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `transfers` DROP FOREIGN KEY `transfers_from_warehouse_id_fkey`;

-- DropForeignKey
ALTER TABLE `transfers` DROP FOREIGN KEY `transfers_to_warehouse_id_fkey`;

-- DropIndex
DROP INDEX `adjustment_items_adjustment_id_fkey` ON `adjustment_items`;

-- DropIndex
DROP INDEX `adjustment_items_product_id_fkey` ON `adjustment_items`;

-- DropIndex
DROP INDEX `adjustments_created_by_fkey` ON `adjustments`;

-- DropIndex
DROP INDEX `adjustments_warehouse_id_fkey` ON `adjustments`;

-- DropIndex
DROP INDEX `attendance_employee_id_fkey` ON `attendance`;

-- DropIndex
DROP INDEX `departments_company_id_fkey` ON `departments`;

-- DropIndex
DROP INDEX `employees_department_id_fkey` ON `employees`;

-- DropIndex
DROP INDEX `employees_employee_id_key` ON `employees`;

-- DropIndex
DROP INDEX `employees_shift_id_fkey` ON `employees`;

-- DropIndex
DROP INDEX `expenses_category_id_fkey` ON `expenses`;

-- DropIndex
DROP INDEX `expenses_created_by_fkey` ON `expenses`;

-- DropIndex
DROP INDEX `leave_requests_approved_by_fkey` ON `leave_requests`;

-- DropIndex
DROP INDEX `leave_requests_employee_id_fkey` ON `leave_requests`;

-- DropIndex
DROP INDEX `leave_requests_leave_type_id_fkey` ON `leave_requests`;

-- DropIndex
DROP INDEX `products_brand_id_fkey` ON `products`;

-- DropIndex
DROP INDEX `products_category_id_fkey` ON `products`;

-- DropIndex
DROP INDEX `products_unit_id_fkey` ON `products`;

-- DropIndex
DROP INDEX `products_warehouse_id_fkey` ON `products`;

-- DropIndex
DROP INDEX `purchase_items_product_id_fkey` ON `purchase_items`;

-- DropIndex
DROP INDEX `purchase_items_purchase_id_fkey` ON `purchase_items`;

-- DropIndex
DROP INDEX `purchase_return_items_product_id_fkey` ON `purchase_return_items`;

-- DropIndex
DROP INDEX `purchase_return_items_purchase_item_id_fkey` ON `purchase_return_items`;

-- DropIndex
DROP INDEX `purchase_return_items_return_id_fkey` ON `purchase_return_items`;

-- DropIndex
DROP INDEX `purchase_returns_purchase_id_fkey` ON `purchase_returns`;

-- DropIndex
DROP INDEX `purchase_returns_supplier_id_fkey` ON `purchase_returns`;

-- DropIndex
DROP INDEX `purchase_returns_warehouse_id_fkey` ON `purchase_returns`;

-- DropIndex
DROP INDEX `purchases_created_by_fkey` ON `purchases`;

-- DropIndex
DROP INDEX `purchases_supplier_id_fkey` ON `purchases`;

-- DropIndex
DROP INDEX `purchases_warehouse_id_fkey` ON `purchases`;

-- DropIndex
DROP INDEX `quotation_items_product_id_fkey` ON `quotation_items`;

-- DropIndex
DROP INDEX `quotations_created_by_fkey` ON `quotations`;

-- DropIndex
DROP INDEX `quotations_customer_id_fkey` ON `quotations`;

-- DropIndex
DROP INDEX `quotations_warehouse_id_fkey` ON `quotations`;

-- DropIndex
DROP INDEX `sale_items_product_id_fkey` ON `sale_items`;

-- DropIndex
DROP INDEX `sale_items_sale_id_fkey` ON `sale_items`;

-- DropIndex
DROP INDEX `sales_created_by_fkey` ON `sales`;

-- DropIndex
DROP INDEX `sales_customer_id_fkey` ON `sales`;

-- DropIndex
DROP INDEX `sales_warehouse_id_fkey` ON `sales`;

-- DropIndex
DROP INDEX `sales_return_items_product_id_fkey` ON `sales_return_items`;

-- DropIndex
DROP INDEX `sales_return_items_return_id_fkey` ON `sales_return_items`;

-- DropIndex
DROP INDEX `sales_return_items_sale_item_id_fkey` ON `sales_return_items`;

-- DropIndex
DROP INDEX `sales_returns_customer_id_fkey` ON `sales_returns`;

-- DropIndex
DROP INDEX `sales_returns_sale_id_fkey` ON `sales_returns`;

-- DropIndex
DROP INDEX `sales_returns_warehouse_id_fkey` ON `sales_returns`;

-- DropIndex
DROP INDEX `transfer_items_product_id_fkey` ON `transfer_items`;

-- DropIndex
DROP INDEX `transfer_items_transfer_id_fkey` ON `transfer_items`;

-- DropIndex
DROP INDEX `transfers_created_by_fkey` ON `transfers`;

-- DropIndex
DROP INDEX `transfers_from_warehouse_id_fkey` ON `transfers`;

-- DropIndex
DROP INDEX `transfers_to_warehouse_id_fkey` ON `transfers`;

-- AlterTable
ALTER TABLE `adjustment_items` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `adjustment_id` INTEGER NOT NULL,
    MODIFY `product_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `adjustments` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `warehouse_id` INTEGER NOT NULL,
    MODIFY `created_by` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `attendance` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `employee_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `brands` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `categories` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `companies` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `currencies` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `customers` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `departments` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `company_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `employees` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `employee_id` INTEGER NOT NULL,
    MODIFY `department_id` INTEGER NOT NULL,
    MODIFY `shift_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `expense_categories` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `expenses` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `category_id` INTEGER NOT NULL,
    MODIFY `created_by` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `holidays` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `leave_requests` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `employee_id` INTEGER NOT NULL,
    MODIFY `leave_type_id` INTEGER NOT NULL,
    MODIFY `approved_by` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `leave_types` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `office_shifts` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `products` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `category_id` INTEGER NOT NULL,
    MODIFY `brand_id` INTEGER NOT NULL,
    MODIFY `unit_id` INTEGER NOT NULL,
    MODIFY `warehouse_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `purchase_items` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `purchase_id` INTEGER NOT NULL,
    MODIFY `product_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `purchase_return_items` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `return_id` INTEGER NOT NULL,
    MODIFY `product_id` INTEGER NOT NULL,
    MODIFY `purchase_item_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `purchase_returns` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `purchase_id` INTEGER NOT NULL,
    MODIFY `supplier_id` INTEGER NOT NULL,
    MODIFY `warehouse_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `purchases` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `supplier_id` INTEGER NOT NULL,
    MODIFY `warehouse_id` INTEGER NOT NULL,
    MODIFY `created_by` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `quotation_items` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `product_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `quotations` MODIFY `customer_id` INTEGER NOT NULL,
    MODIFY `warehouse_id` INTEGER NOT NULL,
    MODIFY `created_by` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `sale_items` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `sale_id` INTEGER NOT NULL,
    MODIFY `product_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `sales` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `customer_id` INTEGER NOT NULL,
    MODIFY `warehouse_id` INTEGER NOT NULL,
    MODIFY `created_by` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `sales_return_items` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `return_id` INTEGER NOT NULL,
    MODIFY `product_id` INTEGER NOT NULL,
    MODIFY `sale_item_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `sales_returns` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `sale_id` INTEGER NOT NULL,
    MODIFY `customer_id` INTEGER NOT NULL,
    MODIFY `warehouse_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `suppliers` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `transfer_items` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `transfer_id` INTEGER NOT NULL,
    MODIFY `product_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `transfers` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `from_warehouse_id` INTEGER NOT NULL,
    MODIFY `to_warehouse_id` INTEGER NOT NULL,
    MODIFY `created_by` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `units` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `warehouses` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `adjustments` ADD CONSTRAINT `adjustments_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adjustments` ADD CONSTRAINT `adjustments_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adjustment_items` ADD CONSTRAINT `adjustment_items_adjustment_id_fkey` FOREIGN KEY (`adjustment_id`) REFERENCES `adjustments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adjustment_items` ADD CONSTRAINT `adjustment_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `office_shifts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `purchase_return_items` ADD CONSTRAINT `purchase_return_items_purchase_item_id_fkey` FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `sales_return_items` ADD CONSTRAINT `sales_return_items_sale_item_id_fkey` FOREIGN KEY (`sale_item_id`) REFERENCES `sale_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_from_warehouse_id_fkey` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_to_warehouse_id_fkey` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer_items` ADD CONSTRAINT `transfer_items_transfer_id_fkey` FOREIGN KEY (`transfer_id`) REFERENCES `transfers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfer_items` ADD CONSTRAINT `transfer_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
