# Apollo Local Cache Link

[![Build Status](https://travis-ci.org/TallerWebSolutions/apollo-link-local-cache.svg?branch=master)](https://travis-ci.org/TallerWebSolutions/apollo-link-local-cache)
[![coverage](https://img.shields.io/codecov/c/github/TallerWebSolutions/apollo-link-local-cache.svg?style=flat-square)](https://codecov.io/github/TallerWebSolutions/apollo-link-local-cache)
[![npm version](https://img.shields.io/npm/v/apollo-link-local-cache.svg?style=flat-square)](https://www.npmjs.com/package/apollo-link-local-cache)
[![sponsored by Taller](https://raw.githubusercontent.com/TallerWebSolutions/tallerwebsolutions.github.io/master/sponsored-by-taller.png)](https://taller.net.br/en/)

## Purpose

An Apollo Link that facilitates locally storing query results via interception of responses.

## Installation

`yarn add apollo-link-local-cache`

## Usage

```js
import { LocalCacheLink } from 'apollo-link-local-cache'

const link = new LocalCacheLink()
```

## Options

LocalCacheLink takes an object with the following options to allow customization of it's behavior:

| name        | value    | default                                                                    | required                      |
| ----------- | -------- | -------------------------------------------------------------------------- | ----------------------------- |
| shouldCache | boolean  | Function                                                                   | `true`                        | false |
| generateKey | Function | [`operation.toKey`](https://www.apollographql.com/docs/link/overview.html) | false                         |
| storage     | Object   | Function                                                                   | `localStorage` in the browser | false |
| normalize   | Function | `JSON.stringify`                                                           | false                         |

#### `shouldCache`

The cache policy. When set to `true` defaults to cache all. When set to a callback, will receive the operation as argument, and should return `true` or `false`. Defaults to `true`.

#### `generateKey`

A callback to generate a key for an operation. Defaults to using `operation.toKey`.

#### `storage`

The Storage in use. Will default to window.localStorage when available. Can also be a callback, in which case it will be called with the current `operation` and should retrieve a valid storage.

> Should be complient to https://www.w3.org/TR/webstorage/#storage

#### `normalize`

Normalization callback, which receives the `operation`. Executed prior to storing a query result.

#### `denormalize`

Denormalization callback, which receives the `operation`. Executed after retrieving a cached query result from the store.

### `hasLocalDirective`

A special `shouldCache` implementation is available for enabling caching of queries which use the `@local` directive. Use it as follows:

```js
import {
  LocalCacheLink,
  hasLocalDirective as shouldCache,
} from 'apollo-link-local-cache'

const link = new LocalCacheLink({ shouldCache })
```

And then, define your queries as such:

```gql
query Name @local {
  field
}
```

## Context

The LocalCacheLink does not use the context for anything, but customization of the config options will often receive the full `operation`, meaning they can achieve their purpose by using the context if necessary.
