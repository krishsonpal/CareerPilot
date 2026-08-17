FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json .
RUN npm install --omit=dev

# Copy source
COPY src/ ./src/
COPY .env.example ./.env.example

EXPOSE 3001

CMD ["node", "src/index.js"]
