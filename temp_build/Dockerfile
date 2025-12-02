FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
CMD ["sh", "-c", "npm ci && npm run build"]