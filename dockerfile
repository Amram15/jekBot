# Use Node.js
FROM node:latest

WORKDIR /app

# Install Packages
COPY package*.json ./
RUN npm ci

# Build the bot 
COPY . .
RUN npm run build

# Start the bot
CMD ["npm", "start"]