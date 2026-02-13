export type PseudoMemory = {
  visits: number;
  lastSeen: number;

  coreThemes: Record<string, number>;
  tensions: Record<string, number>;
  avoidances: Record<string, number>;

  anchors: string[]; 
};