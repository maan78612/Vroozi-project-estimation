import { ProjectInterface } from './project.interface';

export interface FeatureFlagInterface {
  key: keyof ProjectInterface;
  label: string;
  hint: string;
}
