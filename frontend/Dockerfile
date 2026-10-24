FROM node:22-alpine AS build
WORKDIR /app

# Trust the corporate TLS-inspection root CA so npm can reach the registry

#COPY certs/zscaler-root.crt /usr/local/share/ca-certificates/zscaler-root.crt
#ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/zscaler-root.crt

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://api:8080
EXPOSE 3000
