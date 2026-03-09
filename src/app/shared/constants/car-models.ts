export const CAR_MODELS = {
  SEDAN: {
    id: 'sedan',
    label: 'Turismo',
    icon: '🚗',
    speedMultiplier: 1.0
  },
  SPORTS: {
    id: 'sports',
    label: 'Deportivo',
    icon: '🏎️',
    speedMultiplier: 1.2
  },
  VAN: {
    id: 'van',
    label: 'Furgoneta',
    icon: '🚐',
    speedMultiplier: 0.9
  }
} as const;

export type CarModelId = keyof typeof CAR_MODELS;
