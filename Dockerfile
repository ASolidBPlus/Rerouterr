# Use an Alpine-based Node.js image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Install dependencies
# Copy package.json and package-lock.json to utilize Docker cache
COPY package*.json ./
RUN npm install --production  # Install only production dependencies

# Copy the rest of the application code
COPY . .

# Expose port 7777 to the outside once the container has launched
EXPOSE 7777

# Define /config as a mount point
VOLUME /config

# Command to run the application
CMD ["node", "index.js", "/config/config.yaml"]
