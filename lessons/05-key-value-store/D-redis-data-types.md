---
description: >-
  Learn Redis data types in Brian Holt's Complete Intro to Databases v2 course -
  explore strings, lists, sets, sorted sets, and hashes with practical examples
  for storing and retrieving app data efficiently.
keywords:
  - redis data types
  - redis tutorial
  - database course
  - redis strings lists
  - redis hashes sets
  - brian holt
  - redis commands
---

Redis has a few different types of data. We won't go over all of them because most of them cover more advanced use cases, but so you know, here they are:

- Strings (binary safe, so you could write the contents of JPEG here)
  - Technically numbers/integers are implemented as strings
- Lists (i.e. arrays)
- Sets
- Sorted sets (similar to above but everything has a "score" to it so you can grab the top ten values. Think priority queue sort of idea)
- Hashes (think JS object or Python hash)

You've already seen a string. Try running

```redis
SET name Brian
TYPE name # string
SET visits 10
TYPE visits # string
```

## Lists

I don't find myself frequently needing lists with Redis, but a good use case may be notifications for a user. Let's say you have a user that has three notifications you need to add.

```redis
RPUSH notifications:btholt "Call your mom" "Feed the dog" "Take out trash"
LRANGE notifications:btholt 0 -1
```

- `RPUSH` can be thought of as a push on a stack. You're adding thing(s) to the end of a list.
- `LRANGE` can be thought of as the `GET` for lists (GET doesn't work on lists). It always requires the indexes you want to get so `0 -1` gets you the whole list. You can give it `1 5` and that will be the 1 index (i.e. the second) element to the 5 index element. Negative numbers count back from the end with -1 being the last element, -2 being the penultimate, etc.

Okay, so let's say btholt dismisses the last item on the list. You could do:

```redis
RPOP mylist
```

- This, like pop on stack, will return the last item on the list and remove it from the list.
- LPOP does the same from the front of the list.
- LPUSH also works as well, adding items to the front.
- LTRIM allows you to truncate a list. If I said `LTRIM notifications:btholt 0 5` it'd drop any notifications beyond five. This is useful if we don't let btholt get any more than five notifications at a time.

## Hashes

Think of hashes like an object in Redis. Maybe we could represent btholt's user like this:

```redis
HSET btholt:profile title "principal program manager" company "Microsoft" city "Seattle" state "WA"
HGET btholt:profile city
HGETALL btholt:profile
```

Useful if we don't want to have separate keys for all of these. Do note that most of the operators like `INCR` exist for hashes as well e.g. `HINCRBY`. [See here][hash].

## Sets and Sorted Sets

A set is just a group of things. In our case it will be a group of strings which won't have a concept of order. For example, if you had a set of colors. There's no "order" to a set of colors, it's just a group. We could do this:

```redis
SADD colors red blue green yellow
SMEMBERS colors
SISMEMBER colors green # true
SISMEMBER colors gold # false
SPOP colors # removes and returns a random element
```

> Redis actually returns `1` for true and `0` for false.

There's another sort of set that's called a sorted set that allows you to add priorities so that you can ask for the top ten things in a list. We won't spend a lot of time on them, but here's a quick demonstration:

```redis
ZADD ordinals 3 third
ZADD ordinals 1 first
ZADD ordinals 2 second
ZADD ordinals 10 tenth
ZRANGE ordinals 0 -1
```

It's basically an array that sorts itself on the fly based on those priorities you give to it.

If you're keen to learn more [see here][sorted-sets].

## JSON

A small note on the JSON type here - most of what you would use JSON for is covered by the other data types. A lot of times I'll just store the raw JSON string as a string because I don't need Redis to operate on the object, just retrieve it when asked. And when I do need more than that, hashes and sets usually cover those cases. But if you need to actually store a JSON object and be able to access properties on the object, there is the JSON type. I've never actually used it in production.

[See the docs for more details][json].

## Lots More

I picked a few interesting ones. [See more types here][types].

[hash]: https://redis.io/docs/latest/develop/data-types/#hashes
[sorted-sets]: https://redis.io/docs/latest/develop/data-types/#sorted-sets
[types]: https://redis.io/docs/latest/develop/data-types/
[json]: https://redis.io/docs/latest/develop/data-types/json/
