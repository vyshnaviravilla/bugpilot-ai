# Example Project ZIP Files

This directory contains example project ZIP files for testing project upload and Vincy source inspection.

## Available Examples

The Upload Project page provides one-click buttons for all seven ZIPs below.

### 1. simple-react-app.zip
A minimal React application with:
- Basic component structure
- 4 intentional bugs for testing:
  - Missing dependency array in useEffect
  - No error handling in async function
  - Division by zero potential
  - Memory leak in interval
- README with setup instructions

### 2. python-api-project.zip
A simple Python FastAPI project with:
- Basic API endpoints
- 6 intentional bugs for testing:
  - Mutable default argument
  - SQL injection vulnerability
  - Missing error handling
  - Race condition in item creation
  - No input validation
  - Unbounded list processing

### 3. buggy-todo-react.zip
A small React todo list with state mutation and unstable list keys.

### 4. node-store-api.zip
A Node/Express product API with missing validation and unsafe index handling.

### 5. flask-task-api.zip
A Flask task API with unchecked request data and fragile list indexing.

### 6. java-inventory-service.zip
A Java inventory example with unchecked arguments and index access.

### 7. vanilla-js-weather.zip
A browser weather widget with missing error/loading handling and unsafe rendering.

## Usage

Use the **Try an example project** buttons on the QA Upload Project page, or choose any ZIP file directly to test:
- ZIP file parsing
- Code analysis
- Bug report generation
- AI-powered bug detection

## Creating Your Own Test Projects

To create additional test projects:
1. Create a new directory with your project structure
2. Add source code with intentional bugs or issues
3. Include a README.md explaining the project and known issues
4. ZIP the directory and place it here

## Quick Start

To seed the default users:
```bash
cd backend
.venv\Scripts\python.exe seed_users.py  # Windows
# or
.venv/bin/python seed_users.py           # Linux/Mac
```

This creates:
- QA user: qa@example.com / qa123
- Developer user: developer@example.com / developer123
