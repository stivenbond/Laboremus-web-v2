FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install additional OS packages if necessary
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*
