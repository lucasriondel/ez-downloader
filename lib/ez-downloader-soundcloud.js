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

  _handleDownloadProgress(trackInfo, downloadTrackPromise) {
    return new Promise(function(resolve, reject) {
      let bar = null, lastChunk = 0, total = 0
      downloadTrackPromise.catch(err => {
        this.handleErrors(err)
      })
      return progress(downloadTrackPromise, {})
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
        reject(err)
      })
      .on('end', function () {
        debug("end")
        bar.tick(total)
        resolve()
      })
      .pipe(
        fs.createWriteStream(`${trackInfo.title}.${trackInfo.original_format}`)
      )
    });
  }

  async download(track_url) {
    try {
      let trackInfo = JSON.parse(await request(this.getTrackInfoURL(track_url)))
      let filename = `${trackInfo.title}.${trackInfo.original_format}`
      //TODO remove file if it already exist
      let coverUrl = trackInfo.artwork_url.replace(/large/gi, "t500x500")
      await this._handleDownloadProgress(trackInfo,
        request(this.getTrackStreamURL(trackInfo.id)))
      return { filename, coverUrl }
    } catch (err) {
      debug("CATCHED ERROR")
      debug(err)
      //TODO error handling
      throw err
    }
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
