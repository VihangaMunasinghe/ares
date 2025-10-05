# ARES - Advanced Resource & Efficiency System

<p align="center">
  <a href="https://github.com/VihangaMunasinghe/ares">
    <img src="https://img.shields.io/badge/version-v1.0-blue" alt="Version"/>
  </a>
  <a href="https://github.com/VihangaMunasinghe/ares/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/VihangaMunasinghe/ares" alt="License"/>
  </a>
  <a href="https://github.com/VihangaMunasinghe/ares/stargazers">
    <img src="https://img.shields.io/github/stars/VihangaMunasinghe/ares" alt="Stars"/>
  </a>
  <a href="https://github.com/VihangaMunasinghe/ares/network/members">
    <img src="https://img.shields.io/github/forks/VihangaMunasinghe/ares" alt="Forks"/>
  </a>
  <a href="https://github.com/VihangaMunasinghe/ares/issues">
    <img src="https://img.shields.io/github/issues/VihangaMunasinghe/ares" alt="Issues"/>
  </a>
</p>

> **Advanced Resource & Efficiency System for NASA Mission Planning**

A comprehensive mission planning and optimization tool designed for NASA space missions, featuring intelligent resource management, automated job scheduling, optimization queue processing, and waste calculation capabilities. ARES enables mission planners to optimize resource allocation, track mission parameters, and ensure efficient mission execution through advanced algorithms and real-time monitoring.

## Features

* **Mission Management**: Create, plan, and manage complex space missions with detailed parameters
* **Resource Optimization**: Intelligent resource allocation and waste calculation algorithms
* **Job Scheduling**: Automated job creation, queuing, and execution with real-time monitoring
* **Materials & Items**: Comprehensive inventory management for mission supplies and equipment
* **Recipe Management**: Define and manage resource transformation recipes and processes
* **Optimization Queue**: Background processing for complex optimization tasks
* **Real-time Dashboard**: Interactive web interface for mission monitoring and control
* **REST API**: Complete RESTful API for integration with external systems
* **Database Integration**: Robust PostgreSQL/Supabase integration with async support

## Project Structure

```
ares/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── core/           # Core configuration and database
│   │   ├── models/         # Pydantic models and database schemas
│   │   ├── routers/        # API route handlers
│   │   └── services/       # Business logic services
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/               # Next.js frontend application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities and helpers
│   ├── types/             # TypeScript type definitions
│   └── package.json       # Node.js dependencies
├── optimizing_system/     # Background optimization workers
│   ├── pyproject.toml     # Poetry configuration
│   ├── worker.py          # Main worker process
│   └── model.py           # Optimization models
├── CODE_OF_CONDUCT.md     # Community guidelines
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE                # MIT License
├── README.md              # Project documentation
└── SECURITY.md            # Security policy
```

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework with automatic API documentation
- **SQLAlchemy** - Database ORM with async support for high performance
- **Pydantic** - Data validation and serialization with type hints
- **asyncpg** - High-performance async PostgreSQL driver
- **uvicorn** - Lightning-fast ASGI server for production deployment
- **PostgreSQL/Supabase** - Robust database with cloud integration

### Frontend
- **Next.js 14** - React framework with App Router and Server Components
- **TypeScript** - Type-safe JavaScript for enhanced developer experience
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Radix UI** - Headless, accessible UI component primitives
- **React Hook Form** - Performant form handling with minimal re-renders
- **Zod** - TypeScript-first schema validation library

### Optimization System
- **Python 3.11+** - Core optimization algorithms and queue processing
- **Poetry** - Dependency management and virtual environment handling
- **Background Workers** - Asynchronous task processing for optimization jobs

## Prerequisites

- **Python 3.11+** (for backend and optimization system)
- **Node.js 18+** (for frontend development)
- **pnpm** (package manager for frontend)
- **PostgreSQL database** (Supabase recommended for cloud deployment)
- **Git** (for version control)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/VihangaMunasinghe/ares.git
cd ares
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd backend
```

#### Create Virtual Environment
```bash
python -m venv .venv
```

#### Activate Virtual Environment
**Windows:**
```bash
.venv\Scripts\activate
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

#### Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Environment Configuration
Create a `.env` file in the backend directory:

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

#### Start Backend Server
```bash
uvicorn app.main:app --reload
```

The backend will be available at: `http://127.0.0.1:8000`

API documentation (Swagger): `http://127.0.0.1:8000/docs`

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd frontend
```

#### Install Dependencies
```bash
pnpm install
```

#### Start Development Server
```bash
pnpm dev
```

The frontend will be available at: `http://localhost:3000`

#### Build for Production
```bash
pnpm build
pnpm start
```

### 4. Optimization System Setup

#### Navigate to Optimization System Directory
```bash
cd optimizing_system
```

#### Install Dependencies with Poetry
```bash
poetry install
```

#### Activate Poetry Environment
```bash
poetry shell
```

#### Run Optimization Worker
```bash
python worker.py
```

### 5. Access the Application

Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

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
- `python -m pytest` - Run backend tests (when available)

### Frontend
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

### Optimization System
- `poetry install` - Install dependencies
- `poetry shell` - Activate virtual environment
- `python worker.py` - Start optimization worker
- `python test_worker.py` - Test worker functionality

## API Endpoints

### Core Resources

#### Missions
- `GET /missions` - List all missions with pagination
- `GET /missions/{id}` - Get specific mission details
- `POST /missions` - Create new mission
- `PUT /missions/{id}` - Update mission
- `DELETE /missions/{id}` - Delete mission

#### Global Entities (Materials, Items, Recipes)
- `GET /global-entities/materials` - List materials
- `POST /global-entities/materials` - Create material
- `GET /global-entities/items` - List items
- `POST /global-entities/items` - Create item
- `GET /global-entities/recipes` - List recipes
- `POST /global-entities/recipes` - Create recipe

#### Jobs & Optimization
- `GET /jobs` - List optimization jobs
- `POST /jobs` - Create optimization job
- `GET /jobs/{id}` - Get job details and results
- `POST /optimization/queue` - Add job to optimization queue
- `GET /optimization/status` - Get queue status

#### Metrics & Monitoring
- `GET /metrics/dashboard` - Get dashboard metrics
- `GET /metrics/jobs` - Get job performance metrics

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

4. **Optimization System:**
   - Use Poetry for dependency management
   - Monitor worker processes for optimization jobs
   - Check queue status through API endpoints

## Troubleshooting

### Backend Issues
- **SQLAlchemy URL Error:** Ensure URL uses `postgresql+asyncpg://` scheme
- **Module Import Errors:** Verify virtual environment is activated
- **Database Connection:** Check credentials and network connectivity

### Frontend Issues
- **Dependency Errors:** Try `rm -rf node_modules && pnpm install`
- **Build Errors:** Check TypeScript errors in terminal
- **CORS Issues:** Verify backend CORS_ORIGINS setting

### Optimization System Issues
- **Poetry Install Errors:** Ensure Poetry is installed and updated
- **Worker Not Starting:** Check Python version and dependencies
- **Queue Processing:** Verify database connection and job status

## Usage

1. **Create Missions**: Define space missions with parameters and objectives
2. **Manage Resources**: Add materials, items, and transformation recipes
3. **Schedule Jobs**: Create optimization jobs for resource allocation
4. **Monitor Progress**: Use the dashboard to track job status and results
5. **Analyze Results**: Review optimization results and mission efficiency

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## Security

For security-related issues, please refer to our [Security Policy](SECURITY.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
