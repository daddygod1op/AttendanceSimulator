# Official Microsoft Playwright Jammy Base Image
# Pre-packaged with Chromium, Node.js, and all required Linux graphic/font libraries
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copy package definitions for client, server, and root
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies cleanly
RUN cd client && npm install
RUN cd server && npm install
RUN npm install

# Copy source tree
COPY . .

# Build the client production assets
RUN cd client && npm run build

# Expose Render container port
EXPOSE 10000

# Run unified express server
CMD ["node", "server/server.js"]
