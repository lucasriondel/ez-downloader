import { Track, OnProgressFunction } from './misc';
import * as fs from 'fs';
import chalk from 'chalk';
import * as request from 'request-promise-native';
import * as progress from 'request-progress';
import * as debugModule from 'debug';
import * as sanitizeFilename from 'sanitize-filename';

const debug = debugModule('soundcloud');

interface DownloadState {
  time: {
    elapsed: number;
    remaining?: any;
  };
  speed?: any;
  percent: number;
  size: {
    total: number;
    transferred: number;
  };
}

interface TrackInfo {
  kind: string;
  id: number;
  created_at: string;
  user_id: number;
  duration: number;
  commentable: boolean;
  state: string;
  original_content_size: number;
  last_modified: string;
  sharing: string;
  tag_list: string;
  permalink: string;
  streamable: boolean;
  embeddable_by: string;
  purchase_url?: any;
  purchase_title?: any;
  label_id?: any;
  genre: string;
  title: string;
  description: string;
  label_name?: any;
  release?: any;
  track_type?: any;
  key_signature?: any;
  isrc?: any;
  video_url?: any;
  bpm?: any;
  release_year?: any;
  release_month?: any;
  release_day?: any;
  original_format: string;
  license: string;
  uri: string;
  user: {
    id: number;
    kind: string;
    permalink: string;
    username: string;
    last_modified: string;
    uri: string;
    permalink_url: string;
    avatar_url: string;
  };
  permalink_url: string;
  artwork_url: string;
  stream_url: string;
  download_url: string;
  playback_count: number;
  download_count: number;
  favoritings_count: number;
  reposts_count: number;
  comment_count: number;
  downloadable: boolean;
  waveform_url: string;
  attachments_uri: string;
  policy: string;
  monetization_model: string;
}

const baseRouteAPI = 'https://api.soundcloud.com';

export default class EzDownloaderSoundcloud {
  private CLIENT_ID: string;
  constructor() {
    this.CLIENT_ID = 'a3e059563d7fd3372b49b37f00a00bcf';
  }

  private handleDownloadProgress(
    trackInfo: TrackInfo,
    downloadTrackPromise: request.RequestPromise<any>,
    onProgress: OnProgressFunction,
  ) {
    return new Promise((resolve, reject) => {
      let lastChunk = 0,
        total = 0;
      downloadTrackPromise.catch((err: any) => {
        reject(this.handleErrors(err));
      });
      return progress(downloadTrackPromise, {})
        .on('progress', (state: DownloadState) => {
          total = state.size.total;
          onProgress(state.size.transferred - lastChunk, total);
          lastChunk = state.size.transferred;
        })
        .on('error', (err: any) => {
          debug('error');
          reject(err);
        })
        .on('end', () => {
          debug('end');
          onProgress(total, total);
          resolve();
        })
        .pipe(
          fs.createWriteStream(`${sanitizeFilename(trackInfo.title)}.${trackInfo.original_format}`),
        );
    });
  }

  public async download(trackUrl: string, onProgress: OnProgressFunction): Promise<Track> {
    try {
      const trackInfoURL = `${baseRouteAPI}/resolve.json?url=${encodeURIComponent(
        trackUrl,
      )}&client_id=${this.CLIENT_ID}`;
      const trackInfo = JSON.parse(await request(trackInfoURL)) as TrackInfo;
      const filename = `${trackInfo.title}.${trackInfo.original_format}`;
      const trackStreamURL = `${baseRouteAPI}/tracks/${trackInfo.id}/stream?client_id=${
        this.CLIENT_ID
      }`;
      // TODO remove file if it already exist
      const coverUrl = trackInfo.artwork_url.replace(/large/gi, 't500x500');
      await this.handleDownloadProgress(trackInfo, request(trackStreamURL), onProgress);
      return { filename: sanitizeFilename(filename), coverUrl };
    } catch (err) {
      debug('CATCHED ERROR');
      debug(err);
      // TODO error handling
      throw err;
    }
  }

  private handleErrors(err: any) {
    debug(err);
    debug(err.name);
    debug(err.message);
    debug(JSON.stringify(err));
    if (err.name === 'StatusCodeError' && err.statusCode === 429)
      return new Error(
        chalk.red.bold(
          'Maximum download limit has been reached. ' +
            `Try again at ${JSON.parse(err.error).errors[0].meta.reset_time}`,
        ),
      );
    else return new Error('Unknown error: ' + err.message);
  }
}
