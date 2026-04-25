CREATE DATABASE IF NOT EXISTS sns_db;
USE sns_db;

INSERT INTO users (enabled, email, full_name, password_hash, phone_number, role)
VALUES (
  1,
  'admin@sns.gov.in',
  'Admin User',
  '$2a$10$7QJ3fQ5Q8ZC9zQq2GQpGSeY6l0FQ2W1GQO5Fqv5YkR7C7xZ7xW1iK',
  '9999999999',
  'ROLE_ADMIN'
);