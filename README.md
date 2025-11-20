# Authentication Chat Application

A full-stack authentication application with chat interface built with React, FastAPI, PostgreSQL, and pgAdmin, all running in Docker Compose.

## Features

- User registration and login
- JWT-based authentication
- Chat interface for authenticated users
- PostgreSQL database
- pgAdmin for database management

## Tech Stack

- **Frontend**: React 18 with shadcn/ui and Tailwind CSS
- **Backend**: FastAPI
- **Database**: PostgreSQL 15
- **Database Admin**: pgAdmin 4
- **Containerization**: Docker Compose

## Prerequisites

- Docker
- Docker Compose

## Getting Started

1. Clone the repository and navigate to the project directory.

2. Configure environment variables:
   - A `.env` file is included with default values
   - **Important**: Change the `SECRET_KEY` in `.env` to a strong random key for production
   - You can customize other environment variables as needed

3. Start all services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Access the application (default ports, configurable in `.env`):
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **pgAdmin**: http://localhost:5050
     - Email: admin@admin.com
     - Password: admin

## Services

### Frontend (React)
- Port: 3000
- Hot reload enabled
- Connects to backend API

### Backend (FastAPI)
- Port: 8000
- Auto-reload enabled
- JWT authentication
- RESTful API endpoints

### Database (PostgreSQL)
- Port: 5432
- Database: auth_db
- User: auth_user
- Password: auth_password

### pgAdmin
- Port: 5050
- Web-based PostgreSQL administration

## API Endpoints

- `POST /register` - Register a new user
- `POST /token` - Login and get access token
- `GET /users/me` - Get current user info (protected)
- `GET /health` - Health check

## Usage

1. Register a new account at http://localhost:3000/register
2. Login with your credentials
3. Start chatting in the chat interface

## Environment Variables

All environment variables are configured in the `.env` file:

**Database:**
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_DB` - PostgreSQL database name
- `POSTGRES_PORT` - PostgreSQL public port (default: 5432)

**pgAdmin:**
- `PGADMIN_DEFAULT_EMAIL` - pgAdmin login email
- `PGADMIN_DEFAULT_PASSWORD` - pgAdmin login password
- `PGADMIN_PORT` - pgAdmin public port (default: 5050)

**Backend:**
- `DATABASE_URL` - Full database connection string
- `SECRET_KEY` - JWT secret key (change in production!)
- `ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time
- `BACKEND_PORT` - Backend API public port (default: 8000)
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins (e.g., `http://localhost:3000,http://localhost:5874`)

**Frontend:**
- `FRONTEND_PORT` - Frontend public port (default: 3000)
- `REACT_APP_API_URL` - Frontend API endpoint URL (should match `BACKEND_PORT`, e.g., `http://localhost:8000`)

## Development

The application is configured for development with hot reload:
- Frontend changes are reflected immediately
- Backend changes trigger automatic server restart
- Database data persists in Docker volumes

## Stopping the Application

To stop all services:
```bash
docker-compose down
```

To stop and remove volumes (clears database data):
```bash
docker-compose down -v
```

