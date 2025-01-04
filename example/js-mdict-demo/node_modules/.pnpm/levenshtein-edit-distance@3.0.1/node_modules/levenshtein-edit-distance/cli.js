#!/usr/bin/env node
import fs from 'node:fs'
import {URL} from 'node:url'
import process from 'node:process'
import {levenshteinEditDistance} from './index.js'

/** @type {Object.<string, unknown>} */
const pack = JSON.parse(
  String(fs.readFileSync(new URL('package.json', import.meta.url)))
)

const argv = process.argv.slice(2)
let insensitive = false
let pos = argv.indexOf('--insensitive')

if (pos !== -1) {
  argv.splice(pos, 1)
  insensitive = true
}

pos = argv.indexOf('-i')
if (pos !== -1) {
  argv.splice(pos, 1)
  insensitive = true
}

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(help())
} else if (argv.includes('--version') || argv.includes('-v')) {
  console.log(pack.version)
} else if (argv.length === 0) {
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', function (data) {
    getDistance(String(data).trim())
  })
} else {
  getDistance(argv.join(' '))
}

function help() {
  return [
    '',
    '  Usage: ' + pack.name + ' [options] <word> <word>',
    '',
    '  ' + pack.description,
    '',
    '  Options:',
    '',
    '    -h, --help           output usage information',
    '    -v, --version        output version number',
    '    -i, --insensitive    ignore casing',
    '',
    '  Usage:',
    '',
    '  # output distance',
    '  $ ' + pack.name + ' sitting kitten',
    '  ' + distance(['sitting', 'kitten']),
    '',
    '  # output distance from stdin',
    '  $ echo "saturday,sunday" | ' + pack.name,
    '  ' + distance(['saturday', 'sunday'])
  ].join('\n')
}

/**
 * @param {string} value
 */
function getDistance(value) {
  const values = value.split(',').join(' ').split(/\s+/)

  if (values.length === 2) {
    // @ts-ignore yes, the length is 2.
    console.log(distance(values))
  } else {
    process.stderr.write(help())
    process.exit(1)
  }
}

/**
 * @param {[string, string]} values
 * @return {number}
 */
function distance(values) {
  return levenshteinEditDistance(values[0], values[1], insensitive)
}
