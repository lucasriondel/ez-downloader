import fs from 'fs'
import request from 'request-promise-native'
import progress from 'request-progress'
import debugModule from 'debug'

const debug = debugModule('soundcloud')

class EzSoundcloudDownloader {
  constructor() {
    this.CLIENT_ID = 'bed20744714e9c5962c351efe15840ff'
  }

  download(track_url) {
    let trackInfo = null
    request(this.getTrackInfoURL(track_url))
    .then(response => {
        let trackInfo = JSON.parse(response)
        debug(trackInfo)
        return progress(request(this.getTrackStreamURL(trackInfo.id)), {
        })
        .on('progress', function (state) {
          console.log('progress', state);
        })
        .on('error', function (err) {
          console.log("error")
        })
        .on('end', function () {
          console.log("fini")
        })
        .pipe(
          fs.createWriteStream(`${trackInfo.title}.${trackInfo.original_format}`)
        )
    })
  }

  getTrackInfoURL(track_url) {
    return "https://api.soundcloud.com/resolve.json?" +
    `url=${encodeURIComponent(track_url)}` +
    `&client_id=${this.CLIENT_ID}`
  }

  getTrackStreamURL(track_id) {
    console.log("https://api.soundcloud.com/" +
    `tracks/${track_id}/stream` +
    `?client_id=${this.CLIENT_ID}`)
    return "https://api.soundcloud.com/" +
    `tracks/${track_id}/stream` +
    `?client_id=${this.CLIENT_ID}`
  }

  getTrackDownloadURL(track_id) {
    console.log("https://api.soundcloud.com/" +
    `tracks/${track_id}/download?` +
    `client_id=${this.CLIENT_ID}`)
    return "https://api.soundcloud.com/" +
    `tracks/${track_id}/download?` +
    `client_id=${this.CLIENT_ID}`
  }
}

export default new EzSoundcloudDownloader()
