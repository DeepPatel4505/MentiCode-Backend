// src/core/schema/index.js
export default {
  ...require("./detect.schema").default,
  ...require("./validate.schema").default,
  ...require("./explain.schema"),
  ...require("./final.schema"),
};
