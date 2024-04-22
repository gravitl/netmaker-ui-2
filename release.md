# Netmaker UI release notes

## Netmaker UI v0.24.1

## Whats New

- New OAuth users will now join a waiting list. Admins can approve or reject these users. This is to prevent unauthorized users from joining the server, improving security.
- Networks with over 50 hosts should now use NMCTL to manage ACLs. This is for better UX and also to circumvent performance issues.
- UI will now notify admins of any new version to the server. This is to help admins enjoy new features and fixes in subsequent releases.
- Instructions to add RAC mobile hosts to the network are now available in the UI. It can be accessed via the "Add new host" process.
- QR codes available for RAC mobile download. This is to make it easier for users to download the RAC mobile app by scanning.

## What's Fixed/Improvements

- Fixed bug with egress creation.
- Automatically update server tier status; whether CE or Pro.
- Host search now inlcudes name, IP address, ID and others.
- Performance improvements with large networks. Especially with the ACLs page.
- Minor UI/UX bug fixes and improvements

## Known issues

- Graph page crashed when WebGL is not enabled. WebGL is required for the graph page to work.
