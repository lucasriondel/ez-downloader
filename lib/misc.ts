import * as mkdirp from 'mkdirp';

export interface Track {
  filename: string;
  coverUrl?: string;
}

export type OnProgressFunction = (chunk: any, total: any) => void;

export const initDir = async (dirPath: string) => {
  return new Promise((resolve, reject) => {
    mkdirp(dirPath, (err, made) => {
      if (err) reject(new Error(`error during folder ${dirPath} initialisation: ${err}`));
      else resolve();
    });
  });
};
