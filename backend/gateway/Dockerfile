FROM node

WORKDIR /app

# Root dependencies
COPY package*.json ./
RUN npm ci install

# Gateway dependencies
COPY gateway/package*.json ./gateway/
RUN cd gateway && npm install

# Source
COPY gateway ./gateway
COPY shared ./shared

WORKDIR /app/gateway

EXPOSE 8000

CMD ["npm","start"]
