# Netmaker UI release notes

## Netmaker UI v0.23.0

## Whats New

- Revamped Internet Gateways: hosts and clients can now use internet gateways! More info [here](https://docs.netmaker.io/pro/internet-gateways.html)
  On community edition, internet gateways for clients can be accessed via the Remote Access tab.
- Metadata field for ingress nodes
- Post up and post down script field for ext clients.
- Remote access client setup modal.
- Product tours.

## What's Fixed/Improvements

- Client name validation should not allow spaces
- Wrap url with `encodeUriComponent()`
- Fixed bug with client id not being optional.
- Minor UI/UX bug fixes and improvements

## Known issues

- Graph page crashed when WebGL is not enabled. WebGL is required for the graph page to work.
