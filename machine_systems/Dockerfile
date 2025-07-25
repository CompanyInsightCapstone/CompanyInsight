FROM python:3
WORKDIR /usr/src/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY machine_systems/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r ./requirements.txt

# Create .kaggle directory for credentials
RUN mkdir -p /root/.kaggle

# Copy application code
COPY machine_systems .

# Use MACHINE_LEARNING_SERVER_PORT environment variable at runtime
EXPOSE 8888

# Start the application
CMD [ "python", "./app.py" ]
