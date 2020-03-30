function browserLaunchHandler (browser, launchOptions) {
  console.log('browser is', browser)
  if (browser.name !== 'chrome') {
    return console.log(
      ` Warning: An unsupported browser is used, output will not be logged to console: ${
        browser.name
      }`
    )
  }

  console.log('all browser arguments')
  console.log(launchOptions.args.join('\n'))

  // find how Cypress is going to control Chrome browser
  // and change the port number
  const rdp = 40000 + Math.round(Math.random() * 25000)
  console.log('plugin: new RDP port', rdp)
  // have to replace an item in the array without changing the reference
  launchOptions.args.forEach((arg, k) => {
    if (arg.startsWith('--remote-debugging-port')) {
      console.log('replacing "%s"', arg)
      launchOptions.args[k] = `--remote-debugging-port=${rdp}`
    }
  })

  console.log('updated browser arguments')
  console.log(launchOptions.args.join('\n'))

  return launchOptions
}

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('before:browser:launch', browserLaunchHandler)
}
