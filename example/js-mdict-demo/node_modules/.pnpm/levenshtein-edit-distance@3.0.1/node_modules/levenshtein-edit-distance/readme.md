# levenshtein-edit-distance

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]

[Levenshtein distance][wiki] (by [Vladimir Levenshtein][vlad]).

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`levenshteinEditDistance(value, other[, insensitive])`](#levenshteineditdistancevalue-other-insensitive)
*   [CLI](#cli)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Related](#related)
*   [Contribute](#contribute)
*   [Security](#security)
*   [License](#license)

## What is this?

This package exposes a string similarity algorithm.
That means it gets two strings (typically words), and turns it into the minimum
number of single-character edits (insertions, deletions or substitutions)
needed to turn one string into the other.

## When should I use this?

You’re probably dealing with natural language, and know you need this, if
you’re here!

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+, 16.0+), install with [npm][]:

```sh
npm install levenshtein-edit-distance
```

In Deno with [`esm.sh`][esmsh]:

```js
import {levenshteinEditDistance} from 'https://esm.sh/levenshtein-edit-distance@3'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {levenshteinEditDistance} from 'https://esm.sh/levenshtein-edit-distance@3?bundle'
</script>
```

## Use

```js
import {levenshteinEditDistance} from 'levenshtein-edit-distance'

levenshteinEditDistance('levenshtein', 'levenshtein') // => 0
levenshteinEditDistance('sitting', 'kitten') // => 3
levenshteinEditDistance('gumbo', 'gambol') // => 2
levenshteinEditDistance('saturday', 'sunday') // => 3

// Insensitive to order:
levenshteinEditDistance('aarrgh', 'aargh') === levenshtein('aargh', 'aarrgh') // => true

// Sensitive to ASCII casing by default:
levenshteinEditDistance('DwAyNE', 'DUANE') !== levenshtein('dwayne', 'DuAnE') // => true
// Insensitive:
levenshteinEditDistance('DwAyNE', 'DUANE', true) === levenshtein('dwayne', 'DuAnE', true) // => true
```

## API

This package exports the identifier `levenshteinEditDistance`.
There is no default export.

### `levenshteinEditDistance(value, other[, insensitive])`

Levenshtein edit distance.

###### `value`

Primary value (`string`, required).

###### `other`

Other value (`string`, required).

###### `insensitive`

Compare insensitive to ASCII casing (`boolean`, default: `false`).

##### Returns

Distance between `value` and `other` (`number`).

## CLI

```txt
Usage: levenshtein-edit-distance [options] word word

Levenshtein edit distance.

Options:

  -h, --help           output usage information
  -v, --version        output version number
  -i, --insensitive    ignore casing

Usage:

# output distance
$ levenshtein-edit-distance sitting kitten
# 3

# output distance from stdin
$ echo "saturday,sunday" | levenshtein-edit-distance
# 3
```

## Types

This package is fully typed with [TypeScript][].
It exports no additional types.

## Compatibility

This package is at least compatible with all maintained versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.
It also works in Deno and modern browsers.

## Related

*   [`levenshtein.c`](https://github.com/wooorm/levenshtein.c)
    — C API
*   [`levenshtein`](https://github.com/wooorm/levenshtein)
    — C CLI
*   [`levenshtein-rs`](https://github.com/wooorm/levenshtein-rs)
    — Rust API
*   [`stemmer`](https://github.com/words/stemmer)
    — porter stemming algorithm
*   [`lancaster-stemmer`](https://github.com/words/lancaster-stemmer)
    — lancaster stemming algorithm
*   [`double-metaphone`](https://github.com/words/double-metaphone)
    — double metaphone algorithm
*   [`soundex-code`](https://github.com/words/soundex-code)
    — soundex algorithm
*   [`dice-coefficient`](https://github.com/words/dice-coefficient)
    — sørensen–dice coefficient
*   [`syllable`](https://github.com/words/syllable)
    — syllable count of English words

## Contribute

Yes please!
See [How to Contribute to Open Source][contribute].

## Security

This package is safe.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/words/levenshtein-edit-distance/workflows/main/badge.svg

[build]: https://github.com/words/levenshtein-edit-distance/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/words/levenshtein-edit-distance.svg

[coverage]: https://codecov.io/github/words/levenshtein-edit-distance

[downloads-badge]: https://img.shields.io/npm/dm/levenshtein-edit-distance.svg

[downloads]: https://www.npmjs.com/package/levenshtein-edit-distance

[size-badge]: https://img.shields.io/bundlephobia/minzip/levenshtein-edit-distance.svg

[size]: https://bundlephobia.com/result?p=levenshtein-edit-distance

[npm]: https://www.npmjs.com

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[contribute]: https://opensource.guide/how-to-contribute/

[license]: license

[author]: https://wooorm.com

[wiki]: https://en.wikipedia.org/wiki/Levenshtein_distance

[vlad]: https://en.wikipedia.org/wiki/Vladimir_Levenshtein
