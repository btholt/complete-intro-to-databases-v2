Let's talk about vector search, which is most frequently used with a technique called RAG (retrieval-augmented generation). At its most simple, RAG is the idea that you have a database full of useful context to for LLMs. 

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
{"model":"nomic-embed-text","embeddings":[[0.009210397,0.043993976,-0.14392269,-0.0077514267,0.061490994,-0.004973118,0.009365671,0.007229709,-0.018027218,-0.046408247,0.009731809,0.07082095,0.0038592147,0.02665532,0.062885955,0.003577928,0.04486645,-0.08607875,0.014982383,0.02072975,0.011557674,-0.06717606,-0.069490105,-0.0026118876,0.11706118,0.026608134,0.024565192,-0.0070613204,-0.036495667,0.029488675,0.0000037405464,-0.037981734,-0.042782318,-0.002994989,-0.058208678,-0.024538344,0.06433887,-0.03455543,-0.012830574,-0.014252369,0.0026022643,-0.02100174,0.03881561,-0.03769146,-0.016578574,-0.041479703,0.036702897,0.01942909,0.004703666,-0.03198506,0.00854769,0.013764843,-0.03821522,-0.06115926,0.059935838,0.016820408,0.0003478296,-0.0037325658,0.0194267,-0.0075505315,0.033936016,0.03474845,-0.05390223,0.040105484,0.01786311,-0.07835231,0.035043433,0.034655947,-0.053411085,0.010696648,0.05615231,0.01417064,0.073551714,0.03615804,-0.04185429,-0.03005145,-0.02199237,-0.041766025,-0.0074845455,0.0116640795,0.063522086,-0.031998735,0.06238515,-0.033786498,0.026964689,0.0017536525,-0.025239162,0.020424662,-0.064241104,0.03218085,0.012716007,0.00032122195,-0.024785275,0.0544309,-0.082958505,-0.01640258,-0.007134679,0.05180848,-0.049505673,-0.023086414,-0.014404359,-0.0086891875,-0.011386308,0.021305546,-0.002371298,0.0071226433,0.052221812,0.014931909,0.02347415,0.0061347727,-0.00022489601,0.05033276,-0.047319356,-0.02644594,0.0010638987,-0.045069017,0.06166806,-0.0030648229,-0.032189798,-0.021477597,-0.011220866,-0.04127918,-0.009342175,0.07590548,-0.00660679,0.04732367,-0.026321981,-0.03689282,-0.0057246825,-0.019376803,-0.045349445,0.017336085,-0.0061256,-0.020142177,0.011060933,0.027806796,-0.03623552,-0.04911436,0.01635513,0.02849501,-0.0033736185,0.021299716,-0.024636,-0.07082431,-0.005701939,-0.020539375,0.027430275,0.0059418664,-0.039873432,0.021515094,0.031449307,-0.013069726,0.014433542,0.03421317,0.07935949,-0.031832527,0.04768436,0.0583786,-0.021995222,0.013578774,0.00727384,-0.0079966225,-0.11311631,0.03437493,-0.03204035,-0.08543806,-0.021181611,0.07366858,0.011533497,0.032594517,-0.046919577,0.013965876,0.042612996,-0.032750938,0.010303372,0.027050164,-0.05258264,-0.019429578,0.011524347,-0.04620252,0.033590283,-0.02905387,0.041759476,0.021530975,-0.050729696,-0.038974304,0.019864446,0.0135629345,-0.05516276,-0.007845485,0.0011607985,0.056584876,-0.051784676,-0.01243872,-0.02411864,-0.041381467,0.04527995,-0.045589726,0.062116865,-0.023479737,-0.021802709,-0.027286418,0.015832704,-0.0099389,-0.04779352,0.053159717,0.01426576,0.023252657,-0.008900361,0.011337508,0.07016291,-0.039861172,-0.010814926,-0.020075912,-0.027332468,-0.027042663,0.013727919,-0.062257633,-0.03301043,0.018965391,-0.015067438,0.0071967305,0.032142606,0.033211675,-0.0006187722,0.006495186,-0.04000723,0.01251133,-0.009886156,-0.0014517118,-0.0023343319,-0.109050795,0.037573762,0.009774638,0.010925335,-0.012688752,0.00028616708,0.05048068,-0.034564923,-0.00032427377,0.021535791,0.053247675,0.025657149,0.003885064,-0.01734219,0.023266792,0.019167844,0.045907844,-0.005998393,0.006925013,0.027443862,0.010566627,0.04057369,0.03040059,0.032305747,0.013879915,-0.080088325,0.053383365,0.032043047,-0.030109871,0.004085089,-0.007189479,0.003474168,-0.013386473,-0.029711151,0.041396573,-0.061840136,0.0092476355,0.043339595,-0.027553761,0.022839896,0.053771023,0.04205974,0.055381447,0.011374183,-0.018007167,0.044305827,-0.04940155,-0.045001805,0.017602324,-0.065985896,-0.012880261,0.034841638,0.025281413,-0.053558048,-0.0065136743,0.03381991,-0.017746726,-0.013741871,0.0021448461,-0.01016481,-0.0067214435,-0.008137423,0.07315463,0.010615803,0.056546632,0.050184704,0.006182626,0.034648437,-0.044854652,0.006239053,0.015836472,-0.004824618,0.017312435,0.028066793,-0.06922002,0.04527203,-0.02209494,-0.0015311488,0.026311725,-0.05462717,0.018032838,-0.026801953,0.051713582,-0.0824954,0.0076113995,0.029953225,0.012217766,0.069006525,0.019507578,-0.01580351,-0.062254213,-0.00048556214,-0.026813949,0.00827558,0.06489586,0.020253796,0.06565387,0.01729235,-0.05138067,0.00574725,0.06334482,0.026490724,-0.045671374,0.0074289916,0.009723772,-0.03746318,0.057904918,0.017775023,0.03707868,0.010735185,-0.008698934,-0.020954572,0.00079135376,0.025590697,-0.0035968274,0.012616047,0.01572836,0.019543502,0.011914241,-0.0029532465,0.041619595,-0.019732088,0.006812037,0.062521964,-0.0010917888,0.0043295915,-0.008980725,-0.020203894,-0.03652628,0.048589893,0.054010537,0.002834815,-0.04412396,-0.029444803,0.021833802,0.055403434,0.029200472,-0.00063309196,0.049344193,0.0228222,-0.068787105,0.006432301,-0.0047307406,-0.0010902098,-0.024956806,-0.09645014,-0.058224812,-0.0045380555,0.051144727,0.002024603,-0.018808326,0.013392587,-0.0075531327,-0.0034432646,-0.0146577265,0.04772864,0.01966071,0.01879265,-0.028987909,-0.011334881,-0.05132013,-0.018159151,0.0058731493,0.03986588,-0.0031410337,0.020622132,-0.013534307,-0.008637805,-0.015525454,-0.04173113,-0.012624257,0.025491433,0.007195887,-0.042071376,-0.03713695,-0.019933557,-0.021300541,0.03349068,-0.015929565,0.029102303,-0.006553877,-0.011190888,-0.062322453,-0.018451935,0.053818904,0.066844694,0.006260705,-0.028150361,0.011502522,0.023437848,0.030769844,0.06515097,0.05080001,-0.02229175,0.030602433,0.021220483,0.04438601,-0.0014379772,-0.08073708,-0.0010381653,0.009440832,0.027265439,-0.042528406,0.0067224232,0.0070198197,0.009184558,0.064621195,0.024419503,0.011442962,0.009569324,-0.023123197,-0.004346326,-0.006044522,0.012140023,0.065326795,0.071575105,-0.037575107,-0.01748811,0.036031935,0.00775287,-0.02240915,0.015646724,0.02385864,0.105502605,-0.009248573,0.0019536822,-0.006241754,-0.037219204,0.013706096,0.023430781,0.0006653312,-0.041291833,-0.02721681,0.0048429985,-0.037419368,-0.030598406,-0.043656394,0.041190475,0.017434953,-0.058068536,-0.0067380294,0.053251386,-0.0023591272,0.033378042,0.0410257,0.029691784,0.012860476,0.040065195,0.058144815,0.057847768,0.010440778,-0.062439624,-0.09601246,-0.0056220517,-0.0063078655,0.006890886,-0.023282843,-0.024169853,0.019710917,0.061270274,0.043598015,0.025382139,-0.025356015,-0.06266218,0.038711812,-0.039902456,0.051050313,0.02790257,0.020586314,0.028396692,-0.030569399,-0.0009652244,0.011488205,-0.010634424,-0.06406162,0.03729561,-0.061536595,-0.053110395,0.03974119,-0.0026189005,0.0339197,0.023379693,-0.0023320243,-0.00028842405,-0.013452221,0.0022871664,-0.01807345,-0.07700279,-0.0032943625,0.018396204,0.003788466,-0.026816746,-0.0028551817,-0.034631226,0.02712155,0.0004908035,-0.033430044,-0.012193936,-0.031766206,-0.015029605,-0.008104375,-0.029624978,-0.038654074,-0.023991702,-0.05185888,0.059675053,-0.03962733,-0.002613909,-0.018318394,-0.009944478,0.020220546,0.007459523,-0.028001651,-0.009126438,0.013129863,-0.070529245,0.054229576,-0.033537086,-0.077090316,0.0668807,-0.039817315,-0.0020810843,0.0049371305,-0.0024574746,0.0015333898,0.0010833124,-0.048870526,0.00027263185,-0.06848664,-0.017197222,-0.0017936705,0.023452755,0.012328719,0.031202218,-0.035269875,-0.0006364785,0.030285737,-0.011457776,0.06784483,0.023577036,-0.05979559,-0.021636624,0.024855435,0.008554142,-0.011949123,0.0044673127,0.0060429587,-0.021864418,0.023925018,-0.003604857,-0.0025682687,-0.028016679,0.06451845,0.0043264036,0.016243745,-0.012944998,-0.058692142,0.08306745,-0.044016737,0.0040427684,0.014996657,0.0021610693,-0.0055255378,0.02287917,0.007249685,-0.044514976,-0.019006453,-0.0058474992,0.0040472713,0.017981427,0.020938464,0.06776581,-0.03531169,-0.061985087,0.02472376,0.013075821,0.0004145125,0.019541742,0.0071340012,0.025128273,0.013128839,0.0005842799,-0.005078038,0.043286,-0.032846805,0.05652436,-0.019369442,0.008373634,-0.030209228,0.011320931,-0.018671554,0.0129485335,-0.021883914,0.015426809,-0.059956837,-0.03967689,-0.062900335,-0.05827408,0.042933956,0.04872626,0.024691394,-0.07257112,0.02025041,-0.07115779,0.035512842,-0.0011984325,0.050358985,-0.03558625,0.06456694,0.045657024,0.015708135,-0.033896502,0.038299344,0.034865525,-0.011797174,-0.008760006,0.033688173,0.03183421,0.016580572,0.09251773,0.035285685,-0.024873767,0.021952376,0.013404406,0.0011692425,-0.016939094,-0.060603064,-0.055719815,-0.017760102,-0.031192297,-0.04726397,-0.03820186,0.005980903,0.029594425,-0.030554784,-0.05229013,-0.00057200855,-0.057864297,0.012188174,0.010736542,0.011496312,-0.015405591,0.0047641294,0.057470657,0.029551629,0.03738812,0.017748795,0.017102314,-0.02786924,0.042496275,-0.027960408,-0.0067638136,-0.041676845,0.0051771468,-0.035396095,0.042234946,0.019222377,-0.034337386,-0.032274634,-0.017937869,-0.04146842,-0.011747409,0.020929828,-0.0029914875,0.010805427,-0.015283647,0.010716398,-0.029856712,0.05031673,0.013909889,0.007740018,-0.0024389152,0.08547023,-0.05998081,-0.012249318,-0.020572204,0.010803418,-0.022086078,-0.018140877,-0.01590876,-0.035869915,-0.015384556,0.046787746,0.049391285,0.05261728,0.00089678087,-0.016470186,-0.01978182,0.030716496,0.043405183,0.014501585,-0.10742736,-0.019307934,-0.026723266,-0.03610374,0.04227077,-0.029108027,0.054543894,-0.025499627,0.026465843,-0.05067194,-0.0006172485,0.018830882,-0.034235306,-0.012034786,-0.022253914,-0.042628057,-0.03927058,-0.017189123,-0.026612535,-0.027742136,-0.011153816,0.08456551,0.015046126,0.002047126,-0.05489539,0.041748486,0.025467416,0.021323558,0.023935614,-0.021551717,-0.001148904,0.018163318,-0.05654896,0.005368228,-0.016370904,0.06716189,0.05574181,-0.042025317,0.022221249,-0.027064841,0.05837809,0.0085590575,-0.019018678,-0.048728403,-0.035981026,-0.034954067]],"total_duration":573477125,"load_duration":427736542,"prompt_eval_count":10}
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

I have this built into the embed script already so you don't need to do this, but this is how you add an extension to Postgres: you find it, add it to Postgres (which we did by using the pgvector container), do a `CREATE EXTENSION` call, and then use it. `vector()` is a function that gets included with the extension and it adds the ability to query vectors.

So add this embedding script to your project:

```javascript
import pg from "pg";

const CONNECTION_STRING =
  "postgresql://postgres:mysecretpassword@localhost:5432";

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
npm run embed:<ollama or openai> "your search string here" | pbcopy # this will copy it to your clipboard on macOS
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