# ARES - NASA Mission Optimizer

A comprehensive mission planning and optimization tool for NASA space missions, featuring resource management, job scheduling, and waste calculation capabilities.

## Project Structure

```
ares/
├── backend/          # FastAPI backend application
│   ├── app/
│   │   ├── core/     # Core configuration and database
│   │   ├── models/   # Pydantic models
│   │   ├── routers/  # API route handlers
│   │   └── services/ # Business logic services
│   ├── requirements.txt
│   └── .env          # Environment variables
├── frontend/         # Next.js frontend application
│   ├── app/          # App router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and helpers
│   ├── types/        # TypeScript type definitions
│   └── package.json
└── README.md
```

## Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 18+** (for frontend)
- **pnpm** (package manager for frontend)
- **PostgreSQL database** (Supabase recommended)

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv .venv
```

### 3. Activate Virtual Environment
**Windows:**
```bash
.venv\Scripts\activate
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Environment Configuration
Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
SUPABASE_DB_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# Supabase Configuration (optional)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
AUTH_DISABLED=true
CORS_ORIGINS=http://localhost:3000
```

**Important Notes:**
- Replace `YOUR_PASSWORD` with your actual database password
- Replace `YOUR_PROJECT` with your Supabase project ID
- The URL must use `postgresql+asyncpg://` for async SQLAlchemy support

### 6. Start Backend Server
```bash
uvicorn app.main:app --reload
```

The backend will be available at: `http://127.0.0.1:8000`

API documentation (Swagger): `http://127.0.0.1:8000/docs`

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Development Server
```bash
pnpm dev
```

The frontend will be available at: `http://localhost:3000`

### 4. Build for Production
```bash
pnpm build
pnpm start
```

## Database Setup

### Using Supabase (Recommended)

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your database URL from Project Settings > Database
3. Update the `.env` file with your credentials
4. The application will connect automatically

### Local PostgreSQL

If using a local PostgreSQL instance:

```env
SUPABASE_DB_URL=postgresql+asyncpg://username:password@localhost:5432/database_name
```

## Available Scripts

### Backend
- `uvicorn app.main:app --reload` - Start development server with auto-reload
- `uvicorn app.main:app` - Start production server
- `pip install -r requirements.txt` - Install dependencies

### Frontend
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## API Endpoints

### Missions
- `GET /missions` - List all missions
- `GET /missions/{id}` - Get specific mission
- `POST /missions` - Create new mission

### Materials
- `GET /materials` - List materials
- `POST /materials` - Create material

### Recipes
- `GET /recipes` - List recipes
- `POST /recipes` - Create recipe

### Items
- `GET /items` - List items
- `POST /items` - Create item

### Jobs
- `GET /jobs` - List jobs
- `POST /jobs` - Create job

### Schedules
- `GET /schedules` - List schedules
- `POST /schedules` - Create schedule

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM with async support
- **Pydantic** - Data validation and serialization
- **asyncpg** - Async PostgreSQL driver
- **uvicorn** - ASGI server

### Frontend
- **Next.js 14** - React framework with app router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## Development Tips

1. **Backend Development:**
   - Use `--reload` flag for auto-restart on code changes
   - Check `/docs` endpoint for interactive API documentation
   - Monitor console for database connection issues

2. **Frontend Development:**
   - Hot reload is enabled by default
   - TypeScript errors will show in terminal and browser
   - Use browser dev tools for component debugging

3. **Database:**
   - Ensure proper async driver (`postgresql+asyncpg://`)
   - Check Supabase dashboard for database logs
   - Use SQL editor in Supabase for direct database queries

## Troubleshooting

### Backend Issues
- **SQLAlchemy URL Error:** Ensure URL uses `postgresql+asyncpg://` scheme
- **Module Import Errors:** Verify virtual environment is activated
- **Database Connection:** Check credentials and network connectivity

### Frontend Issues
- **Dependency Errors:** Try `rm -rf node_modules && pnpm install`
- **Build Errors:** Check TypeScript errors in terminal
- **CORS Issues:** Verify backend CORS_ORIGINS setting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License.
