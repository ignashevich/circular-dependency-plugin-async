## Circular Dependency Plugin Async

Detect modules with circular dependencies asynchronously when bundling with webpack.

### Basic Usage

```js
// webpack.config.js
const CircularDependencyPluginAsync = require("circular-dependency-plugin-async");

module.exports = {
  entry: "./src/index",
  plugins: [
    new CircularDependencyPlugin({\
      // Path to the index file of your application
      indexFilePath: "./src/index.tsx",
      // Sync/async mode flag
      isAsync: true, // optional
      // Threshold for amount of circular dependecies to trigger the error
      threshold: 1, // optional
    }),
  ],
};
```
