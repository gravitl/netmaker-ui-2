# Netmaker UI release notes

## Netmaker UI v0.24.2

## Whats New

- Usecase-based guided tour for new users. This is to help new users get started with Netmaker UI. (from v0.24.0 hotfix)
- Users can now set additional endpoints for a Remote Acess Gateway (RAG). This is to enable remote clients to react a Netmaker network through multiple IP addresses an RAG supports. They then get the option to choose which endpoint to connect to with our Remote Access Client (RAC)
- Less strict IP address validation for network creation. Users can now use any valid IP address for their Netmaker networks. This is to allow some reserved public IP ranges to be used.
- Sign in with OAuth/OIDC is now a Pro feature. Upgrade your Netmaker server to enjoy this feature.

## What's Fixed/Improvements

- Pure IPv6 network UI/UX fixes.
- Fix bug with restarting a faulty server.
- Fix broken version upgrade feature, due to changes on Github.
- Reactivity fixes on user management: transfering superadmin priviledges.
- RAC linux download link now points to docs. Using a package manager (`apt`/`rpm`) is the recommended way to install RAC on linux.
- Minor UI/UX bug fixes and improvements

## Known issues

- Graph page crashed when WebGL is not enabled. WebGL is required for the graph page to work.
