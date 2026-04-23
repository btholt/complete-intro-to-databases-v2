---
description: >-
  Learn vector search and RAG (retrieval-augmented generation) with Postgres
  pgvector. Brian Holt demonstrates how to implement semantic search using
  embeddings from OpenAI or Ollama for database-powered AI applications with
  practical examples.
keywords:
  - vector search
  - RAG
  - pgvector
  - postgres embeddings
  - semantic search
  - ollama
  - openai embeddings
---
Let's talk about vector search, which is most frequently used with a technique called RAG (retrieval-augmented generation). At its most simple, RAG is the idea that you have a database full of useful context for LLMs. 

Let's say you run an outdoor equipment retailer and a user asks for gloves are that good in warmer, spring skiing. You have a database full of descriptions of gloves. Before you ask your LLM for recommendation, you query your database with their search string and feed that as context into the LLM so it already has a list of products that are related to their query, giving it all the context it needs to make an informed recommendation based on actual products you have.

Let's say you're building a customer support bot and you have a database full of accepted solutions. You could use RAG to retrieve accepted solutions before asking the bot to solve the problem, giving it a leg-up assuming most support issues aren't the first time you've seen that issue.

This is called RAG, and you use something called vector search to achieve it. Vectors are just arrays of numbers. Your text gets turned into an array of numbers that represent similarity and distance relative to other dimensions in your database. 

These vectors are not human readable or understandable. You send your text to an embedding model (specialized LLMs that do only this) and it returns to you a set of vectors that you store in your vector search database.

The result is pretty cool because it clusters words, topics, and concepts together. It means things like "pushing to prod on Friday is such a nightmare" and "weekend deployment downtime is causing me such anxiety" would likely surface together in a search as they're related, even though they don't share keywords. That's the power of vector search.

Vector search can be useful outside of RAG, but it's mostly where you'll see it. For things like full-text search, there are other tools like Elasticsearch that are most optimized for that.

We used to need specialized databases like [Pinecone][pinecone] to be able to do this, but then things like [pgvector][pgvector] came around that do it and it all lives in your Postgres and it eliminated most of the need for specialized tools like Pinecone.

## Let's do it

We're going to be adding RAG retrieval to our comments table so we can find similar comments based on vectors.

You have a couple of options on how you do the vector embeddings. The process is that you used a specialized LLM model that is only useful for encoding embeddings. I'll give you two ways of doing it: via API call to OpenAI or via a local LLM via Ollama using nomic-embed-text. Again, it doesn't matter which one you use, you just need to use _the same_ one consistently. [VoyageAI][voyageai] is an option as well and it's the one Anthropic recommends.

If you have a laptop that can handle running a small LLM and Ollama, I recommend following the nomic-embed-text. Otherwise using OpenAI, OpenRouter, or VoyagerAI API calls will work just fine.

Once you have Ollama installed, run this from your CLI

```bash
ollama pull nomic-embed-text

curl http://localhost:11434/api/embed \
  -d '{
    "model": "nomic-embed-text",
    "input": "Never push to prod on a Friday"
  }'
```

I got something that looks like this:

```json
{"model":"nomic-embed-text","embeddings":[[0.009210397,0.043993976,-0.14392269,-0.0077514267,0.061490994,-0.004973118,0.009365671,0.007229709,-0.018027218,-0.046408247,0.009731809,0.07082095,0.0038592147,0.02665532,0.062885955,0.003577928,0.04486645,-0.08607875,0.014982383,0.02072975,0.011557674,-0.06717606,-0.069490105,-0.0026118876,0.11706118,0.026608134,0.024565192,-0.0070613204,-0.036495667, <a lot more numbers>]],"total_duration":573477125,"load_duration":427736542,"prompt_eval_count":10}
```

As you can see, it's just numbers, never meant to be something for you to read. If you're doing this with OpenAI, your API call will look something like this.

```bash
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Never push to prod on a Friday",
    "model": "text-embedding-3-small"
  }'
```

And you'll get a similar looking result, just from their model instead of the nomic one. The [OpenAI guide is here.][openai]

I love to pick apart these data formats and tell you what they mean, but really these ones are nearly impossible as a non-expert to pick apart. Suffice to say, it's an array of numbers that represent the meaning of a text string as a fixed amount of data points. That's about as much as you can say. Then the distance between these data points is used to cluster text strings with similar meanings.

So let's add this capability to Postgres. You need to add an extension called appropriately `vector`.

You would normally run commands like this:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE comments ADD COLUMN embedding vector(<length of your vector>);
```

Your embedding model will dictate the length of your vector. The nomic model has a length of `768` and the OpenAI one has a vector length of `1536`. Those are the numbers you'll use there. If you use a different vector, you'll have a yet-different number there.

I have this built into the embed script already so you don't need to do this, but this is how you add an extension to Postgres: you find it, add it to Postgres (which we did by using the pgvector container), do a `CREATE EXTENSION` call, and then use it. `vector()` is a data type that gets included with the extension and it adds the ability to query vectors.

So add this embedding script to your project:

```javascript
import pg from "pg";

const CONNECTION_STRING =
  "postgresql://postgres:mysecretpassword@localhost:5432"; // NOTE you may need to add your database name (e.g. /message_boards) if you aren't using the default postgres database

const PROVIDERS = {
  openai: {
    dimensions: 1536,
    model: "text-embedding-3-small",
    async embed(texts) {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: texts,
          model: "text-embedding-3-small",
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI API error: ${res.status} ${err}`);
      }

      const data = await res.json();
      return data.data.map((d) => d.embedding);
    },
  },

  ollama: {
    dimensions: 768,
    model: "nomic-embed-text",
    async embed(texts) {
      const res = await fetch("http://localhost:11434/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "nomic-embed-text",
          input: texts,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Ollama API error: ${res.status} ${err}`);
      }

      const data = await res.json();
      return data.embeddings;
    },
  },
};

const [mode, providerName, ...rest] = process.argv.slice(2);

if (!PROVIDERS[providerName] || !["generate", "get"].includes(mode)) {
  console.error("Usage:");
  console.error(
    "  node embeddings.js generate <openai|ollama>     Embed all comments",
  );
  console.error(
    '  node embeddings.js get <openai|ollama> "text"    Get a single embedding',
  );
  process.exit(1);
}

const provider = PROVIDERS[providerName];

if (mode === "get") {
  const text = rest.join(" ");
  if (!text) {
    console.error(
      'Provide text to embed: node embeddings.js get ollama "your text here"',
    );
    process.exit(1);
  }

  const [embedding] = await provider.embed([text]);
  console.log(`[${embedding.join(",")}]`);
} else {
  console.log(
    `Using ${providerName} (${provider.model}, ${provider.dimensions} dimensions)`,
  );

  const client = new pg.Client({ connectionString: CONNECTION_STRING });
  await client.connect();

  await client.query("CREATE EXTENSION IF NOT EXISTS vector");

  // Drop and recreate column to match provider dimensions
  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'embedding'
      ) THEN
        ALTER TABLE comments DROP COLUMN embedding;
      END IF;
    END $$
  `);
  await client.query(
    `ALTER TABLE comments ADD COLUMN embedding vector(${provider.dimensions})`,
  );

  const { rows } = await client.query(
    "SELECT comment_id, comment FROM comments ORDER BY comment_id",
  );
  console.log(`Found ${rows.length} comments to embed`);

  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const texts = batch.map((r) => r.comment);
    const embeddings = await provider.embed(texts);

    for (let j = 0; j < batch.length; j++) {
      const vectorStr = `[${embeddings[j].join(",")}]`;
      await client.query(
        "UPDATE comments SET embedding = $1 WHERE comment_id = $2",
        [vectorStr, batch[j].comment_id],
      );
    }

    console.log(
      `Embedded ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`,
    );
  }

  console.log("Done!");
  await client.end();
}
```

Then add these to your scripts in package.json

```json
"scripts": {
  "embed:openai": "node embed.js generate openai",
  "embed:ollama": "node embed.js generate ollama",
  "get:openai": "node embed.js get openai",
  "get:ollama": "node embed.js get ollama"
},
```

Now if your run `npm run embed:<provider>` it will query every comment, run it through the embedding model, and save it to the database. Make sure you've pulled the correct model for ollama and it's running if you're using Ollama, and make sure you have `OPENAI_API_KEY` in your environment if you want to use OpenAI, e.g. `OPENAI_API_KEY=<your OpenAI API key> npm run embed:openai`. This should batch them and save them to your database. It took maybe 10 seconds to do it on M3 MacBook Air on Ollama (the model itself is 273MB as of writing, should run on nearly any modern laptop), and I think it was less than 1¢ when I ran it on OpenAI (I can't tell, but it was a tiny amount.)

Once you've ran that, let's run some queries!

```sql
SELECT comment, embedding FROM comments LIMIT 1;
```

The formatting will probably be really weird, but if you scroll down you'll see your comment and the array of numbers representing its meaning. Cool. Let's use it now. But here's the problem: you need to encode your search string to be able to search! Normally your app would just run it through whatever model in your code but I don't want to build a whole other app for it, so I included it as an npm script that we can use.

You query will look like this.

```sql
SELECT
  comment,
  embedding <=> '[<your vectors>]' AS distance
FROM comments
ORDER BY distance
LIMIT 15;
```

So now run

```bash
npm run embed:<ollama or openai> "your search string here"
npm run embed:<ollama or openai> --silent "your search string here" | pbcopy # this will copy it to your clipboard on macOS
```

This will output your vector to the CLI. If you're on Mac and use pbcopy, you'll need to delete a few lines at the beginning.

You can then copy and paste that query with the vectors in there and get back results that will look like this

```md
                                                                     comment                                                                      |      distance
--------------------------------------------------------------------------------------------------------------------------------------------------+---------------------
 We have a hard rule: no deploys after Thursday noon. It has saved us more times than I can count.                                                |  0.2770497569293393
 Automated deployments are great until the automation itself breaks and nobody remembers how to deploy manually.                                  |  0.3574482286223275
 Our deploy process: merge PR, CI builds, deploy to canary, wait 10 minutes, promote. Simple and it has never bitten us.                          |  0.3587287787411174
 Lambda cold starts are manageable if you keep your deployment package small. The teams complaining about cold starts usually have 200MB bundles. | 0.36594019571174496
 If deploying your app requires a wiki page with 30 steps, you do not have a deployment process. You have a ritual.                               | 0.37398297369986555
 Container images make deployments reproducible. Container orchestration makes your weekends disappear. Choose wisely.                            |  0.3791594834387738
 Feature flags let us deploy code that's not ready without branching. Ship the flag off, flip it on when confidence is high. Game changer.        |  0.3793973470452213
 We test in production and I'm not ashamed. Feature flags, canary rollouts, and good monitoring make it safe. Staging is a lie anyway.            |  0.3938557054406431
 Set the Secure flag on every cookie. If you're not on HTTPS by now, that's a different conversation.                                             |   0.395735220957141
 My phone got 47 push notifications from our staging environment at 2am because someone left a test flag on.                                      |  0.3987481477114623
 I don't always use the command line, but when I do, I forget the flags and end up on StackOverflow anyway.                                       |  0.4120026476383941
 We passed a security audit, felt great, then found a SQL injection vulnerability the next week. Audits are a snapshot, not a guarantee.          |  0.4125302851055693
 Set up alerts on your 99th percentile latency, not your average. Average hides the pain from your worst-off users.                               | 0.41835813194067306
 On-call wouldn't be so bad if alerts were actually actionable. 90% of ours are noise.                                                            |  0.4187183670812683
 Our first production deploy took 4 hours of manual steps. We automated it down to 8 minutes. Should have done that first.                        |  0.4195256962936351
```

A lot of steps but it ends up being fairly simple in code.

1. Make embeddings for everything in your database
1. Make sure you add embeddings for every new comment added to the database and update the embedding if the comment changes
1. When you go to do RAG with an LLM, run the search query through the embedding model
1. Use that to search the database using the `<=>` operator
1. Profit

Imagine if you wanted to find similar comments to a comment already in your database. Easy, with a subquery.

```sql
-- Wrap it in a function they can call
-- (you'd create this ahead of time)
SELECT
  comment,
  embedding <=> (
    SELECT embedding FROM comments
    WHERE comment_id = 1
  ) AS distance
FROM comments
WHERE comment_id != 1
ORDER BY distance
LIMIT 15;
```

Because the embedding is already there, you don't need to call the model. This will give the most similar comments to comment ID 1.

Compare this to text comparison search (e.g. `LIKE`, `ILIKE`) - you'd get things with the exact same keywords, but you would miss things that have similar meanings. 

## A word of caution on RAG

RAG isn't a silver bullet. It doesn't always make your results from your LLM better.

Let's take our customer support bot. It probably works well if you have a robust catalog of solutions _and_ most problems are ones you've seen before. But if you have a poor catalog of solutions and/or most problems are net new and are not contained in the solution catalog? Then you're chucking a bunch of context that isn't only useless, it's actively steering the LLM in a wrong direction. It's actually harmful to your product.

So some words of caution:

- Bad retrieval is worse than no retrieval. RAG works in specific circumstances where you have useful context in a bounded problem space - product recommendations from your store is a good example of this. It is/can be harmful when it's a less bounded problem space, like customer support. In either case, you must test it thoroughly to make sure your RAG is helping, not hurting.
- LLMs are getting pretty smart and frequently don't need RAG to get to good solutions. In some cases it's good to just let the LLM run its course and see what it comes back with. You may add like an MCP server or a skill for it to fetch its own data if that's appropriate to your use case for more an "LLM can pull context when needed" model instead of "push context to an LLM every time".
- In some cases, you could fine-tune a model instead of doing RAG. If you need to modify a model _behaves_ instead of just adding new context at query time, you have a fine-tuning problem, not a retrieval problem. This would more modifying the tone or problem solving style, or embedding certain biases directly into the responses themselves (may also be achieved by simple prompt engineering, depends on the problem.)

Keep in mind that doing RAG carries cost: latency and code complexity of doing the querying, additional tokens on every query, and additional infra to manage the vectors. Make sure that you're getting benefit from it. You can always add RAG to system later, usually it's good to start without it.

[pinecone]: https://www.pinecone.io/
[pgvector]: https://github.com/pgvector/pgvector
[openai]: https://developers.openai.com/api/docs/guides/embeddings/
