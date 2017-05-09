import ID3Writer from 'browser-id3-writer'
import inquirer from 'inquirer'
import fs from 'fs'

// see https://www.npmjs.com/package/browser-id3-writer
const frames = {
  SONG_ARTISTS: 'TPE1', //(song artists)
  SONG_COMPOSERS: 'TCOM', //(song composers)
  SONG_GENRES: 'TCON', //(song genres)

  SONG_TITLE: 'TIT2', //(song title)
  ALBUM_TITLE: 'TALB', //(album title)
  ALBUM_ARTIST: 'TPE2', //(album artist)
  CONDUCTOR: 'TPE3', //(conductor/performer refinement)
  INTERPREDTED: 'TPE4', //(interpreted, remixed, or otherwise modified by)
  SONG_NUMBER: 'TRCK', //(song number in album) '5' or '5/10'
  ALBUM_DISC_NUMBER: 'TPOS', //(album disc number) '1' or '1/3'
  LABEL_NAME: 'TPUB', //(label name)
  INITIAL_KEY: 'TKEY', //(initial key)
  MEDIA_TYPE: 'TMED', //(media type)
  COMMERCIAL_INFORMATION: 'WCOM', //(commercial information)
  COPYRIGHT: 'WCOP', //(copyright/Legal information)
  OFFICIAL_AUDIO_FILE_WEBPAGE: 'WOAF', //(official audio file webpage)
  OFFICIAL_ARTIST: 'WOAR', //(official artist/performer webpage)
  OFFICIAL_AUDIO_SOURCE_WEBPAGE: 'WOAS', //(official audio source webpage)
  OFFICIAL_INTERNET_RADIO: 'WORS', //(official internet radio station homepage)
  OFFICIAL_PAYEMENT: 'WPAY', //(payment)
  PUBLISHERS_OFFICIAL_WEBPAGE: 'WPUB', //(publishers official webpage)

  SONG_DURATION: 'TLEN', //(song duration in milliseconds)
  ALBUM_RELEASE_YEAR: 'TYER', //(album release year)
  BEATS_PER_MINUTE: 'TBPM', //(beats per minute)
}

class Tagger {
  editTags(trackPath) {
    inquirer.prompt({
      type: 'list',
      name: 'editTags',
      message: 'Do you want to edit tags ?',
      choices: [
        'No',
        'Yes',
      ]
    }).then(answer => {
      if (answer.editTags == 'No')
        return;
      console.log(`Tag edition for ${trackPath}`)
      inquirer.prompt([
        {
          type: 'input',
          name: 'songTitle',
          message: 'Song titles',
        },
        {
          type: 'input',
          name: 'songArtist',
          message: 'Song artist',
        },
        {
          type: 'input',
          name: 'albumTitle',
          message: 'Album title',
        },
      ]).then(answers => {
        const writer = new ID3Writer(fs.readFileSync(trackPath))
        writer.setFrame(frames.SONG_TITLE, answers.songTitle)
        .setFrame(frames.SONG_ARTISTS, [answers.songArtist])
        .setFrame(frames.ALBUM_TITLE, answers.albumTitle)
        writer.addTag();

        const taggedSongBuffer = Buffer.from(writer.arrayBuffer);
        fs.writeFileSync(trackPath, taggedSongBuffer);
      })
    })
  }
}

export default new Tagger()
