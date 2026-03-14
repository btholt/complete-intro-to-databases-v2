---
description: "When querying against MongoDB, query performance can be very important. Brian shows you how to think about indexing a MongoDB database to improve performance and capabilities."
---

This works very similarly to how it works in PostgreSQL so we're going to breeze over this pretty quickly.

## Explain

Just like PostgreSQL's `EXPLAIN`, MongoDB has an `explain()` method. Let's look at a simple query:

```javascript
db.pets.find({ name: "Fido" });
```

This query does a dastardly thing: it looks at **every single record** in the database. Let's see what explain tells us:

```javascript
db.pets.find({ name: "Fido" }).explain("executionStats");
```

The two things to notice here are the strategy it used and how many records it examined. In this case it looks at _every_ record in our database and it used a `COLLSCAN` strategy—the same as a sequential scan in PostgreSQL. Not good! Let's build an index.

## Create an Index

```javascript
db.pets.createIndex({ name: 1 });
db.pets.find({ name: "Fido" }).explain("executionStats");
db.pets.find({ name: "Fido" }).count();
db.pets.getIndexes();
```

Notice it went faster—in my case about 300%. The number of records examined now matches the count. You can always inspect what indexes exist using `getIndexes()`.

## Compound Indexes

If you are frequently using two keys together, like type and breed, you could consider using a compound index. This will make an index of those two things together. In the specific case that you are querying with those things together it will perform better than two separate indexes.

```javascript
db.pets.createIndex({ type: 1, breed: 1 });
```

## Unique Indexes

Just like in PostgreSQL, you can enforce uniqueness with an index:

```javascript
db.pets.createIndex({ index: 1 }, { unique: true });
```

If you get a duplicate key error, you'll need to remove the duplicate first and try again. Once indexed, this will fail:

```javascript
db.pets.insertOne({ name: "Doggo", index: 10 });
```

Because `index: 10` already exists. As a bonus, the field is now indexed so queries against it are fast:

```javascript
db.pets.find({ index: 1337 }).explain("executionStats");
```

Notice it only examines one record!

## Text Index

MongoDB has built-in full text search, similar to PostgreSQL's `tsvector`/`tsquery` (which we didn't do, but we talked about when we did vector search). You create a text index on the fields you want to search:

```javascript
db.pets.createIndex({
  type: "text",
  breed: "text",
  name: "text",
});
```

Each collection can only have one text index, so make sure you're indexing all the fields you want.

Now search using the `$text` operator:

```javascript
db.pets.find({ $text: { $search: "dog Havanese Luna" } });
```

This does an "any" match but doesn't sort by relevance. To get the most accurate matches first:

```javascript
db.pets
  .find({ $text: { $search: "dog Havanese Luna" } })
  .sort({ score: { $meta: "textScore" } });
```

To see the actual scores:

```javascript
db.pets
  .find(
    { $text: { $search: "dog Havanese Luna" } },
    { score: { $meta: "textScore" } }
  )
  .sort({ score: { $meta: "textScore" } });
```

The `""` and `-` operators work here too. To search for all Lunas that are not cats:

```javascript
db.pets
  .find({ $text: { $search: '-cat Luna' } })
  .sort({ score: { $meta: "textScore" } });
```

There's more to the `$text` operator which I'll leave you to [explore in the docs][text].

Vector search is also possible with MongoDB - [see documentation here][vector] if you want to learn more.

[text]: https://docs.mongodb.com/manual/reference/operator/query/text/
[vector]: https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/