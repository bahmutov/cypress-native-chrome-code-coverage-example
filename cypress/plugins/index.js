const CDP = require('chrome-remote-interface')

function log (msg) {
  console.log(msg)
}

let cdp

function browserLaunchHandler (browser = {}, args) {
  if (!['chrome'].includes(browser.family)) {
    return log(
      ` Warning: An unsupported browser family was used, output will not be logged to console: ${
        browser.family
      }`
    )
  }

  const rdp = 40000 + Math.round(Math.random() * 25000)

  if (browser.family === 'chrome') {
    args.push(`--remote-debugging-port=${rdp}`)
  }

  log(' Attempting to connect to Chrome Debugging Protocol')

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

  return args
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
        return Promise.all([
          cdp.Profiler.enable(),
          cdp.Profiler.startPreciseCoverage()
        ])
      }

      return null
    },

    afterTest () {
      log('after test')

      if (cdp) {
        log('stopping code coverage')
        return cdp.Profiler.takePreciseCoverage().then(result => {
          console.log('%o', result)

          return cdp.Profiler.stopPreciseCoverage()
        })
      }

      return null
    }
  })
}
