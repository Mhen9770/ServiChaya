# Flyway Migrations - Master Data Only

## ⚠️ IMPORTANT POLICY

**This directory contains ONLY master data migrations (INSERT/UPDATE statements).**

### ✅ ALLOWED
- `INSERT` statements for master/reference data
- `UPDATE` statements for master data corrections
- `INSERT ... ON DUPLICATE KEY UPDATE` for idempotent inserts
- `INSERT ... WHERE NOT EXISTS` for conditional inserts

### ❌ NOT ALLOWED
- `CREATE TABLE` statements
- `ALTER TABLE` statements
- `DROP TABLE` statements
- `CREATE INDEX` statements
- Any DDL (Data Definition Language) statements

## Schema Management

**Database schema is managed by JPA/Hibernate**, not Flyway.

- Schema changes are made via JPA entities (`@Entity`, `@Table`, `@Column`, etc.)
- Hibernate auto-generates DDL from entities using `spring.jpa.hibernate.ddl-auto: update`
- All table structures, indexes, and constraints are defined in Java entity classes

## Migration Naming Convention

Follow Flyway naming: `V{version}__{description}.sql`

Examples:
- `V1__001_Master_Data_Country_State.sql`
- `V2__002_Master_Data_Cities_MP.sql`
- `V3__003_Master_Data_User_Roles.sql`

## Master Data Types

These migrations typically contain:
- **Reference Data**: Countries, States, Cities, Zones, PODs
- **Configuration Data**: User Roles, Service Categories, Matching Rules
- **Lookup Data**: Service Skills, Status Codes, etc.

## Best Practices

1. **Use idempotent inserts**: Always use `WHERE NOT EXISTS` or `ON DUPLICATE KEY UPDATE` to prevent duplicate data
2. **Version control**: Each migration should be versioned and tested
3. **Comments**: Add clear comments explaining what master data is being inserted
4. **Dependencies**: Ensure master data dependencies are loaded in correct order (e.g., States before Cities)

## Example

```sql
-- ✅ CORRECT: Master data insert
INSERT INTO country_master (code, name, description, country_code, currency_code, phone_code, is_active, created_at, updated_at)
SELECT 'IND', 'India', 'Republic of India', 'IN', 'INR', '+91', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM country_master WHERE code = 'IND');

-- ❌ WRONG: Schema change (NOT ALLOWED)
CREATE TABLE country_master (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL
);
```

---

**Remember**: Schema = JPA Entities | Data = Flyway Migrations
