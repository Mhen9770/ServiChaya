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

## Troubleshooting Failed Migrations

If you encounter a "Detected failed migration" error:

### Option 1: Automatic Repair (Recommended)
The application is configured with `repair-on-migrate: true` which will automatically repair failed migrations on startup. This should resolve most issues.

### Option 2: Manual Repair via SQL
If automatic repair doesn't work, connect to your database and run:

```sql
-- Check failed migrations
SELECT * FROM flyway_schema_history WHERE success = 0;

-- Repair failed migration (mark as resolved)
UPDATE flyway_schema_history 
SET success = 1 
WHERE version = '2' AND success = 0;

-- Or delete the failed record if migration was partially applied
DELETE FROM flyway_schema_history WHERE version = '2' AND success = 0;
```

**Note**: Only delete the record if you're certain the migration data was already applied. Otherwise, use UPDATE to mark it as successful.

### Option 3: Using Flyway CLI
If you have Flyway CLI installed:

```bash
flyway repair -url=jdbc:mysql://host:port/database -user=user -password=pass
```

### Common Causes of Failed Migrations

1. **Duplicate Key Violations**: Migration tries to insert data that already exists
   - **Solution**: All migrations are now idempotent (use `WHERE NOT EXISTS`)

2. **Missing Dependencies**: Migration depends on data from a previous migration
   - **Solution**: Ensure migrations run in order (V1, V2, V3, etc.)

3. **Database Connection Issues**: Connection lost during migration
   - **Solution**: Run repair and restart application

4. **Schema Mismatch**: Table structure doesn't match what migration expects
   - **Solution**: Ensure JPA entities are up to date and schema is synced

---

**Remember**: Schema = JPA Entities | Data = Flyway Migrations
