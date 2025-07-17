/*
 Navicat Premium Dump SQL

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80032 (8.0.32)
 Source Host           : localhost:3306
 Source Schema         : financial_db

 Target Server Type    : MySQL
 Target Server Version : 80032 (8.0.32)
 File Encoding         : 65001

 Date: 09/07/2025 16:36:40
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for cards
-- ----------------------------
DROP TABLE IF EXISTS `cards`;
CREATE TABLE `cards`  (
  `card_id` int NOT NULL AUTO_INCREMENT,
  `card_name` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `card_balance` bigint NOT NULL,
  `card_color` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'neutral',
  `bank_code` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`card_id`) USING BTREE,
  INDEX `cards_users`(`user_id` ASC) USING BTREE,
  CONSTRAINT `cards_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 24 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for forecast_details
-- ----------------------------
DROP TABLE IF EXISTS `forecast_details`;
CREATE TABLE `forecast_details`  (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `transaction_amount` bigint NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `forecast_id` int NOT NULL,
  `transaction_date` datetime NOT NULL,
  PRIMARY KEY (`transaction_id`) USING BTREE,
  INDEX `forecast_details`(`forecast_id` ASC) USING BTREE,
  CONSTRAINT `forecast_details` FOREIGN KEY (`forecast_id`) REFERENCES `forecasts` (`forecast_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 333 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for forecasts
-- ----------------------------
DROP TABLE IF EXISTS `forecasts`;
CREATE TABLE `forecasts`  (
  `forecast_id` int NOT NULL AUTO_INCREMENT,
  `forecast_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `amount` int NOT NULL,
  `direction` enum('in','out') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `card_id` int NOT NULL,
  `forecast_date` datetime NOT NULL,
  `repeat_times` int NOT NULL,
  `repeat_type` enum('hour','day','month','year') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`forecast_id`) USING BTREE,
  INDEX `forecast_card`(`card_id` ASC) USING BTREE,
  CONSTRAINT `forecast_card` FOREIGN KEY (`card_id`) REFERENCES `cards` (`card_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 28 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for transaction_categories
-- ----------------------------
DROP TABLE IF EXISTS `transaction_categories`;
CREATE TABLE `transaction_categories`  (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `color` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'slate',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` int NOT NULL,
  PRIMARY KEY (`category_id`) USING BTREE,
  INDEX `categories_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `categories_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for transactions_new
-- ----------------------------
DROP TABLE IF EXISTS `transactions_new`;
CREATE TABLE `transactions_new`  (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `amount` int NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `direction` enum('in','out') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `card_id` int NOT NULL,
  `category_id` int NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`) USING BTREE,
  INDEX `transaction_id_index`(`transaction_id` ASC) USING BTREE,
  INDEX `cards_card_id_fk`(`card_id` ASC) USING BTREE,
  INDEX `transactions_new_transaction_categories_category_id_fk`(`category_id` ASC) USING BTREE,
  CONSTRAINT `cards_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `cards` (`card_id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `transactions_new_transaction_categories_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `transaction_categories` (`category_id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `refresh_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `role` tinyint NOT NULL DEFAULT 0,
  `is_active` tinyint NOT NULL DEFAULT 1,
  PRIMARY KEY (`user_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
