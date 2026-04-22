# ──────────────────────────────────────────────────────────────
#  Daraz Clone — Dockerfile
#  Student: FA23-BCS-037
#  Base Image: node:18-alpine  (minimal Node.js image ~120 MB)
# ──────────────────────────────────────────────────────────────

# Best Practice 1 — Use a minimal Alpine-based Node.js image to reduce image size.
FROM node:18-alpine

# Set a clear working directory inside the container.
WORKDIR /app

# Best Practice 2 — Copy package files FIRST before source code.
# Docker caches this layer; npm install only re-runs when package.json changes,
# not on every code change — significantly faster rebuilds.
COPY package*.json ./

# Install only production dependencies (skip devDependencies).
RUN npm install --production

# Copy the rest of the application source files.
# .dockerignore excludes node_modules, .git, *.md, k8s-*.yaml from the context.
COPY . .

# Expose the port the Express server listens on.
EXPOSE 3000

# Start the Node.js backend server.
CMD ["node", "server.js"]
