---
title: JSON in PostgreSQL
description: >-
  Learn PostgreSQL's JSONB data type with Brian Holt in Complete Intro to
  Databases v2. Master storing and querying JSON objects in PostgreSQL using
  brackets, operators, and text extraction techniques for flexible schema-less
  data.
keywords:
  - postgresql jsonb
  - postgres json queries
  - database json
  - jsonb operators
  - postgres brackets notation
  - sql json extraction
  - postgresql tutorial
---

## JSONB

Sometimes you have data that just doesn't have a nice schema to it. If you tried to fit it into a table database like PostgreSQL, you would end up having very generic field names that would have to be interpreted by code or you'd end up with multiple tables to describe different schemas. This is one place where document based databases like MongoDB really shine; their schemaless database works really well in these situations.

However PostgreSQL has a magic superpower here: the JSONB data type. This allows you to put JSONB objects into a column and then you can use SQL to query those objects.

Let's make an example for our message board. You want to add a new feature that allows users to do rich content embeds in your message board. For starters they'll be able to embed polls, images, and videos but you can imagine growing that in the future so they can embed tweets, documents, and other things we haven't dreamed up yet. You want to maintain that future flexibility.

This would be possible to model with a normal schema but it'd come out pretty ugly and hard to understand, and it's impossible to anticipate all our future growth plans now. This is where the `JSONB` data type is going to really shine. These are the queries we ran to create them. (you don't need to run them again)

```sql
DROP TABLE IF EXISTS rich_content;

CREATE TABLE rich_content (
  content_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  comment_id INT REFERENCES comments(comment_id) ON DELETE CASCADE,
  content JSONB NOT NULL
);

INSERT INTO rich_content
  (comment_id, content)
VALUES
  (63, '{ "type": "poll", "question": "What is your favorite color?", "options": ["blue", "red", "green", "yellow"] }'),
  (358, '{ "type": "video", "url": "https://youtu.be/dQw4w9WgXcQ", "dimensions": { "height": 1080, "width": 1920 }}'),
  (358, '{ "type": "poll", "question": "Is this your favorite video?", "options": ["yes", "no", "oh you"] }'),
  (410, '{ "type": "image", "url": "https://btholt.github.io/complete-intro-to-linux-and-the-cli/WORDMARK-Small.png", "dimensions": { "height": 400, "width": 1084 }}'),
  (485, '{ "type": "image", "url": "https://btholt.github.io/complete-intro-to-linux-and-the-cli/HEADER.png", "dimensions": { "height": 237 , "width": 3301 }}');
```

- The `JSONB` data type is the shining star here. This allows us to insert JSON objects to be queried later.
- PostgreSQL won't let you insert malformatted JSON so it does validate it for you.
- Notice you can have as much nesting as you want. Any valid JSON is valid here.

So let's do some querying! As of PostgreSQL 14, you can use bracket notation just like you would in JavaScript:

```sql
SELECT content['type'] FROM rich_content;
```

You'll get something like this:

```md
## ?column?

"poll"
"video"
"poll"
"image"
"image"
```

Notice the quotes around the values—PostgreSQL is returning these as JSON, not as plain text. That distinction matters when you need to compare values or deduplicate results.

It repeats poll and image twice because there's two of those. What if we just wanted the distinct options and no repeats? GROUP BY would work but let's detour to talk about `SELECT DISTINCT`. SELECT DISTINCT will deduplicate your results for you. Try this (this will error):

```sql
SELECT DISTINCT content['type'] FROM rich_content;
```

PostgreSQL doesn't actually know what data type it's going to get back from JSON so it refuses to do any sort of comparisons with the results. We need to extract the value as text, and for that we use the `->>` operator:

```sql
SELECT DISTINCT content ->> 'type' FROM rich_content;
```

The `->>` says "give me this value as a plain text string." Now PostgreSQL can compare them.

What if we wanted to only query for polls?

```sql
SELECT content ->> 'type' AS content_type, comment_id 
FROM rich_content 
WHERE content ->> 'type' = 'poll';
```

Unfortunately due to the execution order (WHERE happens before SELECT) you can't reference content_type and have to give it the full expression.

Okay, last one. What if we wanted to find all the widths and heights? Here's where we can mix bracket notation with `->>`:

```sql
SELECT
  content['dimensions'] ->> 'height' AS height,
  content['dimensions'] ->> 'width' AS width,
  comment_id
FROM
  rich_content;
```

Use brackets to navigate into nested objects, then `->>` at the end when you need the value as text. This will give you back the ones that don't have heights and widths too. To filter those out:

```sql
SELECT
  content['dimensions'] ->> 'height' AS height,
  content['dimensions'] ->> 'width' AS width,
  comment_id
FROM
  rich_content
WHERE
  content['dimensions'] IS NOT NULL;
```

### JSON operators and extracting text

You'll encounter a few different approaches for getting text out of JSON columns. Here's what you'll see in codebases:

**`->>` (most common)**

Extracts a value as text. This is what most production code uses:

```sql
SELECT content ->> 'type' FROM rich_content;
```

**`->` (returns JSON)**

Extracts a value but keeps it as a JSON type. Useful for chaining or when you need to preserve the JSON structure:

```sql
SELECT content -> 'dimensions' -> 'height' FROM rich_content;
```

**Bracket notation (PostgreSQL 14+)**

The modern syntax that feels like JavaScript. Returns JSON, not text:

```sql
SELECT content['dimensions']['height'] FROM rich_content;
```

**CAST**

Explicitly converts JSON to text. More verbose but very clear about intent:

```sql
SELECT CAST(content['type'] AS TEXT) FROM rich_content;
```

**`#>>` with empty path**

A trick you might see occasionally—extracts as text from a JSON value:

```sql
SELECT content['type'] #>> '{}' FROM rich_content;
```

In practice, most teams use brackets for navigating nested JSON and `->>` when they need text extraction. The older `->` and `->>` chain style still works fine and you'll see plenty of it in existing code:

```sql
-- Older style (still common)
SELECT content -> 'dimensions' ->> 'height' FROM rich_content;

-- Modern mixed style
SELECT content['dimensions'] ->> 'height' FROM rich_content;
```

Both are correct. Use whatever your team prefers.
