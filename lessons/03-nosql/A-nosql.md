---
description: ""
---

Let's hop into our second paradigm of databases, NoSQL databases. The term "NoSQL" is definitely a buzzword and actually doesn't really mean much. When you say NoSQL, you're basically saying it's just not a relational database. This can get even more fuzzy when you realize that some NoSQL databases can handle SQL queries. All-in-all, it's a barely-useful marketing term that I put in here just because you'll see it everywhere. You can essentially take it to mean "it's not Postgres/MySQL/SQL Server/etc."

It's more useful to make the distinction of what kind on NoSQL database we're going to be talking about. In this section we're going to be discussing a **document-based** database with MongoDB. There are lots of other NoSQL databases out there and many are quite dissimilar from each other but still get lumped together as "NoSQL" databases.

## Why choose a document based database

There are a myriad of reasons to choose each of these databases and a lot of them overlap. Most of the ones I'm going to show you today are what I'd call a "workhorse" database: they can handle general purpose loads of work and you don't necessarily need a specific advantage you're looking to use; you just need a database.

With document-based databases, one of the most obvious and key advantages is that your data is totally unstructured and that's fine. With a relational database, you'll have to define the shape of your data upfront. You'll say something like this database table has three columns, name which is a string, age which is an integer. With a document-based database, you just start writing objects to the database and it will accomodate that. Some documents can have some fields and others can other ones. It's totally up to you. It can even be a bit of a problem when you misspell field names since the database will just happily accept the misspelled field name as a new field. Not that I have literally done that before. 😅

Document-based databases like MongoDB feel very familiar to JavaScript developers. It's very much like taking normal JavaScript objects and throwing them in a database to retrieved later.

## Other NoSQL databases to know about

There are plenty of other types of NoSQL databases out there with new ones being written fairly frequently. Today we'll focus on MongoDB but you should go poke around other awesome NoSQL databases like Cassandra, Couchbase, Firebase Firestore and others.
