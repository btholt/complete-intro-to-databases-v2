---
description: "Indexes are critical to a well functional relational database. Brian explains how to investigate query performance and how to create an index to solve that problem."
---

Databases are honestly marvels of technology. I remember in my computer science program I had to write one and it could barely run the rudimentary queries it needed to pass the class. These databases are powering everything around you and munging through petabytes of data at scale.

Frequently these databases can accommodate queries without any sort of additional configuration; out of the box they're very fast and flexible. However sometimes you'll run into performance issues for various reasons. The queries will either be very slow, will cause a lot of load on the server, make the server run unreliably, or even all of the above. In these cases **indexes** can help you.

Indexes are a separate data structure that a database maintains so that it can find things quickly. The tradeoff here is that indexes can cause inserts, updates, and deletes to be a bit slower because they also have to update indexes, and they take up more room on disk. But in exchange you get very fast queries as well as some other neat properties we'll explore like enforcing unique keys.

## EXPLAIN

Let's start by saying I'm definitely not a DBA—a database admin or database architect depending on who you ask. There are people whose entire jobs are doing things like this: knowing how to optimize databases to fit use cases. Instead, I'm going to walk you through a few use cases and show you the tools I know to probe for better solutions. From there it's best to work with people who have deep knowledge of what you're trying to do.

Consider this fairly common query for a message board—grab all the comments for a particular board:

```sql
SELECT comment_id, user_id, time, LEFT(comment, 20) FROM comments WHERE board_id = 39 ORDER BY time DESC LIMIT 40;
```

Pretty simple. However this query does a really dastardly thing: it will actually cause the database to look at **every single record** in the table. For us toying around on our computer this isn't a big deal, but if you're running this a lot in production it's going to be very expensive and fragile. In this case, it'd be much more helpful if there was an index to help us.

Let's see what PostgreSQL does under the hood by adding `EXPLAIN` in front of it:

```sql
EXPLAIN SELECT comment_id, user_id, time, LEFT(comment, 20) FROM comments WHERE board_id = 39 ORDER BY time DESC LIMIT 40;
```

This part should break your heart: `Seq Scan on comments`. This means it's looking at every comment in the table to find the answer—a linear search, O(n). Not good! Let's build an index to make this work a lot better.

## Create an Index

```sql
CREATE INDEX ON comments (board_id);
```

Now let's run that EXPLAIN again:

```sql
EXPLAIN SELECT comment_id, user_id, time, LEFT(comment, 20) FROM comments WHERE board_id = 39 ORDER BY time DESC LIMIT 40;
```

You'll see it now does a `Bitmap Heap Scan` instead of a Seq Scan. Much better! PostgreSQL is now using our index to jump directly to the rows it needs instead of scanning the entire table.

You can see all indexes on a table with:

```sql
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'comments';
```

## Compound Indexes

If you are frequently using two keys together—like `board_id` and `time` for example—you could consider using a compound index. This will make an index of those two things together. In the specific case that you are querying with those things together it will perform better than two separate indexes. Since this isn't meant to be an in-depth treatise on indexes, I'll let you explore that when you need it.

```sql
CREATE INDEX ON comments (board_id, time);
```

## Unique Indexes

Frequently you want to enforce uniqueness on one of the fields in your database. A good example is that a username in your user database should be unique—a user should not be able to sign up with a username that already exists.

```sql
CREATE UNIQUE INDEX username_idx ON users (username);
```

The `username_idx` is just a name for the index. You can call it whatever you want.

Now try inserting a duplicate username:

```sql
INSERT INTO users (username, email, full_name, created_on) VALUES ('aaizikovj', 'lol@example.com', 'Brian Holt', NOW());
```

This will fail because that username already exists. As a bonus, this field is now indexed so you can quickly search by username.

## Full Text Search

Frequently something you want to do is called "full text search." This is similar to what happens when you search Google for something: you want it to drop "stop words" (things like a, the, and, etc.) and you want it to fuzzy match things.

PostgreSQL has built-in full text search capabilities. Let's say we want to search comments for specific words:

```sql
SELECT comment_id, LEFT(comment, 50) 
FROM comments 
WHERE to_tsvector('english', comment) @@ to_tsquery('english', 'love');
```

- `to_tsvector` converts text into a searchable vector of lexemes (normalized words)
- `to_tsquery` converts your search term into a query
- `@@` is the "matches" operator

This works, but it's slow because PostgreSQL has to compute the tsvector for every row. Let's add an index:

```sql
CREATE INDEX comments_search_idx ON comments USING GIN (to_tsvector('english', comment));
```

GIN (Generalized Inverted Index) is the index type designed for full text search. Now that query will be much faster.

You can do more complex searches too:

```sql
-- Search for comments containing "love" AND "dog"
SELECT comment_id, LEFT(comment, 50) 
FROM comments 
WHERE to_tsvector('english', comment) @@ to_tsquery('english', 'love & dog');

-- Search for "love" OR "hate"
SELECT comment_id, LEFT(comment, 50) 
FROM comments 
WHERE to_tsvector('english', comment) @@ to_tsquery('english', 'love | hate');
```

For serious search workloads—like powering an e-commerce search with faceted filtering, typo tolerance, and relevance tuning—you'd typically graduate to a dedicated search engine like Elasticsearch. But for many applications, PostgreSQL's built-in full text search is plenty powerful.

PostgreSQL has [more types of indexes][indexes] worth exploring as your needs grow.

I cover this a lot more in depth in my Postgres class, [see here][sql-intro]

[indexes]: https://www.postgresql.org/docs/current/indexes.html
[sql-intro]: https://sql.holt.courses/lessons/query-performance/explain