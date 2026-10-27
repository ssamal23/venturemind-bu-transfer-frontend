# Builds the React app, then serves it with nginx. nginx also forwards /api to the backend,
# so the browser only ever talks to one address and the backend needs no public address.
#
# Build:  docker build -t bu-web .        or, with no local Docker:  az acr build ...  (see docs/deployment.md)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_API_BASE defaults to /api, which the nginx below forwards. Nothing secret is built in.
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
# Files in /etc/nginx/templates are filled in with environment variables when the container starts.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# Where /api requests go. In Azure Container Apps this is the API app's internal address.
ENV API_UPSTREAM=http://bu-api
EXPOSE 8080
