# Apollo Local Link

[![Build Status](https://travis-ci.org/TallerWebSolutions/apollo-link-local.svg?branch=master)](https://travis-ci.org/TallerWebSolutions/apollo-link-local)
[![coverage](https://img.shields.io/codecov/c/github/TallerWebSolutions/apollo-link-local.svg?style=flat-square)](https://codecov.io/github/TallerWebSolutions/apollo-link-local)
[![npm version](https://img.shields.io/npm/v/apollo-link-local.svg?style=flat-square)](https://www.npmjs.com/package/apollo-link-local)
[![sponsored by Taller](https://raw.githubusercontent.com/TallerWebSolutions/tallerwebsolutions.github.io/master/sponsored-by-taller.png)](https://taller.net.br/en/)

## Purpose

An Apollo Link that facilitates locally storing query results via interception of responses.

## Installation

`yarn add apollo-link-local`

## Usage

```js
import { LocalLink } from 'apollo-link-local'

const link = new LocalLink()
```

## Options

LocalLink takes an object with the following options to allow customization of it's behavior:

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

#### `normalize`

Normalization callback, which receives the `operation`. Executed prior to storing a query result.

#### `denormalize`

Denormalization callback, which receives the `operation`. Executed after retrieving a cached query result from the store.

### `hasLocalDirective`

A special `shouldCache` implementation is available for enabling caching of queries which use the `@local` directive. Use it as follows:

```js
import { LocalLink, hasLocalDirective as shouldCache } from 'apollo-link-local'

const link = new LocalLink({ shouldCache })
```

## Context

The LocalLink does not use the context for anything, but customization of the config options will often receive the full `operation`, meaning they can achieve their purpose by using the context if necessary.
