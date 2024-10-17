const path = require("path");

module.exports = {
  mode: "production",
  target: "node",
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    path: path.join(__dirname, "bundle"),
    filename: "wat.js",
  },
  optimization: {
    minimize: true,
  },
};
