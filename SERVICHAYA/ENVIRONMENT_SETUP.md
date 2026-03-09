# Environment Variables Setup

## Required Environment Variables

The SERVICHAYA frontend requires the following environment variables to be set:

### NEXT_PUBLIC_API_URL (REQUIRED)

The backend API URL. This **must** be set as a Linux environment variable.

#### Setting in Linux Environment

**Option 1: Export in current session**
```bash
export NEXT_PUBLIC_API_URL=http://localhost:8080/api
npm run dev
```

**Option 2: Add to shell profile (permanent)**
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export NEXT_PUBLIC_API_URL=http://localhost:8080/api' >> ~/.bashrc
source ~/.bashrc
```

**Option 3: Set in systemd service file**
```ini
[Service]
Environment="NEXT_PUBLIC_API_URL=http://localhost:8080/api"
```

**Option 4: Use .env file (for development)**
Create a `.env` file in the SERVICHAYA directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

#### Production Examples

```bash
# Development
export NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Staging
export NEXT_PUBLIC_API_URL=https://api-staging.servichaya.com/api

# Production
export NEXT_PUBLIC_API_URL=https://api.servichaya.com/api
```

### NEXT_PUBLIC_RAZORPAY_KEY_ID (REQUIRED for payments)

Razorpay payment gateway key ID.

```bash
export NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

## Verification

To verify your environment variables are set correctly:

```bash
# Check if variable is set
echo $NEXT_PUBLIC_API_URL

# Run Next.js with environment check
npm run dev
```

If the variable is not set, the application will throw an error on startup.

## Docker/Container Setup

If running in Docker, set environment variables in `docker-compose.yml`:

```yaml
services:
  frontend:
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8080/api
      - NEXT_PUBLIC_RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
```

Or pass via command line:
```bash
docker run -e NEXT_PUBLIC_API_URL=http://localhost:8080/api servichaya-frontend
```

## CI/CD Pipeline

For CI/CD pipelines, set environment variables in your pipeline configuration:

**GitHub Actions:**
```yaml
env:
  NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
```

**GitLab CI:**
```yaml
variables:
  NEXT_PUBLIC_API_URL: $API_URL
```
