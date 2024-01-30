[![npm version](https://badge.fury.io/js/circular-dependency-plugin-async.svg)](https://badge.fury.io/js/circular-dependency-plugin-async)

## Circular Dependency Plugin Async

Detect modules with circular dependencies asynchronously when bundling with webpack.

### Basic Usage

[!IMPORTANT]  
Async mode doesn't fail the webpack build so if you want your build fail during production build set `isAsync: false`


```js
// webpack.config.js
const CircularDependencyPluginAsync = require("circular-dependency-plugin-async");

module.exports = {
  plugins: [
    new CircularDependencyPlugin({
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
