# Netmaker UI release notes

## Netmaker UI v0.26.0

## Whats New

- Tag Management System. Admins can now tag devices on their networks, enabling clustered management.
- Revamped ACLs. Access Control now supports more advanced features like allowing traffic between specific users and tagged device groups.
- Simplified User management with sensible defaults for groups and roles (Network Roles has been hidden now)
- A small but fresh new look has been introduced to the UI. This will be a gradual change, and more updates will be coming soon.

## What's Fixed/Improvements

- Added descriptions to user management tabs and some Network tabs for better UX.
- Ephemeral ghost rows in Network Nodes tab has been resolved.
- Tenant ID/server IP now shows in the UI sidebar. This is to help users connecting with RAC.
- CPU usage is unnecessarily high when a network is opened.
- "Global Hosts" have been renamed to "Devices" for better clarity.
- Inacurate device metrics
- Minor UI/UX bug fixes and improvements

## Known issues

- Graph page crashed when WebGL is not enabled. WebGL is required for the graph page to work.
