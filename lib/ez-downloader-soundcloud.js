import fs from 'fs';
import chalk from 'chalk';
import request from 'request-promise-native';
import progress from 'request-progress';
import debugModule from 'debug';
import sanitizeFilename from 'sanitize-filename'

const debug = debugModule('soundcloud');

class EzSoundcloudDownloader {
    constructor() {
        this.CLIENT_ID = 'a3e059563d7fd3372b49b37f00a00bcf'
    }

    _handleDownloadProgress(trackInfo, downloadTrackPromise, onProgress) {
        return new Promise((resolve, reject) => {
            let lastChunk = 0, total = 0;
            downloadTrackPromise.catch(err => {
                reject(this.handleErrors(err))
            });
            return progress(downloadTrackPromise, {})
                .on('progress', state => {
                    debug('progress');
                    total = state.size.total;
                    onProgress(state.size.transferred - lastChunk, total);
                    lastChunk = state.size.transferred;
                })
                .on('error', err => {
                    debug("error");
                    debug(err);
                    reject(err);
                })
                .on('end', () => {
                    debug("end");
                    onProgress(total, total);
                    resolve();
                })
                .pipe(
                    fs.createWriteStream(`${sanitizeFilename(trackInfo.title)}.${trackInfo.original_format}`)
                )
        });
    }

    async download(track_url, onProgress) {
        try {
            let trackInfo = JSON.parse(await request(this.getTrackInfoURL(track_url)));
            let filename = `${trackInfo.title}.${trackInfo.original_format}`;
            //TODO remove file if it already exist
            let coverUrl = trackInfo.artwork_url.replace(/large/gi, "t500x500");
            await this._handleDownloadProgress(
                trackInfo,
                request(this.getTrackStreamURL(trackInfo.id)),
                onProgress
            );
            return { filename: sanitizeFilename(filename), coverUrl }
        } catch (err) {
            debug("CATCHED ERROR");
            debug(err);
            //TODO error handling
            throw err;
        }
    }

    getTrackInfoURL(track_url) {
        return "https://api.soundcloud.com/resolve.json?" +
            `url=${encodeURIComponent(track_url)}` +
            `&client_id=${this.CLIENT_ID}`;
    }

    getTrackStreamURL(track_id) {
        debug("https://api.soundcloud.com/" +
            `tracks/${track_id}/stream` +
            `?client_id=${this.CLIENT_ID}`);
        return "https://api.soundcloud.com/" +
            `tracks/${track_id}/stream` +
            `?client_id=${this.CLIENT_ID}`;
    }

    handleErrors(err) {
        // debug(err);
        // debug(err.name);
        // debug(err.message);
        // debug(JSON.stringify(err));
        if (err.name === "StatusCodeError" && err.statusCode === 429)
            return new Error(chalk.red.bold("Maximum download limit has been reached. " +
                `Try again at ${JSON.parse(err.error).errors[0].meta.reset_time}`));
        else
            return new Error("Unknown error: " + err.message)
    }
}

export default new EzSoundcloudDownloader()
