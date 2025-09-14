/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `verdsoft_bms` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `verdsoft_bms`;

CREATE TABLE IF NOT EXISTS `adjustments` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `reference` varchar(100) NOT NULL,
  `warehouse_id` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `type` enum('addition','subtraction') NOT NULL,
  `notes` text,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `adjustments_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `adjustments_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `adjustment_items` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `adjustment_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `type` enum('addition','subtraction') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `pre_stock` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `adjustment_id` (`adjustment_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `adjustment_items_ibfk_1` FOREIGN KEY (`adjustment_id`) REFERENCES `adjustments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `adjustment_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `attendance` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `employee_id` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `break_time` int DEFAULT '0',
  `total_hours` decimal(4,2) DEFAULT '0.00',
  `status` enum('present','absent','late','half_day') DEFAULT 'present',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_date` (`employee_id`,`date`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `brands` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `description` text,
  `image` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `companies` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `tax_number` varchar(100) DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `currencies` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `code` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `symbol` varchar(10) NOT NULL,
  `exchange_rate` decimal(10,4) DEFAULT '1.0000',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `tax_number` varchar(100) DEFAULT NULL,
  `credit_limit` decimal(10,2) DEFAULT '0.00',
  `total_sales` decimal(10,2) DEFAULT '0.00',
  `total_paid` decimal(10,2) DEFAULT '0.00',
  `total_due` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `departments` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `company_id` varchar(36) DEFAULT NULL,
  `description` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `employees` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `employee_id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `department_id` varchar(36) DEFAULT NULL,
  `shift_id` varchar(36) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `address` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `department_id` (`department_id`),
  KEY `shift_id` (`shift_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`shift_id`) REFERENCES `office_shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `reference` varchar(100) NOT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `description` text,
  `attachment` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `category_id` (`category_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `expense_categories` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `description` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `holidays` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `description` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `employee_id` varchar(36) NOT NULL,
  `leave_type_id` varchar(36) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days` int NOT NULL,
  `reason` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `leave_types` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `days_allowed` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `office_shifts` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `code` varchar(100) NOT NULL,
  `barcode` varchar(255) DEFAULT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `brand_id` varchar(36) DEFAULT NULL,
  `unit_id` varchar(36) DEFAULT NULL,
  `warehouse_id` varchar(36) DEFAULT NULL,
  `cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `alert_quantity` decimal(10,2) DEFAULT '0.00',
  `description` text,
  `image` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `category_id` (`category_id`),
  KEY `brand_id` (`brand_id`),
  KEY `unit_id` (`unit_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_4` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `purchases` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'uuid()',
  `reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `supplier_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `warehouse_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `date` date NOT NULL,
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `shipping` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `paid` decimal(10,2) DEFAULT '0.00',
  `due` decimal(10,2) DEFAULT '0.00',
  `status` enum('pending','received','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'pending',
  `payment_status` enum('unpaid','partial','paid') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'unpaid',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `created_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `reference` (`reference`) USING BTREE,
  KEY `supplier_id` (`supplier_id`) USING BTREE,
  KEY `warehouse_id` (`warehouse_id`) USING BTREE,
  KEY `created_by` (`created_by`) USING BTREE,
  CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchases_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `purchase_items` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `purchase_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `tax` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `purchase_items_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `purchase_returns` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `reference` varchar(100) NOT NULL,
  `purchase_id` varchar(36) NOT NULL,
  `supplier_id` varchar(36) NOT NULL,
  `warehouse_id` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `shipping` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'completed',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `purchase_id` (`purchase_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `purchase_returns_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_returns_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_returns_ibfk_3` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `purchase_return_items` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `return_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `purchase_item_id` varchar(36) DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `tax` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `return_id` (`return_id`),
  KEY `product_id` (`product_id`),
  KEY `purchase_item_id` (`purchase_item_id`),
  CONSTRAINT `purchase_return_items_ibfk_1` FOREIGN KEY (`return_id`) REFERENCES `purchase_returns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_return_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_return_items_ibfk_3` FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `quotations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reference` varchar(100) NOT NULL,
  `customer_id` varchar(36) DEFAULT NULL,
  `warehouse_id` varchar(36) DEFAULT NULL,
  `date` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `shipping` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `status` enum('pending','sent','accepted','rejected','expired') DEFAULT 'pending',
  `notes` text,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `customer_id` (`customer_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `quotations_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `quotation_items` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `quotation_id` int NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `tax` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `FK_quotation_items_quotations` (`quotation_id`),
  CONSTRAINT `FK_quotation_items_quotations` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`),
  CONSTRAINT `quotation_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `sales` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `reference` varchar(100) NOT NULL,
  `customer_id` varchar(36) DEFAULT NULL,
  `warehouse_id` varchar(36) DEFAULT NULL,
  `date` date NOT NULL,
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `shipping` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `paid` decimal(10,2) DEFAULT '0.00',
  `due` decimal(10,2) DEFAULT '0.00',
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `payment_status` enum('unpaid','partial','paid') DEFAULT 'unpaid',
  `notes` text,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `customer_id` (`customer_id`),
  KEY `warehouse_id` (`warehouse_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `sales_returns` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `reference` varchar(100) NOT NULL,
  `sale_id` varchar(36) NOT NULL,
  `customer_id` varchar(36) NOT NULL,
  `warehouse_id` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `shipping` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'completed',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `sale_id` (`sale_id`),
  KEY `customer_id` (`customer_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `sales_returns_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_returns_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_returns_ibfk_3` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `sales_return_items` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `return_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `sale_item_id` varchar(36) DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `tax` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `return_id` (`return_id`),
  KEY `product_id` (`product_id`),
  KEY `sale_item_id` (`sale_item_id`),
  CONSTRAINT `sales_return_items_ibfk_1` FOREIGN KEY (`return_id`) REFERENCES `sales_returns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_return_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_return_items_ibfk_3` FOREIGN KEY (`sale_item_id`) REFERENCES `sale_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `sale_items` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `sale_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `tax` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `key` varchar(255) NOT NULL,
  `value` text,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `tax_number` varchar(100) DEFAULT NULL,
  `total_purchases` decimal(10,2) DEFAULT '0.00',
  `total_paid` decimal(10,2) DEFAULT '0.00',
  `total_due` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `transfers` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `reference` varchar(100) NOT NULL,
  `from_warehouse_id` varchar(36) NOT NULL,
  `to_warehouse_id` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tax_rate` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `shipping` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `notes` text,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `from_warehouse_id` (`from_warehouse_id`),
  KEY `to_warehouse_id` (`to_warehouse_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `transfers_ibfk_1` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transfers_ibfk_2` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transfers_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `transfer_items` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `transfer_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `tax` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `transfer_id` (`transfer_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `transfer_items_ibfk_1` FOREIGN KEY (`transfer_id`) REFERENCES `transfers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transfer_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `units` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `short_name` varchar(50) NOT NULL,
  `base_unit` varchar(255) DEFAULT NULL,
  `operator` enum('+','-','*','/') DEFAULT '*',
  `operation_value` decimal(10,4) DEFAULT '1.0000',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','manager','user') DEFAULT 'user',
  `avatar` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `warehouses` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `zip_code` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
