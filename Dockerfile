FROM node:16.17.1-alpine3.16 as build
WORKDIR /usr/app
COPY . /usr/app

# env vars
ENV VITE_IS_SAAS_BUILD=false
ENV VITE_BASE_URL=https://api.clustercat.com
ENV VITE_ACCOUNT_DASHBOARD_LOGIN_URL=https://dashboard.philip.clustercat.com
ENV VITE_TENANT_LOGO=
ENV VITE_TENANT_NAME=

RUN npm ci
RUN npm run build

# final image
FROM nginx:1.23.1-alpine
EXPOSE 80
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/app/dist /usr/share/nginx/html
