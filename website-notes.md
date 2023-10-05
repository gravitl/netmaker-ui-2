## Notes on Netmaker website (https://netmaker.io)

### How latest Netmaker release is determined and automatically updated on website

The website has a JS script that fetches the latest release from GitHub (https://github.com/gravitl/netmaker/releases)
via a CORS proxy running at https://cors-proxy.netmaker.io. The proxy is a simple Node.js app running with PM2 and Nginx
that uses the cors-anywhere package (https://github.com/Rob--W/cors-anywhere) to add CORS headers to the response from GitHub.
The proxy is running on Netmaker infrastructure.
