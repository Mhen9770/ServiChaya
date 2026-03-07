# SERVICHAYABackend - Spring Boot Application

## Spring Boot Backend for SERVICHAYA Platform

### Tech Stack
- **Framework**: Spring Boot 3.x
- **Language**: Java 21
- **Database**: MySQL 8.0
- **ORM**: Spring Data JPA
- **Security**: Spring Security + JWT
- **API Documentation**: SpringDoc OpenAPI
- **Migration**: Flyway
- **Caching**: Redis (optional)

### Project Structure (Modular Monolith)

```
SERVICHAYABackend/
├── servichaya-api/                 # API Modules
│   ├── user-api/
│   ├── auth-api/
│   ├── job-api/
│   ├── provider-api/
│   ├── payment-api/
│   └── admin-api/
│
├── servichaya-service/             # Service Modules
│   ├── user-service/
│   ├── auth-service/
│   ├── job-service/
│   ├── provider-service/
│   ├── payment-service/
│   └── admin-service/
│
├── servichaya-common/              # Common Utilities
│   ├── exception/
│   ├── response/
│   ├── constants/
│   └── utils/
│
└── servichaya-core/                # Core Configuration
    ├── config/
    ├── security/
    └── Application.java
```

### Module Structure

Each module follows this structure:

```
module-name-api/
├── dto/                            # Request/Response DTOs
├── feign/                          # Feign Clients
└── controller/                     # Controller Interfaces

module-name-service/
├── controller/                      # Controller Implementation
├── service/                        # Service Layer
├── repository/                     # Repository Layer
├── entity/                         # JPA Entities
└── mapper/                         # Entity-DTO Mappers
```

### Getting Started

```bash
# Build project
./mvnw clean install

# Run application
./mvnw spring-boot:run

# Run tests
./mvnw test
```

### Application Properties

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/servichaya
spring.datasource.username=root
spring.datasource.password=password

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

# Flyway
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

# JWT
jwt.secret=your_jwt_secret
jwt.expiration=86400000

# OTP
otp.expiration=300000
otp.length=6

# RazorPay
razorpay.key.id=your_key_id
razorpay.key.secret=your_key_secret
```

### Key Features

- ✅ Modular Monolith architecture
- ✅ POD-based data filtering
- ✅ Database-driven configuration
- ✅ Multi-factor matching algorithm
- ✅ Flexible payment system
- ✅ Provider onboarding workflow
- ✅ Full Kundali (profile/history) system

### Database Performance Rules

- ✅ Use Interface Projections (never fetch full entities)
- ✅ Use Native SQL for complex queries
- ✅ Avoid N+1 queries (use JOIN FETCH)
- ✅ NEVER use findAll() (always paginate)
- ✅ Use Database Views for analytics
- ✅ Proper indexing strategy

### Development Guidelines

Follow **MVP_PLAN.md** and **Roadmap.txt** for:
- Database schema
- Business logic
- API design
- Performance rules

---

**Built for SERVICHAYA Platform** 🚀
