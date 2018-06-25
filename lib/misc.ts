export interface Track {
  filename: string;
  coverUrl?: string;
}

export type OnProgressFunction = (chunk: any, total: any) => void;
