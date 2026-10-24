# Etapa 1: Build de Vite / React
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# URL de la API que queda "pegada" en el JavaScript al compilar. Es relativa (/api) para que
# el navegador le hable al balanceador (mismo host y puerto que la página) y no a un nodo.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: Servidor Web Nginx (un nodo de frontend)
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
