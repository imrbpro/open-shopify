import { prisma } from "./db";
import {
  DEFAULT_SETTINGS,
  parseSettings,
  serializeSetting,
  type ShopSettings
} from "./settings-defaults";

export { DEFAULT_SETTINGS, parseSettings, serializeSetting };
export type { ShopSettings };

export async function getShopSettings(shopId: string): Promise<ShopSettings> {
  const rows = await prisma.shopSetting.findMany({ where: { shopId } });
  return parseSettings(rows);
}

export async function setShopSetting(
  shopId: string,
  key: string,
  value: string | number | boolean
): Promise<void> {
  await prisma.shopSetting.upsert({
    where: { shopId_key: { shopId, key } },
    create: { shopId, key, value: serializeSetting(key, value) },
    update: { value: serializeSetting(key, value) }
  });
}

export async function setShopSettings(
  shopId: string,
  entries: Record<string, string | number | boolean>
): Promise<void> {
  await Promise.all(
    Object.entries(entries).map(([key, value]) => setShopSetting(shopId, key, value))
  );
}
