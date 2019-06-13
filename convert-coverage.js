const v8ToIstanbul = require('v8-to-istanbul')
const url = require('url')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')

const v8CoverageFilename = path.join(__dirname, '.v8-coverage', 'coverage.json')
const v8Coverage = JSON.parse(fs.readFileSync(v8CoverageFilename))
const istanbulCoverageFolder = path.join(__dirname, '.nyc_output')
// console.log(v8Coverage)

if (!fs.existsSync(istanbulCoverageFolder)) {
  mkdirp(istanbulCoverageFolder)
}

v8Coverage.result.forEach(async report => {
  // console.log('report is %o', report)
  const u = new url.URL(report.url)
  const filename = path.join(__dirname, u.pathname)
  console.log('instrumenting file %s for url %s', filename, report.url)
  const converter = v8ToIstanbul(filename)
  // I wonder if this maps the source if there is a source map?!
  await converter.load()
  converter.applyCoverage(report.functions)

  const coverageFilename = path.join(istanbulCoverageFolder, 'out.json')
  const istanbulCoverage = converter.toIstanbul()
  fs.writeFileSync(
    coverageFilename,
    JSON.stringify(istanbulCoverage, null, 2) + '\n'
  )
})

// return Promise.all(
//   result.result.map(report => {
//     // need to map report from url to original file
//     // TODO probably we can fetch the script and save it as temp file
//     // or remap it to the original files using source maps
//     const u = new url.URL(report.url)
//     const filename = fromRoot(u.pathname)
//     console.log(
//       'instrumenting file %s for url %s',
//       filename,
//       report.url
//     )
//     const converter = v8ToIstanbul(filename)

//     return converter.load().then(() => {
//       console.log('%o', converter)
//       // console.log('applying coverage')
//       // console.log('%o', report.functions)
//       // reportFormatted.applyCoverage(report.functions)
//       // return reportFormatted.toIstanbul()
//     })
//   })
// ).then(() => {
