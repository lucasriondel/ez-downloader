import ID3Writer from 'browser-id3-writer'
import inquirer from 'inquirer'
import md5 from 'md5'
import request from 'request-promise-native'
import progress from 'request-progress'
import fs from 'fs'
import debugModule from 'debug'

const debug = debugModule('tagger');

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

  ATTACHED_PICTURE: 'APIC', //(attached picture)
}

class Tagger {
  askTagEdition(trackPath, defaultCoverUrl) {
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
      let questions = [
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
      ]
      let coverQuestion = {
        type: 'input',
        name: 'urlImageCover',
        message: 'Cover image url',
      }
      if (defaultCoverUrl)
        coverQuestion['default'] = defaultCoverUrl
      questions.push(coverQuestion)
      inquirer.prompt(questions).then(answers => {
        let tags = [
          { frame: frames.SONG_TITLE, value: answers.songTitle },
          { frame: frames.SONG_ARTISTS, value: [answers.songArtist] },
          { frame: frames.ALBUM_TITLE, value: answers.albumTitle },
        ]
        if (answers.urlImageCover) {
          let downloadCoverPromise = request(answers.urlImageCover)
          progress(downloadCoverPromise, {})
          .on('progress', function (state) {
            debug('progress')
          })
          .on('error', function (err) {
            debug("error")
            debug(err)
          })
          .on('end', (function () {
            debug("end")
            let cover = fs.readFileSync(`covers/${md5(answers.urlImageCover)}.jpg`)
            tags.push({
              frame: frames.ATTACHED_PICTURE,
              value: {
                type: 3,
                data: cover,
                description: `Cover for ${trackPath}`
              }
            })
            tags.push({
              frame: frames.ATTACHED_PICTURE,
              value: {
                type: 1,
                data: cover,
                description: `Cover for ${trackPath}`
              }
            })
            tags.push({
              frame: frames.ATTACHED_PICTURE,
              value: {
                type: 2,
                data: cover,
                description: `Cover for ${trackPath}`
              }
            })
            tags.push({
              frame: frames.ATTACHED_PICTURE,
              value: {
                type: 0,
                data: cover,
                description: `Cover for ${trackPath}`
              }
            })
            tags.push({
              frame: frames.ATTACHED_PICTURE,
              value: {
                type: 6,
                data: cover,
                description: `Cover for ${trackPath}`
              }
            })
            this.editTags(trackPath, tags)
          }).bind(this))
          .pipe(
            fs.createWriteStream(`covers/${md5(answers.urlImageCover)}.jpg`)
          )
        }
        else
          this.editTags(trackPath, tags)
      })
    })
  }

  editTags(trackPath, tags) {
    const writer = new ID3Writer(fs.readFileSync(trackPath))
    for (let tag of tags)
      writer.setFrame(tag.frame, tag.value)
    writer.addTag()

    const taggedSongBuffer = Buffer.from(writer.arrayBuffer)
    fs.writeFileSync(trackPath, taggedSongBuffer)
  }
}

export default new Tagger()
