# Use the official Node.js 18 image from Docker Hub
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to work directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Define /config as a mount point
VOLUME /config

# Expose port 5001 to the outside once the container has launched
EXPOSE 5001

# Command to run the application
CMD ["node", "index.js", "/config/config.yaml"]
