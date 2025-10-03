# Use a slim Node.js image for better performance and smaller size
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app


COPY package*.json ./

RUN npm install

# Copy the rest of your application code
COPY . .

EXPOSE 3001

# Command to run your application
CMD ["node", "index2.js"]