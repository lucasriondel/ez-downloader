import chalk from 'chalk';
import * as debugModule from 'debug';
import * as urlParse from 'url-parse';
import * as ProgressBar from 'progress';
import * as inquirer from 'inquirer';
import * as program from 'commander';

import EzDownloaderSoundcloud from './EzDownloaderSoundcloud';
import EzDownloaderYoutube from './EzDownloaderYoutube';
import Tagger, { UserFriendlyTags } from './Tagger';

const debug = debugModule('entry');

const ezDownloaderSoundcloud = new EzDownloaderSoundcloud();
const ezDownloaderYoutube = new EzDownloaderYoutube();
const tagger = new Tagger();

let bar: ProgressBar | null = null;

interface AskEditTag {
  editTags: 'No' | 'Yes';
}

const askTagEdition = async (filename: string, coverUrl?: string) => {
  const question: inquirer.Question<AskEditTag> = {
    type: 'list',
    name: 'editTags',
    message: 'Do you want to edit tags ?',
    choices: ['No', 'Yes'],
  };
  const answer = await inquirer.prompt<AskEditTag>(question);

  if (answer.editTags === 'No') return;

  console.log(`Tag edition for ${filename}`);
  const questions: inquirer.Questions<UserFriendlyTags> = [
    {
      type: 'input',
      name: 'title',
      message: 'Song title',
    },
    {
      type: 'input',
      name: 'artist',
      message: 'Song artist',
    },
    {
      type: 'input',
      name: 'album',
      message: 'Album title',
    },
    {
      type: 'input',
      name: 'coverURL',
      message: 'Cover image url',
      default: coverUrl || undefined,
    },
  ];

  const answers = await inquirer.prompt<UserFriendlyTags>(questions);
  await tagger.editTags(filename, answers);
};

const downloadFromSoundcloud = async (url: string, withTags: boolean) => {
  try {
    const result = await ezDownloaderSoundcloud.download(url, displayProgress);
    debug(chalk.green('Song downloaded !'));
    if (withTags) askTagEdition(result.filename, result.coverUrl);
  } catch (e) {
    console.error(chalk.red.bold(e));
  }
};

const downloadFromYoutube = async (url: string, withTags: boolean) => {
  try {
    const result = await ezDownloaderYoutube.download(url, displayProgress);
    debug(chalk.green('Song downloaded !'));
    if (withTags) askTagEdition(result.filename);
  } catch (e) {
    console.error(chalk.red.bold(e));
  }
  // TODO catch errors
};

const displayProgress = (chunk: number, total: number) => {
  if (bar === null)
    bar = new ProgressBar('downloading [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total,
    });
  bar.tick(chunk);
};

async function main() {
  program
    .name('ez')
    .arguments('<url ...>')
    .version(process.env.npm_package_version as string)
    .option('-n, --notags', 'Do not ask for tags')
    .parse(process.argv);

  const { notags, args } = program;
  debug(notags ? 'pas de tags' : 'tag');
  debug(args);

  if (args.length > 0) {
    for (const link of args) {
      debug(`TRACK_URL ${link}`);
      const parsedUrl = urlParse(link, true);
      if (parsedUrl.host === 'soundcloud.com' && parsedUrl.hostname === 'soundcloud.com') {
        await downloadFromSoundcloud(link, !program.notags);
      }
      // TODO handle short youtube links
      else if (parsedUrl.host === 'www.youtube.com' && parsedUrl.hostname === 'www.youtube.com') {
        await downloadFromYoutube(link, !program.notags);
      } else {
        debug(chalk.red('Wrong url, service not found.'));
      }
    }
  } else {
    // TODO stdin readder
  }
}

main();
