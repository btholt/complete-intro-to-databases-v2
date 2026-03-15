---
title: "Neo4j Browser"
description: "An amazing tool that Neo4j provides dev is a built in browser that allows you run queries and visualize your graph"
---

Let's hop into their nice portal that Neo4j provides. Open [http://localhost:7474](http://localhost:7474) in a browser. When asked to authenticate just choose the drop down "no authentication." If you didn't provide the no auth option on startup, the default username and password is neo4j/neo4j.

This lets you run queries from the browser and see visualizations!

Click in the text area at the top (it has `$neo4j` as placeholder text) and then you can run queries there. Let's run a quick one to see everyone who acted in Scott Pilgrim vs the World.

```cql
MATCH (p:Person)-[:ACTED_IN]->(m:Movie)
WHERE m.title = "Scott Pilgrim vs the World"
RETURN p, m;
```

You get a nice little graph view of your nodes and relationships. You can also see everything as a table if that's better for your data.

Another very cool feature of the browser is it has some built in datasets that you can use to play around with the query features. They have a built in movie database so let's use that.

On the home page of the browser, you'll see a "Try Neo4j with the Movie Graph" button. Click that, click the "Next" button, then click the ▶️ button on the top of the first sample query at the top. This will run that query and give you the whole movie database.

If that isn't working for you, I've also [saved the query here][sample]. Copy/paste this into the query editor and run it. These are the same query, no need to do both.

[sample]: /sample-neo4j.cql
