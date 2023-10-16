# Netmaker UI release notes

## Netmaker UI v0.21.1

## Whats New
- Generic DNS support; DNS aliases no longer need to end in the host's network name
- Persistent Keepalive property has been moved to global host settings
- Host netclient version can now be upgraded from the UI

## What's Fixed/Improvements
- Reloading the page breaks the UI
- Pro UI customsations loading on a CE server
- Not able to force delete a zombie node (pending delete)
- Metrics page getting crumbled when there's a lot of hosts
- Show relevant enrollment keys when adding a new host from network page
- Networks tab in sidebar getting expanded when a different page is opened

## Known Issues
- Graph page crashed when WebGL is not enabled. WebGL is required for the graph page to work.
