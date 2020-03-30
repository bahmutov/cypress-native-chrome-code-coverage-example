const CDP = require('chrome-remote-interface')
const v8ToIstanbul = require('v8-to-istanbul')
const url = require('url')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')

const fromRoot = path.join.bind(null, __dirname, '..', '..')
const v8CoverageFolder = fromRoot('.v8-coverage')
const istanbulCoverageFolder = fromRoot('.nyc_output')

function log (msg) {
  console.log(msg)
}

let cdp

const makeFolder = () => {
  // if (!fs.existsSync(v8CoverageFolder)) {
  //   mkdirp.sync(v8CoverageFolder)
  // }
  if (!fs.existsSync(istanbulCoverageFolder)) {
    console.log('making folder: %s', istanbulCoverageFolder)
    mkdirp.sync(istanbulCoverageFolder)
  }
}

const convertToIstanbul = async (jsFilename, functionsC8coverage) => {
  // the path to the original source-file is required, as its contents are
  // used during the conversion algorithm.
  const converter = v8ToIstanbul(jsFilename)
  await converter.load() // this is required due to the async source-map dependency.
  // provide an array of coverage information in v8 format.

  // const c8coverage = require('./.v8-coverage/coverage.json')
  // const appCoverage = c8coverage.result[0].functions
  converter.applyCoverage(functionsC8coverage)

  // output coverage information in a form that can
  // be consumed by Istanbul.
  // console.info(JSON.stringify(converter.toIstanbul(), null, 2))
  return converter.toIstanbul()
}

function browserLaunchHandler (browser, launchOptions) {
  console.log('browser is', browser)
  if (browser.name !== 'chrome') {
    return log(
      ` Warning: An unsupported browser is used, output will not be logged to console: ${
        browser.name
      }`
    )
  }

  // find how Cypress is going to control Chrome browser
  const rdpArgument = launchOptions.args.find(arg => arg.startsWith('--remote-debugging-port'))
  if (!rdpArgument) {
    return log(`Could not find launch argument that starts with --remote-debugging-port`)
  }
  const rdp = parseInt(rdpArgument.split('=')[1])

  // and use this port ourselves too
  log(` Attempting to connect to Chrome Debugging Protocol on port ${rdp}`)

  const tryConnect = () => {
    new CDP({
      port: rdp
    })
      .then(_cdp => {
        cdp = _cdp
        log(' Connected to Chrome Debugging Protocol')

        /** captures logs from the browser */
        // cdp.Log.enable()
        // cdp.Log.entryAdded(logEntry)

        /** captures logs from console.X calls */
        // cdp.Runtime.enable()
        // cdp.Runtime.consoleAPICalled(logConsole)

        cdp.on('disconnect', () => {
          log(' Chrome Debugging Protocol disconnected')
          cdp = null
        })
      })
      .catch(() => {
        setTimeout(tryConnect, 100)
      })
  }

  tryConnect()
}

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('before:browser:launch', browserLaunchHandler)
  on('task', {
    beforeTest () {
      log('before test')

      if (cdp) {
        log('starting code coverage')
        const callCount = true
        const detailed = true

        return Promise.all([
          cdp.Profiler.enable(),
          cdp.Profiler.startPreciseCoverage(callCount, detailed)
        ])
      }

      return null
    },

    afterTest () {
      log('after test')

      if (cdp) {
        log('stopping code coverage')
        return cdp.Profiler.takePreciseCoverage().then(c8coverage => {
          // slice out unwanted scripts (like Cypress own specs)
          // minimatch would be better?
          const appFiles = /app\.js$/

          // for now just grab results for "app.js"
          const appC8coverage = c8coverage.result.find(script => {
            return appFiles.test(script.url)
          })
          // console.log(appC8coverage)
          return convertToIstanbul('./app.js', appC8coverage.functions)
          .then((istanbulCoverage) => {
            // result.result = result.result.filter(script =>
            //   appFiles.test(script.url)
            // )

            makeFolder()

            const filename = path.join(istanbulCoverageFolder, 'out.json')
            const str = JSON.stringify(istanbulCoverage, null, 2) + '\n'
            fs.writeFileSync(filename, str, 'utf8')

            // const filename = path.join(v8CoverageFolder, 'coverage.json')
            // fs.writeFileSync(filename, JSON.stringify(result, null, 2) + '\n')

            // const istanbulReports =
            // pti.write(result)
            // console.log('%o', appScripts[0].functions)
            // console.log('%o', istanbulReports)

            return cdp.Profiler.stopPreciseCoverage()
          })
        })
      }

      return null
    }
  })
}
