---
title: "DuckDB"
---

We are going to be using DuckDB which can be a bit confusing, so let's get that out of the way. The other databases we've used so far are servers - you run a Postgres or a MongoDB database and then you use a client to connect to that database. Your `psql` or `mongosh` clients just send requests to the database and then the server does the work.

DuckDB, like SQLite, is a toolkit that operates on a file. Or it's all-in-one: your DuckDB CLI directly modifies a file a on disk. It is not connecting to a server. This is exactly how SQLite works.

There is [MotherDuck][motherduck] which allows you use DuckDB via the cloud, much like there is Turso which allows you to use SQLite in the cloud. But the DuckDB CLI itself reads and writes to a file. It can even remotely write files back to S3, so you can actually have DuckDB connect to an S3 bucket remotely and have it read and write to parquet files there. Very flexible, very simple, very small footprint.

I'm going to recommend you install DuckDB directly, but you can also use Docker still if you want.

[Here are the installation docs][install].

Let's start by just opening an empty file.

```bash
# this will create a file called my-duck.db
duckdb my-duck.db
```

> If you run DuckDB's CLI with the `-ui` flag, you'll get a nice browser UI to run queries with as well.

Now let's do something wild. Let's query from a remote URL

```sql
SELECT * FROM read_parquet(
  's3://us-prd-motherduck-open-datasets/netflix/netflix_daily_top_10.parquet'
) LIMIT 10;
```

> This is provided that MotherDuck keeps that S3 bucket around. If they don't, just know that you if you have a parquet file hosted somewhere you can query just like that. It's very cool.

Okay, let's go ahead and actually save the database locally.

```sql
CREATE TABLE netflix AS SELECT * FROM read_parquet('s3://us-prd-motherduck-open-datasets/netflix/netflix_daily_top_10.parquet');
SELECT DISTINCT title FROM netflix LIMIT 25;
FROM netflix LIMIT 5;
DESCRIBE netflix;
```

> If that s3 URL isn't working, I've also [hosted the parquet file here][parquet]. Download it and and instead of putting the s3 URL, you'll put `CREATE TABLE netflix AS SELECT * FROM read_parquet('<file path to your parquet file here>');`

This will load the parquet file from MotherDuck's S3 bucket and load it into the netflix table. Then we're selecting 25 titles from the database. We're using distinct to get unique titles (there are multiple entries per title). Then we're doing a cool shortcut to look a few sample rows of the netflix table. And then DESCRIBE shows you the columns in the Netflix table.

The queries just look like normal SQL files, but with added super cool abilities. I'm not an expert in this (I'm not a data scientist) but I can show you a few things that will definitely get your brain going in what you can use this for.

Keep in mind that in a columnar database, columns are all stored together (all `Title`, all `Rank`, all `Last Week Rank` etc.). This makes it really fast to do aggregating queries across a column because they're already collected. Contrast this with Postgres or MongoDB - these store rows/documents as single entities, meaning any aggregation of data needs to access every single record and extract them. That's why this is so fast and preferable for these types of queries, even if they're possible in Postgres or MongoDB. And it's why it's not a good choice for OLTP workloads: to return a single complete row, it has to reach into every separate column's storage and reassemble it.

What were people binge watching during the COVID lockdowns? Let's look!

```sql
SELECT Title, Type, MAX("Days In Top 10") as peak_days
FROM netflix
WHERE "As of" BETWEEN '2020-03-15' AND '2020-06-30'
GROUP BY ALL
ORDER BY peak_days DESC
LIMIT 10;
```

`GROUP BY ALL` shows off how much they're thinking about making analytical queries easy. In Postgres, this query would have to explicitly call out that the fields in the GROUP BY: `GROUP BY Title, Type` instead of `GROUP BY ALL`. Now, with two columns here, it's not that big of a deal, but imagine you had nine columns your were grouping, and then you were messing with the query to get it just right. You'd constantly have to edit both your SELECT clause and every time you did, you'd have to remember to edit your `GROUP BY` clause. This is just one of the (seemingly obvious) ways that DuckDB make life easier for analytical work.

```sql
SELECT
  Title,
  Type,
  MAX("Days In Top 10") as total_days,
  ROUND(AVG("Viewership Score"), 1) as avg_score
FROM netflix
WHERE "Netflix Exclusive" = 'Yes'
GROUP BY ALL
ORDER BY total_days DESC
LIMIT 10;
```

This is a query that would be very similar to something Netflix would use as an internal guiding metric - Netflix wants its exclusives to do well because it means people need to sign up for Netflix to be able to see these shows. We're looking at days in top 10 combined with viewership scores where the show is a Netflix exclusive. This shows up what kinds of shows we should be investing in.

```sql
COPY (
  SELECT Title, Type, MAX("Days In Top 10") as peak_days
  FROM netflix
  GROUP BY ALL
  ORDER BY peak_days DESC
) TO 'top_titles.csv' (HEADER);
```

This is magic too - it's possible in other databases but it's a core concept in DuckDB and other OLAP style databases: getting your results out and into other formats like a CSV that can be used and shared. That's a key theme here: a lot of these features are possible in other databases but it's a core concept in DuckDB so it's fast to do it and the syntax is easy.

I just scratched the surface here, there's so much more to DuckDB and other OLAP databases. But I wanted you to understand what it was and why you'd care about it.

[motherduck]: https://motherduck.com/
[install]: https://duckdb.org/install/
[parquet]: /netflix_daily_top_10.parquet
