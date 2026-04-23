---
description: >-
  Learn Neo4j graph database queries with practical examples including shortest
  path algorithms, relationship traversal, and solving the Six Degrees of Kevin
  Bacon problem using Cypher query language in Brian Holt's Complete Intro to
  Databases v2.
keywords:
  - neo4j
  - cypher
  - graph database
  - shortest path
  - kevin bacon
  - database queries
  - neo4j tutorial
---

This section assumes you've inserted all the people and movies from the previous section. If not, [run this query][sample] to get all the data.

Let's do some queries to familiarize ourselves with the data.

```cql
MATCH (n) RETURN distinct labels(n), count(*);
```

This will query the database for all nodes (which is the `(n)` part, notice no label) and then it uses the builtin `labels()` function to get all the labels, and then counts those with `count(*)` function.

```cql
MATCH (n)-[r]->() RETURN type(r), count(*);
```

Similar to above, we are now counting how many relationships we have in a database.

Okay, so let's pick an actor and find out what other people they've been in movies with. I'll pick Keanu Reeves here.

```cql
MATCH (Keanu:Person)-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(Costar:Person)
WHERE Keanu.name = "Keanu Reeves"
RETURN DISTINCT Costar.name, count(*)
ORDER BY count(*) DESC, Costar.name;
```

- We've seen similar queries before as far as the MATCH goes.
- Similar to above we're using a DISTINCT clause and then using `count(*)` to aggregate how many movies Keanu appeared in these movies with these people in.
- ORDER BY should look familiar as it works very similar to PostgreSQL. I gave it two fields to order by so it'll order first by quantity of films they're in together then alphabetical by name.

If you're using the browser and you want to see a pretty graph, try this:

```cql
MATCH (Keanu:Person)-[:ACTED_IN]->(m:Movie)<-[r:ACTED_IN]-(Costar:Person)
WHERE Keanu.name = "Keanu Reeves"
RETURN Costar, m, Keanu, r;
```

If you want the nice graphics you need to return whole nodes and not just fields.

## Degrees of Kevin Bacon

So the whole point of this dataset is to solve the [Six Degrees of Kevin Bacon][bacon] problem i.e. every actor and actress in Hollywood can be connected Kevin Bacon via them having acted in a film that acted in a film with him directly, with someone who was in a film with Kevin Bacon, or with someone who acted in a film with someone who was in a film with Kevin Bacon, and so-on-and-so-forth up to six degrees of separation.

So let's see how you could solve that problem with our dataset. Let's see how close Keanu is. (run this in the browser)

```cql
MATCH path = shortestPath(
  (Bacon:Person {name:"Kevin Bacon"})-[*]-(Keanu:Person {name:"Keanu Reeves"})
)
RETURN path;
```

- `shortestPath` is a function that will find the shortest path between two nodes by looking at their relationships.
- The variable `path` ends up being a path type. It contains all the information for a whole path within your grasp.
- You can run this in cypher-shell but it'll give you a lot of data back.

For something more friendly to see in cypher-shell, just look at the length

```cql
MATCH path = shortestPath(
  (Bacon:Person {name:"Kevin Bacon"})-[*]-(Keanu:Person {name:"Keanu Reeves"})
)
RETURN length(path);
```

> You may see it complain about it being unbounded. In theory if the path was very long it could take a long time to run it as it explored your graph. It wants you to give it a max number of nodes to jump so that if it doesn't find it within X levels, it will give up. That would look like: `(Bacon:Person {name:"Kevin Bacon"})-[*..5]-(Keanu:Person {name:"Keanu Reeves"})` where the `*..5` is the important part. This tells it to give up if it's not within 5 nodes.

To unwind this in a way that would be readable in cypher-shell with all the movies and actors/actresses you could do this:

```cql
MATCH path = shortestPath(
    (First:Person {name:"Kevin Bacon"})-[*..5]-(Second:Person {name:"Keanu Reeves"})
)
UNWIND nodes(path) AS node
RETURN coalesce(node.name, node.title) AS text;
```

- UNWIND takes something that's a list and expands it into individual nodes. With `nodes(path)` we're getting all the nodes out (which will be Persons and Movies).
- `coalesce` is necessary because Persons have names and Movies have titles. This will take the first thing in there that's not null.
- We use AS here to make these things easier to refer to later (both `node` and `text`)

## Find Degrees in a Network

You could imagine if this was a recommendation engine, you may want to recommend people other actors based on movies people have appeared in together. What if we wanted to take that two degrees out?

```cql
MATCH (Halle:Person)-[:ACTED_IN*1..4]-(Recommendation:Person)
WHERE Halle.name = "Halle Berry"
RETURN DISTINCT Recommendation.name
ORDER BY Recommendation.name;
```

This will give you that extended network of people to check out. If you wanted to include directors and writers in that count, just omit the `:ACTED_IN` so it's `-[*1..4]-` and that will give you any relationship.

[sample]: /sample-neo4j.cql
[bacon]: https://en.wikipedia.org/wiki/Six_Degrees_of_Kevin_Bacon
