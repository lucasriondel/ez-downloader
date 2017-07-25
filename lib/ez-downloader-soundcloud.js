import fs from 'fs'
import chalk from 'chalk'
import request from 'request-promise-native'
import progress from 'request-progress'
import debugModule from 'debug'
import ProgressBar from 'progress'

const debug = debugModule('soundcloud')

class EzSoundcloudDownloader {
  constructor() {
    this.CLIENT_ID = 'a3e059563d7fd3372b49b37f00a00bcf'
  }

  download(track_url) {
    return new Promise((resolve, reject) => {
      let trackInfo = null, filename = null
      request(this.getTrackInfoURL(track_url))
      .then(response => {
        trackInfo = JSON.parse(response)
        filename = `${trackInfo.title}.${trackInfo.original_format}`
        debug(trackInfo)
        let downloadTrackPromise = request(this.getTrackStreamURL(trackInfo.id))
        let bar = null, lastChunk = 0, total = 0
        downloadTrackPromise.catch(err => {
          //TODO remove file if it already exist
          this.handleErrors(err)
        })
        return progress(downloadTrackPromise, {
        })
        .on('progress', function (state) {
          debug('progress')
          debug(state)
          if (bar == null) {
            bar = new ProgressBar('downloading [:bar] :percent :etas', {
              complete: '=',
              incomplete: ' ',
              width: 20,
              total: state.size.total
            })
            total = state.size.total
          }
          bar.tick(state.size.transferred - lastChunk)
          lastChunk = state.size.transferred
        })
        .on('error', function (err) {
          debug("error")
          debug(err)
        })
        .on('end', function () {
          debug("end")
          bar.tick(total)
          //TODO tag setting
          resolve({
            filename,
          })
        })
        .pipe(
          fs.createWriteStream(`${trackInfo.title}.${trackInfo.original_format}`)
        )
      })
      .catch(err => {
        debug("CATCHED ERROR")
        debug(err)
        //TODO error handling
      })
    })
  }

  getTrackInfoURL(track_url) {
    return "https://api.soundcloud.com/resolve.json?" +
    `url=${encodeURIComponent(track_url)}` +
    `&client_id=${this.CLIENT_ID}`
  }

  getTrackStreamURL(track_id) {
    debug("https://api.soundcloud.com/" +
    `tracks/${track_id}/stream` +
    `?client_id=${this.CLIENT_ID}`)
    return "https://api.soundcloud.com/" +
    `tracks/${track_id}/stream` +
    `?client_id=${this.CLIENT_ID}`
  }

  handleErrors(err) {
    // debug(err)
    // debug(err.name)
    // debug(err.message)
    // debug(JSON.stringify(err))
    if (err.name == "StatusCodeError" && err.statusCode == 429)
      console.error(chalk.red.bold("Maximum download limit has been reached. " +
      `Try again at ${JSON.parse(err.error).errors[0].meta.reset_time}`))
    else {
      console.error(chalk.red.bold("Unknown error"))
      console.error(err.message)
    }
  }
}

export default new EzSoundcloudDownloader()
