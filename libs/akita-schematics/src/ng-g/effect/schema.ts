export interface Schema {
  name: string;
  path?: string;
  skipTests?: boolean;
  module?: string;
  flat?: boolean;
  root?: boolean;
  creators?: boolean;
  group?: boolean;
  minimal?: boolean;
}
