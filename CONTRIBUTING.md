# Contributing to ARES

Thank you for your interest in contributing to ARES (Advanced Resource & Efficiency System)! This document provides guidelines and instructions to help you get started with contributing to this NASA mission planning and optimization tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setting Up the Development Environment](#setting-up-the-development-environment)
- [Development Workflow](#development-workflow)
  - [Branching Strategy](#branching-strategy)
  - [Making Changes](#making-changes)
  - [Testing](#testing)
  - [Code Style and Linting](#code-style-and-linting)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- **Frontend Development**: 
  - Node.js (v18 or higher)
  - pnpm package manager
  
- **Backend Development**:
  - Python 3.11+
  - PostgreSQL or Supabase account

- **Optimization System**:
  - Python 3.11+
  - Poetry for dependency management

### Setting Up the Development Environment

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ares.git
   cd ares
   ```

2. **Set up the Backend**:
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   source .venv/bin/activate  # On Unix or MacOS
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Set up the Frontend**:
   ```bash
   cd frontend
   pnpm install
   ```

4. **Set up the Optimization System**:
   ```bash
   cd optimizing_system
   poetry install
   ```

5. **Configure Environment Variables**:
   Create a `.env` file in the backend directory with your database configuration.

6. **Run the development servers**:
   
   In one terminal (Backend):
   ```bash
   cd backend
   .venv\Scripts\activate  # On Windows
   source .venv/bin/activate  # On Unix or MacOS
   uvicorn app.main:app --reload
   ```
   
   In another terminal (Frontend):
   ```bash
   cd frontend
   pnpm dev
   ```

   In a third terminal (Optimization Worker):
   ```bash
   cd optimizing_system
   poetry shell
   python worker.py
   ```

## Development Workflow

### Branching Strategy

- `main` is the primary branch and should always be stable
- Create feature branches from `main` using the following naming convention:
  - `feature/short-description` for new features
  - `bugfix/issue-number` for bug fixes
  - `docs/description` for documentation changes
  - `refactor/description` for code refactoring

### Making Changes

1. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them with descriptive messages:
   ```bash
   git add .
   git commit -m "Add detailed description of changes"
   ```

3. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

### Testing

- **Frontend**: We use Jest and React Testing Library for testing components. Run tests with:
  ```bash
  cd frontend
  pnpm test
  ```

- **Backend**: We use pytest for testing API endpoints and services. Run tests with:
  ```bash
  cd backend
  python -m pytest
  ```

- **Optimization System**: Test optimization algorithms with:
  ```bash
  cd optimizing_system
  poetry run python test_worker.py
  ```

### Code Style and Linting

- **Frontend**: We use ESLint with TypeScript configuration. Run linting with:
  ```bash
  cd frontend
  pnpm lint
  pnpm type-check
  ```

- **Backend**: We follow PEP 8 guidelines. Consider using tools like `black` or `flake8` for formatting:
  ```bash
  cd backend
  black .
  flake8 .
  ```

- **Optimization System**: Use Poetry for consistent formatting:
  ```bash
  cd optimizing_system
  poetry run black .
  ```

## Pull Request Process

1. Ensure your code follows our style guidelines and passes all tests
2. Update documentation if necessary
3. Submit a pull request to the `main` branch with a clear title and description
4. Reference any related issues in your PR description using the keyword "Fixes #issue_number"
5. Wait for code review and address any requested changes
6. After approval, a maintainer will merge your PR

## Documentation

- Update the README.md if you're changing functionality or adding features
- Add comments to your code, especially for complex logic
- Document API endpoints in the FastAPI application using docstrings
- Update type definitions in TypeScript files as needed

## Issue Reporting

When reporting issues, please include:

- A clear and descriptive title
- A detailed description of the issue
- Steps to reproduce the problem
- Expected behavior and actual behavior
- Screenshots if applicable
- Environment details (OS, browser, versions, etc.)
- Relevant logs or error messages

## Feature Requests

We welcome feature requests! Please provide:

- A clear and detailed description of the feature
- The motivation and use cases for the feature
- Any potential implementation ideas you might have
- Mockups or examples if applicable
- Consider how the feature fits with NASA mission planning requirements

## Component-Specific Guidelines

### Backend (FastAPI)
- Follow RESTful API design principles
- Use proper HTTP status codes
- Implement proper error handling
- Add comprehensive docstrings for API endpoints
- Use type hints throughout the codebase

### Frontend (Next.js + TypeScript)
- Use TypeScript for all new components
- Follow React best practices and hooks patterns
- Implement proper error boundaries
- Use proper accessibility attributes
- Follow the existing component structure

### Optimization System
- Document algorithm complexity and performance characteristics
- Include unit tests for optimization functions
- Follow mathematical notation conventions in comments
- Consider memory and computational efficiency

## NASA Mission Context

When contributing to ARES, keep in mind:

- **Mission-Critical Requirements**: Changes should consider the reliability needs of space missions
- **Resource Constraints**: Optimize for efficiency in both computation and memory usage
- **Scalability**: Consider how features will work with large mission datasets
- **Documentation**: NASA projects require thorough documentation for compliance and safety

Thank you for contributing to ARES!