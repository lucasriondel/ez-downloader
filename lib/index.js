import chalk from 'chalk'
import program from 'commander'
import debugModule from 'debug'

import sc_downloader from './ez-downloader-soundcloud'

const debug = debugModule('entry')

program
  .version('0.0.1')
  .option('-s, --service [service_name]',
    'Set the service, either youtube or soundcloud')
  .option('-u, --url [url]',
    'Set the track url')
  .parse(process.argv)

if (program.service && program.url) {
  debug(`Service found : ${program.service == "soundcloud" ?
    chalk.yellow.bold(program.service) :
    chalk.red.bold(program.service)
  }`)
  debug(`Track url : ${program.url}`)
}
else if (program.url) {
  //TODO auto detect service based on url
  debug(`Track url : ${program.url}`)
}
else {
  console.error(chalk.red.bold("You have to set a track and a service name."));
  program.outputHelp()
}
// sc_downloader.download("https://soundcloud.com/migosatl/quavo-ft-lil-durk-x-cah-out-kinny")
