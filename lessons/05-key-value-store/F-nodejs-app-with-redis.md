---
title: "Node.js App with Redis"
description: "Take the learnings from how to use Redis as a key-value store and cache from the command line to code! Brian whips up two examples of how and why you'd want to use Redis with Node.js."
---

Let's quickly write up a Node.js project to help you transfer your skills from the command line to the coding world.

[You can access all samples for this project here][samples].

Make a new directory. In that directory run:

```bash
npm init -y
npm pkg set type=module
npm i express redis@5.11.0 express@5.2.1
mkdir static
touch static/index.html server.js
code . # or open this folder in VS Code or whatever editor you want
```

Let's make a dumb frontend that just makes search queries against the backend. In static/index.html put:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redis Sample</title>
  </head>
  <body>
    <h1 id="visitors">…</h1>
    <script>
      async function registerPageView() {
        const res = await fetch("/pageview");
        const { views } = await res.json();
        document.getElementById("visitors").innerText = `${views} visitors!`;
      }
      registerPageView();
    </script>
  </body>
</html>
```

Then let's make a server.js. Put this in there:

```javascript
import express from "express";
import redis from "redis";
const client = redis.createClient(); // defaults to localhost:6379, but you can also change that here

async function init() {
  await client.connect();
  const app = express();

  app.get("/pageview", async (req, res) => {
    const views = await client.incr("pageviews");

    res.json({
      status: "ok",
      views,
    });
  });

  const PORT = process.env.PORT || 3000;
  app.use(express.static("./static"));
  app.listen(PORT);

  console.log(`running on http://localhost:${PORT}`);
}
init();
```

We wrote a pretty simple pageview counter, but you have the whole Redis ecosystem available via their SDK. This just shows you how to get started.

Okay, let's add one more caching function to our app. In server.js add this:

```javascript
// under the client = redis.createClient() line
function cache(key, ttl, slowFn) {
  return async function (...props) {
    const cachedResponse = await client.get(key);
    if (cachedResponse) {
      return cachedResponse;
    }
    const result = await slowFn(...props);
    await client.setEx(key, ttl, result);
    return result;
  };
}

async function verySlowAndExpensiveFunction() {
  // imagine this is like a really big join on PostgreSQL
  // or a call to an expensive API

  console.log("oh no an expensive call!");
  const p = new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Date().toUTCString());
    }, 5000);
  });

  return p;
}

const cachedFn = cache("expensive_call", 10, verySlowAndExpensiveFunction);

// inside init, under app.get pageviews
app.get("/get", async (req, res) => {
  const data = await cachedFn();

  res.json({
    data,
    status: "ok",
  });
});
```

Navigate to localhost:3000/get to try out the slow endpoint.

- This is a bit of a contrived example. Normally these would be separated among a bunch of files.
- Imagine our `verySlowAndExpensiveFunction` is something we're trying to call as infrequently as possible. In this case we're just having it wait and then resolve a promise, but imagine it was an expensive database query or a call to an expensive-to-call API endpoint.
- `cache` is a generic caching function. With this you could cache anything. All it does is take in a Redis key, how long to cache it, and some function to call when it doesn't find the item in the cache. It returns a function that makes it seamless to the call point: either it will immediately give you back what's in the cache or it will make you wait for the result of the `verySlowAndExpensiveFunction`.
- This definitely has thundering herd potential. What would be better is to have a second lock key that says "hey, we're already trying to calculate/retrieve this answer." Then you can either have the backend poll that key for an answer or you could return a 503 to the frontend and have a frontend that will poll until the 503 clears. Lots of ways to handle this.

There are lots of ways to use Redis in code and these are just two. In summary though, you will primarily use it for caching and non-mission-critical, high-throughput data like telemetry.

[samples]: https://github.com/btholt/db-v2-samples
