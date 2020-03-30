const v8toIstanbul = require('v8-to-istanbul')

const convertToIstanbul = async () => {
  // the path to the original source-file is required, as its contents are
  // used during the conversion algorithm.
  const converter = v8toIstanbul('./app.js')
  await converter.load() // this is required due to the async source-map dependency.
  // provide an array of coverage information in v8 format.

  const c8coverage = require('./.v8-coverage/coverage.json')
  const appCoverage = c8coverage.result[0].functions
  converter.applyCoverage(appCoverage)

  // output coverage information in a form that can
  // be consumed by Istanbul.
  console.info(JSON.stringify(converter.toIstanbul(), null, 2))
}

convertToIstanbul().catch(err => {
  console.error(err)
  process.exit(1)
})
