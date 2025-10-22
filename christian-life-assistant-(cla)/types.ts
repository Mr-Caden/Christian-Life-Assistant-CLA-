export interface Message {
  role: 'user' | 'model';
  content: string;
  suggestions?: string[];
}

export interface Verse {
  reference: string;
  text: string;
  version: string;
  topic?: string;
}
