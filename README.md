# CompanyInsight

**Deployed site**:

## Overview

    CompanyInsights is a tool that allows users to research and view finacial data associated with companies, such as stock prices, trading status, and more. The tool is intended to be used by financial analysts and other professionals who need to research and analyze company data.

## Links

**Project Plan**: [doc]<https://docs.google.com/document/d/15rwUIoVR1oY_xlnUEMSVxcbv79kGLldLMp3ayuju8No/edit?tab=t.0>

**Wireframes**: [here]<add a link to wire frames>
<img src="OR_INSERT_INLINE_YOUR_WIREFRAME_IMAGE_URL" width=600>

## Demo Video

[TBD](<insert link in Week 9!>)


## How to run:


Install Docker Compose

Create an .env file like this:
# Database Configuration
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
DATABASE_PORT=
DATABASE_URL=

# Redis Configuration
REDIS_HOST=
REDIS_PORT=

# WebSocket Configuration
WEBSOCKET_HOST=
WEBSOCKET_PORT=
VITE_TRENDING_COMPANIES_WEBSOCKET_PORT=

VITE_FINNHUB_API_KEY=
VITE_ALPHA_VANTAGE_API_KEY=
VITE_POLYGON_API_KEY=

# Email Configuration
VITE_CI_EMAIL_ADDRESS=
VITE_CI_EMAIL_APP_PASS=

# Service Ports
PORT=3001
VITE_PYTHON_SERVER_PORT=8082
SERVER_PORT=8888

# Service URLs
VITE_SERVER_ADDRESS=
VITE_FLASK_ADDRESS=
VITE_WEBSOCKET_SERVER_ADDRESS=


Run docker compose up.
