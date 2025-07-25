# CompanyInsight

**Deployed site**:

## Overview

    CompanyInsights is a tool that allows users to research and view finacial data associated with companies, such as stock prices, trading status, and more. The tool is intended to be used by financial analysts and other professionals who need to research and analyze company data.

## Links

**Project Plan**: [doc]<https://docs.google.com/document/d/15rwUIoVR1oY_xlnUEMSVxcbv79kGLldLMp3ayuju8No/edit?tab=t.0>


## Demo Video

[TBD](https://www.loom.com/share/de30b34140384a8d95e84d1cc6db66f9)


## How to run:

### Prerequisites

1. **Git LFS**: This project uses Git Large File Storage (LFS) for managing large files like PostgreSQL data dumps and model weights.
   ```bash
   # Install Git LFS
   brew install git-lfs  # macOS with Homebrew
   # or
   apt-get install git-lfs  # Ubuntu/Debian
   # or
   yum install git-lfs  # CentOS/RHEL

   # Initialize Git LFS
   git lfs install
   ```

2. **Docker and Docker Compose**: Required to run the application containers.
   ```bash
   # Install Docker Desktop (includes Docker Compose) from:
   # https://www.docker.com/products/docker-desktop
   ```

### Clone the Repository

```bash
git clone https://github.com/yourusername/CompanyInsight.git
cd CompanyInsight
git lfs pull
```

### Configuration

Create an .env file in the project root with the following variables:

POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
DATABASE_PORT=
DATABASE_URL=
REDIS_HOST=
REDIS_PORT=
WEBSOCKET_HOST=
NODEJS_WEBSOCKET_PORT=
TRENDING_COMPANIES_WEBSOCKET_PORT=
VITE_FINNHUB_API_KEY=
VITE_ALPHA_VANTAGE_API_KEY=
VITE_POLYGON_API_KEY=

VITE_CI_EMAIL_ADDRESS=
VITE_CI_EMAIL_APP_PASS=

# Service Ports
NODEJS_SERVER_PORT=3001
FLASK_SERVER_PORT=8082
MACHINE_LEARNING_SERVER_PORT=8888

# Service URLs
VITE_SERVER_ADDRESS=
VITE_FLASK_ADDRESS=
VITE_WEBSOCKET_SERVER_ADDRESS=

### Running the Application

```bash
# Start all services using Docker Compose
docker compose up
```

This will start the following services:
- PostgreSQL database with pre-loaded data
- Redis for caching and pub/sub
- Node.js backend server
- React frontend client
- Python machine learning services

The application will be available at http://localhost:3000

### Working with Large Files

This project uses Git LFS to track the following file types:
- PostgreSQL data dumps (*.sql, *.dump, *.bak, *.gz)
- Model weights (*.pt)
- Dataset files (*.csv, *.parquet)

When you pull changes from the repository, Git LFS will automatically download these large files.
