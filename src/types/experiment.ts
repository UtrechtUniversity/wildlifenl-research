import { LivingLab } from './livinglab';
import { User } from './user';

export interface Experiment {
  ID: string;
  name: string;
  description: string;
  start: string;
  end: string;
  user: User;
  livingLab: LivingLab;
  responses?: number;
  numberOfQuestionnaires?: number;
  numberOfMessages?: number;
  messageActivity: number;       
  questionnaireActivity: number;
}