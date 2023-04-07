FROM node:16.17.1-alpine3.16 as build
WORKDIR /usr/app
COPY . /usr/app

# Switch for SaaS or Standalone build
ENV VITE_IS_SAAS_BUILD=false

# Essential vars

# Standalone build mandatory vars
ENV VITE_BASE_URL=https://api.clustercat.com

# SaaS build mandatory vars
ENV VITE_ACCOUNT_DASHBOARD_LOGIN_URL=https://dashboard.philip.clustercat.com

# EE customisations
ENV VITE_TENANT_LOGO=
ENV VITE_TENANT_NAME=

# Other vars
ENV VITE_NETCLIENT_WINDOWS_DOWNLOAD_URL=https://fileserver.netmaker.org/latest/windows/netclient_x86.msi
ENV VITE_NETCLIENT_MAC_DOWNLOAD_URL=https://fileserver.netmaker.org/latest/darwin/Netclient.pkg

RUN npm ci
RUN npm run build

# final image
FROM nginx:1.23.1-alpine
EXPOSE 80
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/app/dist /usr/share/nginx/html
