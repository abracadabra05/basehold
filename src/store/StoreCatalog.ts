export interface StoreItem {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  type: 'currency' | 'booster';
  payload: {
    metal?: number;
    biomass?: number;
    booster?: 'double_rewards' | 'combat_overdrive';
    durationSec?: number;
  };
  rewardPayload?: {
    metal?: number;
    biomass?: number;
    booster?: 'double_rewards' | 'combat_overdrive';
    durationSec?: number;
  };
  rewardedAdsRequired?: number;
}

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'packbiomasss',
    titleKey: 'store_pack_biomass_s',
    descKey: 'store_pack_biomass_s_desc',
    icon: '🧬',
    type: 'currency',
    payload: { biomass: 300 },
    rewardPayload: { biomass: 120 },
    rewardedAdsRequired: 2,
  },
  {
    id: 'packbiomassl',
    titleKey: 'store_pack_biomass_l',
    descKey: 'store_pack_biomass_l_desc',
    icon: '🧪',
    type: 'currency',
    payload: { biomass: 1300 },
    rewardPayload: { biomass: 320 },
    rewardedAdsRequired: 3,
  },
  {
    id: 'packmetals',
    titleKey: 'store_pack_metal_s',
    descKey: 'store_pack_metal_s_desc',
    icon: '🔩',
    type: 'currency',
    payload: { metal: 450 },
    rewardPayload: { metal: 160 },
    rewardedAdsRequired: 2,
  },
  {
    id: 'boosterdouble',
    titleKey: 'store_booster_double_rewards',
    descKey: 'store_booster_double_rewards_desc',
    icon: '✨',
    type: 'booster',
    payload: { booster: 'double_rewards', durationSec: 420 },
  },
  {
    id: 'boosteroverdrive',
    titleKey: 'store_booster_overdrive',
    descKey: 'store_booster_overdrive_desc',
    icon: '🚀',
    type: 'booster',
    payload: { booster: 'combat_overdrive', durationSec: 420 },
  },
];

export const TECH_PRODUCT_PREFIX = 'tech';
