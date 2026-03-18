This is going to be a bit different than what we've talked about in other sections. Whereas the previous databases were very oriented towards building apps and directly tools you as a web developer would use, this is a bit different. These sorts of databases veer more towards the data science side of the house and are more for exploring data, deriving insights, reporting, and other ways of slicing and dicing data with the database as a tool.

Importantly, you will never use a columnar database by itself. You don't load data into something like DuckDB or Clickhouse and then read from it later to show your product catalog or your users table. These are databases designed for analytical workloads, not general purpose "transactional" workloads.

Every database we've used so far stores data row by row. When Postgres reads a user record, it grabs the whole row — name, email, age, everything — because that's how it's stored on disk. This is great for 'give me everything about user #47' which is what apps do all day.

Columnar databases flip this. They store data column by column — all the ages together, all the names together, all the emails together. This sounds weird until you ask a question like 'what's the average age of our 10 million users?' A row database has to read every full row to get just the age field. A columnar database reads only the age column and skips everything else. Way less data read, way faster for that kind of question.

The tradeoff is the inverse: if you want one specific user's full record, a columnar database has to reach into every column to reconstruct it. That's why you'd never use DuckDB to serve your app's user profile page. Different storage layout, different strengths."

## OLAP vs OLTP

You'll see these abbreviations thrown around they stand for Online Analytical Processing and Online Transaction Processing and they just serve to describe the difference between a lakehouse oriented database (like DuckDB, Clickhouse, Snowflake Lakehouse, Databricks Lakehouse, etc.) versus a more general purpose database like Postgres, MySQL, Oracle, MongoDB, etc.

## ETL/ELT and Reverse-ETL

So ... how does the data get loaded then?

There's a variety of ways. One of the cool things about specifically DuckDB is that it just operates on files (like SQLite does.) So you can just point it at a CSV, JSON, or a myriad of other storage files and it'll start reading and writing data for you. So the data is loaded however you choose to dump files out. You can have your Postgres just dump a CSV file to an S3 bucket and then later use DuckDB to do your analytics on it. This is the simplest way to get started with something like DuckDB

For some more hosted solution, you'd have to extract the data, transform it into an acceptable data schema, and then load it into your preferred database. That's what ETL is: extract, transform, and load. You'll also see it written as ELT: extract, load, and transform which denotes that you just dump the data as-is and then at query time you do the transformations instead of having to doing it in advance. In practice this can be nice because your "extract" step then can be done at query time as well, meaning your data is pretty close to being real-time, whereas ETL depends on the fact that the extract and transform steps are done in advance which produces some amount of lag / data staleness since you'll only probably do that like once an hour/day/week/etc.

Reverse-ETL is the idea that you do some cool stuff in your OLAP database and want to load that back into your OLTP database to be used in your product. Imagine you're an e-commerce company. You load all your sales from your Postgres database into your MotherDuck OLAP database, and do some clustering to find out that "users that purchased product X also frequently bought product Y". This is really cool insight and useful in your product, so you want to load that back into Postgres so your app can serve it. This data pipeline would be called Reverse-ETL: loading stuff from your OLAP database into your OLTP database.

## Delta Lake, Iceberg, and Parquet

While we don't think at all about _how_ MongoDB or Postgres store data, people who work with OLAP databases think about how things are stored a lot. They're all very passionate about it and you will hear data nerds argue about Delta Lake versus Iceberg. Ultimately they're talking about how data is managed and stored.

So let's talk a bit of architecture. "Big Data" deployments would often have a data lake where you'd dump raw files to be processed later and then a data warehouse where all the data was ingested and formatted well, ready to be consumed. Databricks created the idea of the data lakehouse where you'd dump raw data and then you'd read directly from it for your analytical workloads, combining the two pieces of infra into one. The data format here became very important because it determined how fast and how safely you could access that data.

Apache Parquet essentially became the standard here, being a very efficient way to store data and everyone has more-or-less adopted Parquet as the underlying storage file. But Parquet itself lacks some features like ACID compliance and it necessitates a full rewrite of the file itself every time someone writes to it, meaning it needed something on top of it to enable these features.

Enter Apache Iceberg. It adds a lot of these features on top of Parquet (and other storage formats, but Parquet is the usual suspect) and became the standard with more-or-less every big OLAP database supporting them.

However Databricks had grievances with Iceberg and created their own version of it called Delta Lake which had some better features that fit better with Databricks. (I'm skipping a lot of details but I think the evolution of how we got here is helpful).

Now enter Apache Iceberg v3 which was mostly Databricks adding what it needed to Iceberg for it to work well for Databricks. Hopefully this means we can all mostly standardize on Iceberg v3 and the ecosystem will be less fractured. In any case, you can use any of the formats across most of the major providers and they'll make it work.

Today we're going to be working with Parquet files, but DuckDB can read and write to Delta Lake and Iceberg but doesn't support all operations yet. [Here's the support for both][duck-support].

[duck-support]: https://duckdb.org/docs/stable/lakehouse_formats
