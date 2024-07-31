<p align="center">
  <img style="width:50%;" src="src/assets/logo.png"><break/>
</p>

## v0.25.0

**For more information, visit the official documentation site: [docs.netmaker.io](https://docs.netmaker.io)**


## LICENSE

Netmaker UI's source code and all artifacts in this repository are freely available. All versions are published under the Server Side Public License (SSPL), version 1, which can be found under in [LICENSE.txt](LICENSE.txt).


## Contributing

We welcome contributions to Netmaker UI. Please see our [contributing guidelines](CONTRIBUTING.md) for more information.


### Development

#### Prerequisites

- [Node.js](https://nodejs.org/)


#### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:5173](http://localhost:5173) with your browser to see the result. The port might be different depending on your environment.


#### Building

1. Run the build script: `npm run build`
2. The build artifacts will be stored in the `dist/` directory.


#### Testing

This project uses Vitest to run unit tests.

1. Run the test script: `npm run test`


#### E2E Testing

This project uses Playwright to run end-to-end tests.

1. Install test dependencies: `npm run e2e:setup`
2. Run the e2e test script: `npm run test:e2e`
