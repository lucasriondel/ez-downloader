import * as ID3Writer from 'browser-id3-writer';
import * as md5 from 'md5';
import * as request from 'request-promise-native';
import * as progress from 'request-progress';
import * as fs from 'fs';
import * as debugModule from 'debug';

const debug = debugModule('tagger');

// see https://www.npmjs.com/package/browser-id3-writer
enum Frame {
  SONG_ARTISTS = 'TPE1', // song artists
  SONG_COMPOSERS = 'TCOM', // song composers
  SONG_GENRES = 'TCON', // song genres

  SONG_TITLE = 'TIT2', // song title
  ALBUM_TITLE = 'TALB', // album title
  ALBUM_ARTIST = 'TPE2', // album artist
  CONDUCTOR = 'TPE3', // conductor/performer refinement
  INTERPREDTED = 'TPE4', // interpreted, remixed, or otherwise modified by
  SONG_NUMBER = 'TRCK', // song number in album '5' or '5/10'
  ALBUM_DISC_NUMBER = 'TPOS', // album disc number '1' or '1/3'
  LABEL_NAME = 'TPUB', // label name
  INITIAL_KEY = 'TKEY', // initial key
  MEDIA_TYPE = 'TMED', // media type
  COMMERCIAL_INFORMATION = 'WCOM', // commercial information
  COPYRIGHT = 'WCOP', // copyright/Legal information
  OFFICIAL_AUDIO_FILE_WEBPAGE = 'WOAF', // official audio file webpage
  OFFICIAL_ARTIST = 'WOAR', // official artist/performer webpage
  OFFICIAL_AUDIO_SOURCE_WEBPAGE = 'WOAS', // official audio source webpage
  OFFICIAL_INTERNET_RADIO = 'WORS', // official internet radio station homepage
  OFFICIAL_PAYEMENT = 'WPAY', // payment
  PUBLISHERS_OFFICIAL_WEBPAGE = 'WPUB', // publishers official webpage

  SONG_DURATION = 'TLEN', // song duration in milliseconds
  ALBUM_RELEASE_YEAR = 'TYER', // album release year
  BEATS_PER_MINUTE = 'TBPM', // beats per minute

  ATTACHED_PICTURE = 'APIC', // attached picture
}

interface Tag {
  frame: Frame;
  value:
    | {
        type: number;
        data: Buffer;
        description: string;
      }
    | string
    | string[];
}

export interface UserFriendlyTags {
  title: string;
  artist: string | string[];
  album: string;
  coverURL?: string;
}

export default class Tagger {
  private coverPathToTags(coverPath: string) {
    const cover = fs.readFileSync(coverPath);

    return [3, 1, 2, 0, 6].map((type: number) => ({
      frame: Frame.ATTACHED_PICTURE,
      value: {
        type,
        data: cover,
        description: `Cover`,
      },
    }));
  }

  public downloadCover(url: string, prefix: string): Promise<string> {
    return new Promise((resolve, reject) => {
      progress(request(url), {})
        .on('progress', (state: any) => {
          debug('progress');
          debug(state);
        })
        .on('error', (err: any) => {
          debug('error');
          debug(err);
          reject(err);
        })
        .on('end', () => {
          debug('end');
          resolve(`covers/${prefix}-${md5(url)}.jpg`);
        })
        .pipe(fs.createWriteStream(`covers/${prefix}-${md5(url)}.jpg`));
    });
  }

  public async editTags(trackPath: string, newTags: UserFriendlyTags) {
    if (fs.existsSync(process.cwd() + "'" + trackPath))
      throw new Error(`${trackPath} doesn't exist`);

    const { title, artist, album, coverURL } = newTags;
    const tags: Tag[] = [
      { frame: Frame.SONG_TITLE, value: title },
      { frame: Frame.SONG_ARTISTS, value: Array.isArray(artist) ? artist : [artist] },
      { frame: Frame.ALBUM_TITLE, value: album },
    ];
    if (coverURL) {
      const artistFormatted = Array.isArray(artist) ? artist.join(', ') : artist;
      tags.concat(
        this.coverPathToTags(await this.downloadCover(coverURL, `${title} - ${artistFormatted}`)),
      );
    }

    const writer = new ID3Writer(fs.readFileSync(trackPath));
    for (const tag of tags) writer.setFrame(tag.frame, tag.value);
    writer.addTag();

    const taggedSongBuffer = Buffer.from(writer.arrayBuffer);
    fs.writeFileSync(trackPath, taggedSongBuffer);
  }
}
