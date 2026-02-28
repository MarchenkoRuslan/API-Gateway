import '../utils/env-config'; // Must run first so process.env is populated before Symbol SDK loads

const URL = process.env.URL;
if (!URL || typeof URL !== 'string' || !URL.trim()) {
  throw new Error(
    'URL environment variable is required (Symbol REST node, e.g. https://sym-test-01.opening-line.jp:3001). ' +
    'Set it in Railway Variables or .env.'
  );
}

import app from "./app";

app.listen(process.env.PORT || 4000, () => {
  console.log("listening on port " + (process.env.PORT || 4000));
});