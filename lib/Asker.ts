import chalk, { Chalk } from 'chalk';
import readline, { ReadlineInterface } from 'readline-promise';

export default class Asker {
  private rlInterface: ReadlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  private prompt = chalk.white.bold('>');
  private choice = (choice: string) => chalk.white.inverse(`(${choice})`);
  private _question = (question: string, color: Chalk, choice?: string) =>
    color(`${question} ${choice ? `${this.choice(choice)} ` : ``}${this.prompt} `);

  private URLQuestion = () => this._question(`please type url`, chalk.bold.greenBright);
  private TagEditionQuestion = () =>
    this._question(`Do you want to edit tags ?`, chalk.bold.greenBright, 'y/n');
  private TagQuestion = (question: string, choice?: string) =>
    this._question(question, chalk.yellow, choice);

  public askForURL = async (): Promise<string> =>
    (await this.rlInterface.questionAsync(this.URLQuestion())).trim();

  public askForTagEdition = async (): Promise<boolean> => {
    const answer = await this.rlInterface.questionAsync(this.TagEditionQuestion());
    if (answer === '' || answer.length === 0 || answer.trim()[0] === 'y') return true;
    else if (answer.trim()[0] === 'n') return false;
    else return false;
  };

  public askForTag = async (question: string, choice?: string): Promise<string> => {
    const answer = await this.rlInterface.questionAsync(this.TagQuestion(question, choice));
    if (answer === '' || answer.length === 0) return choice || '';
    else return answer;
  };
}
