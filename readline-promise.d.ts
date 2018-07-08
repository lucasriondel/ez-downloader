import readline = require('readline-promise');
import { Stream } from 'stream';

declare namespace readline {
  declare function createInterface(options: ReadlineInterfaceOptions): ReadlineInterface;
}

export interface ReadlineInterface {
  questionAsync: (question: string) => Promise<string>;
}

export interface ReadlineInterfaceOptions {
  input: Stream.Readable;
  output: Stream.Readable;
  terminal: boolean;
}

export default readline;
