import { Species } from "./species";

export interface Message{
  answerID: string;
  encounterMeters: number;
  encounterMinutes: number;
  experimentID: string;
  name: string;
  severity: number;
  species: Species;
  text: string;
  trigger: string;
}