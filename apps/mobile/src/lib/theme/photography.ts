/** Decorative service imagery. Never used to represent a customer's task or a provider. */
export const photography = {
  home: require('../../../assets/photography/home-editorial.jpg'),
  cleaning: require('../../../assets/photography/cleaning-editorial.jpg'),
  handyman: require('../../../assets/photography/handyman-editorial.jpg'),
  moving: require('../../../assets/photography/moving-editorial.jpg'),
  assembly: require('../../../assets/photography/assembly-editorial.jpg'),
  gardening: require('../../../assets/photography/gardening-editorial.jpg'),
  other: require('../../../assets/photography/other.jpg'),
} as const;

export type ServiceImage = Exclude<keyof typeof photography, 'home'>;
