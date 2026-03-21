---
description: >-
  Brian Holt explains key-value databases like Redis and Valkey in his Complete
  Intro to Databases v2 course, covering their use cases as caches, session
  storage, and analytics tools that complement primary databases like PostgreSQL
  and MongoDB.
keywords:
  - redis
  - key-value database
  - valkey
  - database caching
  - memcached
  - brian holt
  - database course
---

A key-value store is a very different beast than what we've been looking at so far. The first thing to realize is that very rarely (if ever) will a key-value store be your primary database. It will almost always be a supplementary tool to another database that you're using. There are examples of people _just_ using a key-value store so I can be proven wrong but I'll say that's a very advanced and unusual use case.

Key-value stores have a few characteristics that make them interesting. One of their biggest pluses is they tend to be very simple in terms of their APIs and capabilities. This is a feature in the sense they're easy to understand and easy to use. Due to their simple nature and simple operations, this makes them highly scalable and able to deal with extreme amounts of traffic (even more than our other databases) because they can't do complicated queries. Whereas you can send an SQL query to PostgreSQL to join multiple tables and aggregate them into fascinating insights, with a key-value store you're limited more-or-less to "write this to the database" and "read this from the database". They do a few more things but that's the gist.

I like to think of a key-value store as a giant JavaScript object. You can `store['my-key'] = 5` and then later you can come back later and ask for `store['key']` and get `5` back. Honestly that's 90% of the use case right there. You store a value under a key and then later you can ask for that value back. There are a few other operations you can do too and we'll get there, but that's the general idea.

## Use cases

Key-value stores are commonly used as caches. Imagine you have a very expensive PostgreSQL query that takes five seconds to run, is commonly needed by users, and rarely updates. If your app ran that five second query every single time a user needed to see that data it would bring down your servers (or at least be very expensive). Since it rarely updates what we could do is only run that query once a day and then store the result in Redis. Instead of your app running the query against PostgreSQL, it would read first from the key-value store. If it found it, it would use that instead. This is an extreme example of when to use caching but it can be a very useful mechanism for increasing app performance.

Another good use case is non-essential data that is frequently used but it would be okay if it went away. A really good example of that is storing session data for users browsing your site. If your entire cache dropped every user would log out. It's not ideal but it's not the end of the world either. We'll get into in a second but you normally don't want mission critical data in one of these key-value stores if it's the only source of truth.

Another good use case is analytics or telemetry. Most of these key-value stores are very good at quick arithmetic operations like increment, decrement, and other such number-modifying operations. So if you're counting page views on a high traffic site, a key-value is possibly a good place to put it.

There are plenty of other use cases and we'll do a few so you can see but keep an open mind. People do a lot of amazing things with key-value stores.

## Key-value stores to choose from

You have a few options to choose from but I'll highlight a few quick ones for you.

### PostgreSQL hstore and JSONB

I just wanted to highlight that Postgres can indeed mimic the API of Redis. It has an older feature called hstore that works very similar to the set/get API of Redis but honestly no one really uses it anymore; they use JSONB as you can use it the same way and it's far more widely used now. In any case, you'd really only use Postgres like this in really lightweight ways. Generally you're using Redis to reduce load on your Postgres server, so you'd only use JSONB or hstore like this if you wanted the simpler API. But I do love highlighting how much Postgres can do!

### Memcached

One of the oldest key-value store databases still heavily in use. Like SQLite, its strength is its simplicity. Unlike all the other databases we've talked about, it does not have built-in replication logic, it doesn't have a ton of features, and it won't even write to disk! Everything in Memcached is always kept in memory and if it runs out of memory it just starts evicting old stuff out of the store. Memcached is perfect for sessions and caching for data that is accessed a lot but it's not the end of the world if it gets evicted since if your server shuts down it will lose everything. Very high performance but has its downsides.

Memcached only stores strings. You can put anything in the strings but it doesn't do any validation whatsoever. People will frequently store JSON objects stringified to get other data types into it.

### Redis

This is the tool we'll be focusing on and one I've used a lot in my career. Redis stands for **re**mote **di**ctionary **s**erver. It has many similar facets that Memcached does but it's more feature-rich product. It can do multiple servers (called clusters), has multiple data types, will actually write your cache to disk so it can restore state after a server restarts, and lots of other features. It's meant to be a bit less volatile than Memcached but still be aware you don't get the same sort of data guarantees that get with a database like MongoDB or PostgreSQL.

### Valkey

In 2024, Redis changed its license from open source to a more restrictive dual-license model. In response, the Linux Foundation forked Redis and created Valkey (**Val**ue **Key**, or key value), which continues under the original open-source license. Valkey is API-compatible with Redis — same commands, same protocol, same client libraries. If you're starting a new project and care about open-source licensing, Valkey is worth looking at. Everything we're about to learn applies to both.
