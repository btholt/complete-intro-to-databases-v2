---
description: >-
  Learn how to optimize Neo4j database performance using indexes with Brian
  Holt's Complete Intro to Databases v2. This tutorial covers creating indexes
  on Node properties, using EXPLAIN to analyze query performance, and improving
  database query efficiency for graph databases.
keywords:
  - neo4j
  - database
  - index
  - query performance
  - cypher
  - graph database
  - optimization
---

Just as with PostgreSQL and MongoDB, frequently having an index becomes very important to query performance for your "hot paths" for your database querying habits.

Let's say a new facet of our app is that people can find celebrities born the same year they are. Your query would look something like this.

```cql
MATCH (p:Person) WHERE p.born = 1967 RETURN p;
```

A fairly simple query but like we've seen before, this will look at every person on the graph to examine their birth year. Imagine you had all of IMDB's database; that query could wreck a system. Let's use EXPLAIN to see why.

```cql
EXPLAIN MATCH (p:Person) WHERE p.born = 1967 RETURN p;
```

You'll see it gives you a pretty in-depth answer that it will scan all 133 persons and then narrow it down to 13. Let's throw an index on Person's born attribute.

```cql
CREATE INDEX FOR (p:Person) ON (p.born);
EXPLAIN MATCH (p:Person) WHERE p.born = 1967 RETURN p;
MATCH (p:Person) WHERE p.born = 1967 RETURN p;
```

You should see the index being used. With only 133 nodes it'd be hard to perceive a performance increase but on a large list it would likely be significant.

[Neo4j has a great article on query planning][query-planning] if you want to dig further into improving query performance.

Lastly, sometimes it's useful to see all existing indexes. Try this:

```cql
SHOW INDEXES;
```

[query-planning]: https://neo4j.com/docs/cypher-manual/25/planning-and-tuning/query-tuning/
