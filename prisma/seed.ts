import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLAN_SEEDS } from "../src/lib/plans";
import { THEME_PRESETS, serializeThemeConfig } from "../src/lib/theme";
import { DEFAULT_SETTINGS, serializeSetting } from "../src/lib/settings-defaults";
import { computeDiscountAmount, computeTotals, isFreeShippingDiscount } from "../src/lib/discounts";
import { addDays } from "../src/lib/utils";

const prisma = new PrismaClient();
const now = new Date();

type SeedVariant = {
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  inventoryQty: number;
};

type SeedProduct = {
  handle: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  image: string;
  status?: string;
  variants: SeedVariant[];
};

const products: SeedProduct[] = [
  {
    handle: "everyday-tee",
    title: "Everyday Tee",
    description:
      "A midweight organic cotton tee with a relaxed fit and a collar that keeps its shape. Garment-dyed for a lived-in feel from day one.",
    vendor: "Northwind Supply",
    productType: "Apparel",
    tags: ["apparel", "new", "bestseller", "cotton"],
    image: "/images/product-1.svg",
    variants: [
      { title: "S", sku: "NW-TEE-S", price: 2800, compareAtPrice: 3400, cost: 900, inventoryQty: 42 },
      { title: "M", sku: "NW-TEE-M", price: 2800, compareAtPrice: 3400, cost: 900, inventoryQty: 38 },
      { title: "L", sku: "NW-TEE-L", price: 2800, compareAtPrice: 3400, cost: 900, inventoryQty: 31 }
    ]
  },
  {
    handle: "heavyweight-hoodie",
    title: "Heavyweight Hoodie",
    description:
      "Built from 480gsm loopback cotton with a double-lined hood, ribbed cuffs and a boxy cut. The kind of hoodie you keep for a decade.",
    vendor: "Northwind Supply",
    productType: "Apparel",
    tags: ["apparel", "new", "bestseller", "winter"],
    image: "/images/product-2.svg",
    variants: [
      { title: "S", sku: "NW-HOOD-S", price: 6800, cost: 2600, inventoryQty: 12 },
      { title: "M", sku: "NW-HOOD-M", price: 6800, cost: 2600, inventoryQty: 8 },
      { title: "L", sku: "NW-HOOD-L", price: 6800, cost: 2600, inventoryQty: 15 },
      { title: "XL", sku: "NW-HOOD-XL", price: 6800, cost: 2600, inventoryQty: 6 }
    ]
  },
  {
    handle: "canvas-tote",
    title: "Market Canvas Tote",
    description:
      "A 16oz washed canvas tote with an interior pocket and vegetable-tanned leather handles. Holds a week of groceries or a laptop and lunch.",
    vendor: "Atelier No. 8",
    productType: "Accessories",
    tags: ["accessories", "bestseller", "canvas"],
    image: "/images/product-3.svg",
    variants: [
      { title: "Default Title", sku: "A8-TOTE", price: 2400, cost: 800, inventoryQty: 60 }
    ]
  },
  {
    handle: "ceramic-mug",
    title: "Hand-Thrown Ceramic Mug",
    description:
      "Wheel-thrown stoneware in a speckled matte glaze. Each mug is slightly different, holds 12oz, and is dishwasher safe.",
    vendor: "Atelier No. 8",
    productType: "Home",
    tags: ["home", "new", "ceramic"],
    image: "/images/product-4.svg",
    variants: [
      { title: "Sand", sku: "A8-MUG-SAND", price: 1800, cost: 550, inventoryQty: 25 },
      { title: "Ink", sku: "A8-MUG-INK", price: 1800, cost: 550, inventoryQty: 19 }
    ]
  },
  {
    handle: "field-notebook",
    title: "Field Notebook",
    description:
      "Pocket-sized, stitch-bound notebook with 64 pages of 100gsm dot grid paper. Board cover resists coffee and rain.",
    vendor: "Northwind Supply",
    productType: "Stationery",
    tags: ["stationery", "paper"],
    image: "/images/product-5.svg",
    variants: [
      { title: "Default Title", sku: "NW-NOTE", price: 1400, cost: 400, inventoryQty: 0 }
    ]
  },
  {
    handle: "enamel-pin",
    title: "North Star Enamel Pin",
    description:
      "A hard enamel pin with gold plating and a rubber clutch. Designed in-house and made in small batches.",
    vendor: "Northwind Supply",
    productType: "Accessories",
    tags: ["accessories", "bestseller", "gifts"],
    image: "/images/product-6.svg",
    variants: [
      { title: "Default Title", sku: "NW-PIN", price: 900, cost: 200, inventoryQty: 120 }
    ]
  },
  {
    handle: "leather-wallet",
    title: "Fold Leather Wallet",
    description:
      "A slim bifold cut from full-grain vegetable-tanned leather. Six card slots and a cash sleeve that softens beautifully with age.",
    vendor: "Atelier No. 8",
    productType: "Accessories",
    tags: ["accessories", "bestseller", "leather"],
    image: "/images/product-7.svg",
    variants: [
      { title: "Default Title", sku: "A8-WALLET", price: 5400, compareAtPrice: 6400, cost: 2100, inventoryQty: 18 }
    ]
  },
  {
    handle: "wool-beanie",
    title: "Ribbed Wool Beanie",
    description:
      "Fine-gauge merino beanie with a double-fold cuff. Warm, breathable, and soft enough to forget you're wearing it.",
    vendor: "Northwind Supply",
    productType: "Apparel",
    tags: ["apparel", "new", "winter", "wool"],
    image: "/images/product-8.svg",
    variants: [
      { title: "Charcoal", sku: "NW-BEANIE-CHAR", price: 3200, cost: 1100, inventoryQty: 22 },
      { title: "Oat", sku: "NW-BEANIE-OAT", price: 3200, cost: 1100, inventoryQty: 2 }
    ]
  },
  {
    handle: "desk-lamp",
    title: "Pivot Desk Lamp",
    description:
      "A powder-coated steel task lamp with a weighted base and a fully articulating arm. Warm 2700K bulb included.",
    vendor: "Atelier No. 8",
    productType: "Home",
    tags: ["home", "lighting"],
    image: "/images/product-9.svg",
    variants: [
      { title: "Default Title", sku: "A8-LAMP", price: 8900, cost: 3400, inventoryQty: 7 }
    ]
  },
  {
    handle: "linen-throw",
    title: "Stonewashed Linen Throw",
    description:
      "A generously sized throw woven from European flax and stonewashed for softness. Gets better with every wash.",
    vendor: "Atelier No. 8",
    productType: "Home",
    tags: ["home", "bestseller", "linen"],
    image: "/images/product-10.svg",
    variants: [
      { title: "Default Title", sku: "A8-THROW", price: 7400, cost: 2800, inventoryQty: 14 }
    ]
  },
  {
    handle: "travel-bottle",
    title: "Insulated Travel Bottle",
    description:
      "Double-walled stainless steel, 20oz, with a leakproof cap. Keeps coffee hot for 8 hours and water cold for 24.",
    vendor: "Northwind Supply",
    productType: "Accessories",
    tags: ["accessories", "travel"],
    image: "/images/product-11.svg",
    variants: [
      { title: "Default Title", sku: "NW-BOTTLE", price: 2600, cost: 900, inventoryQty: 3 }
    ]
  },
  {
    handle: "soy-candle",
    title: "Small-Batch Soy Candle",
    description:
      "Hand-poured soy wax with a cotton wick and a 45-hour burn time. Housed in a reusable amber glass tumbler.",
    vendor: "Atelier No. 8",
    productType: "Home",
    tags: ["home", "gifts", "new"],
    image: "/images/product-12.svg",
    variants: [
      { title: "Cedar", sku: "A8-CANDLE-CEDAR", price: 2200, cost: 700, inventoryQty: 34 },
      { title: "Citrus", sku: "A8-CANDLE-CITRUS", price: 2200, cost: 700, inventoryQty: 27 }
    ]
  }
];

const customersSeed = [
  { email: "jordan@example.com", firstName: "Jordan", lastName: "Lee", phone: "+1 415 555 0132", tags: "vip,wholesale" },
  { email: "sam@example.com", firstName: "Sam", lastName: "Rivera", phone: "+1 415 555 0177", tags: "returning" },
  { email: "priya@example.com", firstName: "Priya", lastName: "Nair", phone: "+1 510 555 0198", tags: "vip" },
  { email: "noah@example.com", firstName: "Noah", lastName: "Kim", phone: "+1 650 555 0120", tags: "" },
  { email: "maya@example.com", firstName: "Maya", lastName: "Chen", phone: "+1 415 555 0104", tags: "newsletter" },
  { email: "lucas@example.com", firstName: "Lucas", lastName: "Moreau", phone: "+1 925 555 0166", tags: "" },
  { email: "ava@example.com", firstName: "Ava", lastName: "Thompson", phone: "+1 707 555 0133", tags: "vip,newsletter" },
  { email: "eli@example.com", firstName: "Eli", lastName: "Haddad", phone: "+1 415 555 0188", tags: "returning" }
];

async function clear() {
  await prisma.emailMessage.deleteMany();
  await prisma.event.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.appInstallation.deleteMany();
  await prisma.app.deleteMany();
  await prisma.shopSetting.deleteMany();
  await prisma.shippingRate.deleteMany();
  await prisma.review.deleteMany();
  await prisma.collectionProduct.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.fulfillment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.page.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plan.deleteMany();
}

async function main() {
  await clear();

  for (const plan of PLAN_SEEDS) {
    await prisma.plan.create({
      data: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        trialDays: plan.trialDays,
        productLimit: plan.productLimit,
        staffLimit: plan.staffLimit,
        transactionFeeBps: plan.transactionFeeBps,
        cardRateBps: plan.cardRateBps,
        cardFixedCents: plan.cardFixedCents,
        features: plan.features.join("\n"),
        sortOrder: plan.sortOrder
      }
    });
  }

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const owner = await prisma.user.create({
    data: { email: "owner@demo.com", name: "Alex Morgan", passwordHash }
  });
  const staff = await prisma.user.create({
    data: { email: "staff@demo.com", name: "Riley Chen", passwordHash }
  });

  const shop = await prisma.shop.create({
    data: {
      name: "Northwind Supply",
      slug: "demo",
      email: "hello@northwindsupply.test",
      description:
        "Timeless essentials, responsibly made. Apparel, accessories, and home goods from small workshops.",
      currency: "USD",
      country: "US",
      timezone: "America/Los_Angeles"
    }
  });

  await prisma.membership.createMany({
    data: [
      { userId: owner.id, shopId: shop.id, role: "OWNER" },
      { userId: staff.id, shopId: shop.id, role: "STAFF" }
    ]
  });

  const subscription = await prisma.subscription.create({
    data: {
      shopId: shop.id,
      planId: "shopify",
      status: "ACTIVE",
      currentPeriodStart: addDays(now, -5),
      currentPeriodEnd: addDays(now, 25)
    }
  });

  await prisma.invoice.createMany({
    data: [
      {
        subscriptionId: subscription.id,
        number: "INV-1001",
        amount: 10500,
        status: "PAID",
        periodStart: addDays(now, -35),
        periodEnd: addDays(now, -5),
        createdAt: addDays(now, -35)
      },
      {
        subscriptionId: subscription.id,
        number: "INV-1002",
        amount: 10500,
        status: "PAID",
        periodStart: addDays(now, -5),
        periodEnd: addDays(now, 25),
        createdAt: addDays(now, -5)
      }
    ]
  });

  await prisma.shopSetting.createMany({
    data: Object.entries({ ...DEFAULT_SETTINGS, taxRatePct: 8.25 }).map(([key, value]) => ({
      shopId: shop.id,
      key,
      value: serializeSetting(key, value as string | number | boolean)
    }))
  });

  const themes = [
    { name: "Dawn", role: "MAIN", preset: "dawn" },
    { name: "Spotlight", role: "UNPUBLISHED", preset: "spotlight" },
    { name: "Organic", role: "UNPUBLISHED", preset: "organic" }
  ];
  for (const theme of themes) {
    await prisma.theme.create({
      data: {
        shopId: shop.id,
        name: theme.name,
        role: theme.role,
        preset: theme.preset,
        configJson: serializeThemeConfig(THEME_PRESETS[theme.preset].config)
      }
    });
  }

  await prisma.shippingRate.createMany({
    data: [
      { shopId: shop.id, name: "Standard shipping", price: 500, minSubtotal: 7500 },
      { shopId: shop.id, name: "Express shipping", price: 1500, minSubtotal: 0 },
      { shopId: shop.id, name: "Local pickup", price: 0, minSubtotal: 0 }
    ]
  });

  const productRecords = new Map<string, { id: string; image: string; title: string }>();
  const variantRecords = new Map<string, { id: string; price: number; title: string; productId: string; productTitle: string; image: string; sku: string }>();

  for (const p of products) {
    const record = await prisma.product.create({
      data: {
        shopId: shop.id,
        title: p.title,
        handle: p.handle,
        description: p.description,
        vendor: p.vendor,
        productType: p.productType,
        tags: p.tags.join(","),
        status: p.status ?? "ACTIVE",
        image: p.image,
        images: { create: [{ url: p.image, alt: p.title, position: 0 }] },
        variants: {
          create: p.variants.map((v, index) => ({
            title: v.title,
            sku: v.sku,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            cost: v.cost ?? null,
            inventoryQty: v.inventoryQty,
            trackInventory: true,
            position: index
          }))
        }
      },
      include: { variants: true }
    });
    productRecords.set(p.handle, { id: record.id, image: p.image, title: p.title });
    for (const variant of record.variants) {
      if (!variant.sku) continue;
      variantRecords.set(variant.sku, {
        id: variant.id,
        price: variant.price,
        title: variant.title,
        productId: record.id,
        productTitle: record.title,
        image: p.image,
        sku: variant.sku
      });
    }
  }

  const newArrivals = await prisma.collection.create({
    data: {
      shopId: shop.id,
      title: "New Arrivals",
      handle: "new-arrivals",
      description: "The latest pieces to land in the workshop.",
      image: "/images/product-2.svg",
      type: "MANUAL"
    }
  });
  const bestSellers = await prisma.collection.create({
    data: {
      shopId: shop.id,
      title: "Best Sellers",
      handle: "best-sellers",
      description: "The pieces our customers come back for.",
      image: "/images/product-1.svg",
      type: "MANUAL"
    }
  });
  const homeLiving = await prisma.collection.create({
    data: {
      shopId: shop.id,
      title: "Home & Living",
      handle: "home-living",
      description: "Objects for slow mornings and quiet evenings.",
      image: "/images/product-9.svg",
      type: "AUTOMATED",
      rulesJson: JSON.stringify({ productType: "Home" })
    }
  });

  const linkProducts = async (collectionId: string, handles: string[]) => {
    let position = 0;
    for (const handle of handles) {
      const product = productRecords.get(handle);
      if (!product) continue;
      await prisma.collectionProduct.create({
        data: { collectionId, productId: product.id, position: position++ }
      });
    }
  };
  await linkProducts(newArrivals.id, ["everyday-tee", "heavyweight-hoodie", "ceramic-mug", "wool-beanie", "soy-candle"]);
  await linkProducts(bestSellers.id, ["everyday-tee", "canvas-tote", "enamel-pin", "leather-wallet", "linen-throw"]);

  const customers = new Map<string, { id: string }>();
  for (const c of customersSeed) {
    const customer = await prisma.customer.create({
      data: {
        shopId: shop.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        tags: c.tags,
        marketingOptIn: c.tags.includes("newsletter"),
        createdAt: addDays(now, -45)
      }
    });
    customers.set(c.email, { id: customer.id });
  }

  await prisma.address.createMany({
    data: [
      {
        customerId: customers.get("jordan@example.com")!.id,
        name: "Jordan Lee",
        line1: "482 Valencia Street",
        city: "San Francisco",
        province: "CA",
        zip: "94103",
        country: "US",
        phone: "+1 415 555 0132",
        isDefault: true
      },
      {
        customerId: customers.get("priya@example.com")!.id,
        name: "Priya Nair",
        line1: "1180 Solano Avenue",
        city: "Berkeley",
        province: "CA",
        zip: "94706",
        country: "US",
        phone: "+1 510 555 0198",
        isDefault: true
      }
    ]
  });

  const discounts = await prisma.discount.createMany({
    data: [
      { shopId: shop.id, code: "WELCOME10", type: "PERCENTAGE", value: 10, minSubtotal: 0, usageLimit: 500, usedCount: 1, oncePerCustomer: false, status: "ACTIVE" },
      { shopId: shop.id, code: "FREESHIP", type: "FREE_SHIPPING", value: 0, minSubtotal: 7500, usageLimit: null, usedCount: 4, oncePerCustomer: false, status: "ACTIVE" },
      { shopId: shop.id, code: "SAVE5", type: "FIXED", value: 500, minSubtotal: 5000, usageLimit: 100, usedCount: 12, oncePerCustomer: true, status: "ACTIVE" },
      { shopId: shop.id, code: "SUMMER25", type: "PERCENTAGE", value: 25, minSubtotal: 0, usageLimit: 200, usedCount: 200, oncePerCustomer: false, status: "DISABLED" }
    ]
  });
  void discounts;

  const discountMap = new Map<string, { code: string; type: string; value: number; minSubtotal: number }>();
  discountMap.set("WELCOME10", { code: "WELCOME10", type: "PERCENTAGE", value: 10, minSubtotal: 0 });
  discountMap.set("FREESHIP", { code: "FREESHIP", type: "FREE_SHIPPING", value: 0, minSubtotal: 7500 });

  const addresses = [
    { name: "Jordan Lee", line1: "482 Valencia Street", city: "San Francisco", province: "CA", zip: "94103", country: "US" },
    { name: "Sam Rivera", line1: "77 Dolores Terrace", city: "San Francisco", province: "CA", zip: "94110", country: "US" },
    { name: "Priya Nair", line1: "1180 Solano Avenue", city: "Berkeley", province: "CA", zip: "94706", country: "US" },
    { name: "Noah Kim", line1: "220 University Avenue", city: "Palo Alto", province: "CA", zip: "94301", country: "US" },
    { name: "Maya Chen", line1: "58 Clement Street", city: "San Francisco", province: "CA", zip: "94118", country: "US" },
    { name: "Lucas Moreau", line1: "900 Main Street", city: "Walnut Creek", province: "CA", zip: "94596", country: "US" },
    { name: "Ava Thompson", line1: "14 Fourth Street", city: "Petaluma", province: "CA", zip: "94952", country: "US" },
    { name: "Eli Haddad", line1: "300 Divisadero Street", city: "San Francisco", province: "CA", zip: "94117", country: "US" }
  ];

  const orderPlans = [
    { number: 1001, daysAgo: 13, hour: 10, email: "jordan@example.com", items: [["NW-TEE-M", 1], ["A8-MUG-SAND", 1]], status: "PAID", fulfillment: "FULFILLED", tracking: "1Z999AA10123456784" },
    { number: 1002, daysAgo: 12, hour: 15, email: "sam@example.com", items: [["NW-HOOD-L", 1]], status: "PAID", fulfillment: "UNFULFILLED" },
    { number: 1003, daysAgo: 11, hour: 9, email: "priya@example.com", items: [["A8-WALLET", 1], ["NW-PIN", 2]], status: "PAID", fulfillment: "FULFILLED", tracking: "1Z999AA10123456785", discount: "WELCOME10" },
    { number: 1004, daysAgo: 10, hour: 18, email: "noah@example.com", items: [["A8-LAMP", 1]], status: "REFUNDED", fulfillment: "FULFILLED", tracking: "1Z999AA10123456786", refundFull: true, refundReason: "Arrived damaged" },
    { number: 1005, daysAgo: 8, hour: 12, email: "maya@example.com", items: [["NW-BEANIE-CHAR", 1], ["A8-CANDLE-CEDAR", 2]], status: "PAID", fulfillment: "UNFULFILLED" },
    { number: 1006, daysAgo: 7, hour: 16, email: "lucas@example.com", items: [["NW-TOTE", 0], ["A8-THROW", 1]], status: "PAID", fulfillment: "FULFILLED", tracking: "1Z999AA10123456787", refundAmount: 1200, refundReason: "Goodwill adjustment" },
    { number: 1007, daysAgo: 5, hour: 11, email: "ava@example.com", items: [["A8-CANDLE-CITRUS", 1]], status: "PENDING", fulfillment: "UNFULFILLED" },
    { number: 1008, daysAgo: 4, hour: 14, email: "jordan@example.com", items: [["NW-BOTTLE", 1], ["A8-MUG-INK", 2]], status: "PAID", fulfillment: "FULFILLED", tracking: "1Z999AA10123456788" },
    { number: 1009, daysAgo: 3, hour: 8, email: "eli@example.com", items: [["A8-NOTE", 0], ["NW-PIN", 1]], status: "CANCELLED", fulfillment: "UNFULFILLED" },
    { number: 1010, daysAgo: 2, hour: 19, email: "priya@example.com", items: [["A8-THROW", 1], ["A8-CANDLE-CEDAR", 1]], status: "PAID", fulfillment: "UNFULFILLED" },
    { number: 1011, daysAgo: 1, hour: 13, email: "sam@example.com", items: [["NW-TEE-S", 2]], status: "PAID", fulfillment: "FULFILLED", tracking: "1Z999AA10123456789" }
  ];

  for (const plan of orderPlans) {
    const customer = customers.get(plan.email)!;
    const customerSeed = customersSeed.find((c) => c.email === plan.email)!;
    const address = addresses[customersSeed.findIndex((c) => c.email === plan.email)];
    const lines = plan.items
      .filter(([, qty]) => Number(qty) > 0)
      .map(([sku, qty]) => {
        const variant = variantRecords.get(String(sku));
        if (!variant) throw new Error(`Missing variant SKU ${sku}`);
        return { variant, qty: Number(qty) };
      });

    const subtotal = lines.reduce((sum, line) => sum + line.variant.price * line.qty, 0);
    const discount = plan.discount ? discountMap.get(plan.discount) : undefined;
    const discountAmount = discount ? computeDiscountAmount(discount, subtotal) : 0;
    const freeShipping = isFreeShippingDiscount(discount) ? true : subtotal >= 7500;
    const shipping = 500;
    const totals = computeTotals({
      subtotal,
      discountAmount,
      freeShipping,
      shipping,
      taxRatePct: 8.25,
      taxShipping: false
    });
    const createdAt = addDays(now, -plan.daysAgo);
    createdAt.setHours(plan.hour, 15, 0, 0);

    const order = await prisma.order.create({
      data: {
        shopId: shop.id,
        number: plan.number,
        customerId: customer.id,
        email: plan.email,
        financialStatus: plan.status,
        fulfillmentStatus: plan.fulfillment,
        currency: "USD",
        subtotal: totals.subtotal,
        shippingTotal: totals.shippingTotal,
        taxTotal: totals.taxTotal,
        discountTotal: totals.discountTotal,
        total: totals.total,
        discountCode: plan.discount ?? null,
        shippingMethod: freeShipping ? "Free standard shipping" : "Standard shipping",
        paymentMethod: plan.status === "PENDING" ? null : "Card (mock)",
        note: plan.number === 1005 ? "Please leave at the side gate." : null,
        shippingAddressJson: JSON.stringify(address),
        createdAt,
        updatedAt: createdAt,
        items: {
          create: lines.map((line) => ({
            productId: line.variant.productId,
            variantId: line.variant.id,
            title: line.variant.productTitle,
            variantTitle: line.variant.title === "Default Title" ? "" : line.variant.title,
            sku: line.variant.sku,
            image: line.variant.image,
            price: line.variant.price,
            quantity: line.qty,
            total: line.variant.price * line.qty
          }))
        },
        timeline: {
          create: [{ type: "order_placed", message: "Order placed by customer.", createdAt }]
        }
      }
    });

    if (plan.status !== "PENDING" && plan.status !== "CANCELLED") {
      await prisma.orderEvent.create({
        data: { orderId: order.id, type: "payment_captured", message: `Payment of $${(totals.total / 100).toFixed(2)} captured.`, createdAt }
      });
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ordersCount: { increment: 1 },
          totalSpent: { increment: totals.total }
        }
      });
    }

    if (plan.status === "CANCELLED") {
      await prisma.orderEvent.create({
        data: { orderId: order.id, type: "cancelled", message: "Order cancelled by merchant.", createdAt }
      });
    }

    if (plan.fulfillment === "FULFILLED") {
      await prisma.fulfillment.create({
        data: {
          orderId: order.id,
          trackingCompany: "UPS",
          trackingNumber: plan.tracking ?? null,
          createdAt: addDays(createdAt, 1)
        }
      });
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "fulfilled",
          message: `Order fulfilled${plan.tracking ? ` with UPS tracking ${plan.tracking}` : ""}.`,
          createdAt: addDays(createdAt, 1)
        }
      });
    }

    if (plan.status === "REFUNDED" || plan.status === "PARTIALLY_REFUNDED") {
      const amount = plan.refundFull ? totals.total : plan.refundAmount ?? 0;
      await prisma.refund.create({
        data: {
          orderId: order.id,
          amount,
          reason: plan.refundReason ?? "Customer request",
          createdAt: addDays(createdAt, 2)
        }
      });
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "refunded",
          message: `Refund of $${(amount / 100).toFixed(2)} issued.`,
          createdAt: addDays(createdAt, 2)
        }
      });
    }

    if (plan.number === 1001) {
      await prisma.emailMessage.create({
        data: {
          shopId: shop.id,
          to: plan.email,
          subject: `Order #${plan.number} confirmed — ${shop.name}`,
          body: `Hi ${customerSeed.firstName},\n\nThanks for your order! We're getting #${plan.number} ready now.\n\nWe'll email you again when it ships.\n\n— ${shop.name}`,
          kind: "order_confirmation",
          createdAt
        }
      });
    }
  }

  await prisma.review.createMany({
    data: [
      { shopId: shop.id, productId: productRecords.get("everyday-tee")!.id, author: "Jordan L.", rating: 5, body: "Best fitting tee I own. Washed it ten times and it still holds its shape.", createdAt: addDays(now, -9) },
      { shopId: shop.id, productId: productRecords.get("everyday-tee")!.id, author: "Maya C.", rating: 4, body: "Great weight and color. Runs a touch large, I'd size down.", createdAt: addDays(now, -6) },
      { shopId: shop.id, productId: productRecords.get("heavyweight-hoodie")!.id, author: "Sam R.", rating: 5, body: "Absurdly good quality for the price. The hood actually stays up.", createdAt: addDays(now, -4) },
      { shopId: shop.id, productId: productRecords.get("desk-lamp")!.id, author: "Priya N.", rating: 5, body: "Beautiful warm light and the arm holds position perfectly.", createdAt: addDays(now, -2) }
    ]
  });

  await prisma.page.createMany({
    data: [
      {
        shopId: shop.id,
        title: "About",
        handle: "about",
        body:
          "Northwind Supply started in a garage workshop in 2019 with one goal: make everyday objects worth keeping.\n\nWe work with a small group of family-run workshops in California and Portugal. Every material is chosen for how it ages, not how it photographs.\n\nWe keep runs small, repair what we sell, and refuse to chase trends. If something isn't right, we'll make it right."
      },
      {
        shopId: shop.id,
        title: "FAQ",
        handle: "faq",
        body:
          "How long does shipping take?\nStandard shipping arrives in 3–5 business days. Express arrives in 1–2.\n\nWhat is your return policy?\nUnused items can be returned within 30 days for a full refund.\n\nHow do I track my order?\nUse the Track order link in the footer with your order number and email.\n\nDo you ship internationally?\nNot yet — we ship within the United States."
      },
      {
        shopId: shop.id,
        title: "Shipping & Returns",
        handle: "shipping-returns",
        body:
          "Shipping\nOrders over $75 ship free with standard shipping. Express shipping is $15.\n\nReturns\nWe accept returns of unused items within 30 days of delivery. Start a return by replying to your order confirmation email.\n\nRefunds are issued to the original payment method within 5 business days of receiving the return."
      }
    ]
  });

  await prisma.blogPost.createMany({
    data: [
      {
        shopId: shop.id,
        title: "Why we stonewash our linen",
        handle: "why-we-stonewash-our-linen",
        excerpt: "The industrial process behind the softest throw in the shop.",
        body:
          "Linen is at its best after a few dozen washes — but waiting years for a blanket to soften isn't a great customer experience.\n\nSo we stonewash it. Volcanic pumice stones tumble the fabric for hours, relaxing the fibers and removing the starch. The result is a throw that feels like it's been on your sofa for a decade, straight out of the box.\n\nIt's slower, costlier, and worth it.",
        author: "Avery Stone",
        image: "/images/product-10.svg"
      },
      {
        shopId: shop.id,
        title: "A field guide to the perfect work mug",
        handle: "field-guide-perfect-work-mug",
        excerpt: "Weight, glaze, handle geometry — the details that matter at 9am.",
        body:
          "A mug is a tool. The handle should fit two fingers comfortably, the rim should be thin enough to drink from, and the base should be wide enough that a stray elbow doesn't end your morning.\n\nOurs are thrown in stoneware, glazed with a speckled matte finish, and fired twice. They're heavy in a good way.\n\nStop by the shop to feel one in person.",
        author: "Avery Stone",
        image: "/images/product-4.svg"
      }
    ]
  });

  const apps = [
    {
      id: "app-judgeme",
      name: "Judge.me Product Reviews",
      handle: "judgeme-reviews",
      tagline: "Collect and display product reviews.",
      description:
        "Add photo reviews, star ratings, and review widgets to your product pages. Auto-publish trusted reviews and reply to customers.",
      category: "Marketing",
      developer: "Judge.me",
      color: "#2563eb",
      priceLabel: "Free plan available",
      rating: 49,
      installs: 45000,
      capabilities: "reviews"
    },
    {
      id: "app-klaviyo",
      name: "Klaviyo: Email Marketing",
      handle: "klaviyo-email",
      tagline: "Email and SMS marketing built for commerce.",
      description:
        "Sync your storefront newsletter signups, build segments, and send abandoned cart flows from Klaviyo.",
      category: "Marketing",
      developer: "Klaviyo",
      color: "#0f172a",
      priceLabel: "Free up to 250 contacts",
      rating: 48,
      installs: 32000,
      capabilities: "newsletter"
    },
    {
      id: "app-printful",
      name: "Printful: Print on Demand",
      handle: "printful",
      tagline: "Print and ship custom products worldwide.",
      description:
        "Connect products to Printful's fulfillment network for automated print-on-demand and white-label shipping.",
      category: "Order fulfillment",
      developer: "Printful",
      color: "#7c3aed",
      priceLabel: "Free to install",
      rating: 46,
      installs: 28000,
      capabilities: "dropshipping"
    },
    {
      id: "app-tidio",
      name: "Tidio: Live Chat & AI",
      handle: "tidio-chat",
      tagline: "Answer customer questions in real time.",
      description:
        "Add a live chat and AI chatbot to your storefront. Escalate to a human when the bot can't help.",
      category: "Customer support",
      developer: "Tidio",
      color: "#0891b2",
      priceLabel: "Free plan available",
      rating: 47,
      installs: 19000,
      capabilities: "chat"
    },
    {
      id: "app-fera",
      name: "Fera Product Reviews",
      handle: "fera-reviews",
      tagline: "Highly customizable review widgets.",
      description: "Review collection, photo galleries, and rich snippets for product pages.",
      category: "Marketing",
      developer: "Fera",
      color: "#db2777",
      priceLabel: "From $9/month",
      rating: 48,
      installs: 9000,
      capabilities: "reviews"
    },
    {
      id: "app-stocksync",
      name: "Stock Sync: Inventory Sync",
      handle: "stock-sync",
      tagline: "Sync inventory across suppliers and channels.",
      description: "Automatic inventory updates from spreadsheets, FTP, or supplier feeds.",
      category: "Inventory",
      developer: "Stock Sync",
      color: "#ea580c",
      priceLabel: "From $5/month",
      rating: 45,
      installs: 7000,
      capabilities: "inventory"
    }
  ];
  for (const app of apps) await prisma.app.create({ data: app });

  await prisma.appInstallation.createMany({
    data: [
      { shopId: shop.id, appId: "app-judgeme", installedAt: addDays(now, -20) },
      { shopId: shop.id, appId: "app-klaviyo", installedAt: addDays(now, -14) }
    ]
  });

  await prisma.apiKey.create({
    data: {
      shopId: shop.id,
      label: "Demo API key",
      token: "os_demo_1234567890abcdef",
      scopes: "read_products,write_products,read_orders"
    }
  });

  await prisma.webhook.create({
    data: {
      shopId: shop.id,
      topic: "orders/paid",
      url: "https://example.com/webhooks/orders-paid",
      active: false,
      secret: "whsec_demo_secret_do_not_use_in_production",
      createdAt: addDays(now, -10)
    }
  });

  const eventData: { shopId: string; name: string; dataJson: string; value: number | null; createdAt: Date }[] = [];
  let seedCounter = 17;
  const pseudo = () => {
    seedCounter = (seedCounter * 9301 + 49297) % 233280;
    return seedCounter / 233280;
  };
  for (const [index, product] of products.entries()) {
    const views = 40 + Math.floor(pseudo() * 160);
    for (let i = 0; i < views; i++) {
      const d = new Date(now.getTime() - Math.floor(pseudo() * 13) * 86400000 - Math.floor(pseudo() * 86400000));
      eventData.push({
        shopId: shop.id,
        name: "product_viewed",
        dataJson: JSON.stringify({ handle: product.handle, index }),
        value: null,
        createdAt: d
      });
    }
  }
  for (let i = 0; i < 46; i++) {
    const d = new Date(now.getTime() - Math.floor(pseudo() * 13) * 86400000 - Math.floor(pseudo() * 86400000));
    eventData.push({
      shopId: shop.id,
      name: "checkout_started",
      dataJson: JSON.stringify({ source: "direct" }),
      value: null,
      createdAt: d
    });
  }
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getTime() - Math.floor(pseudo() * 13) * 86400000 - Math.floor(pseudo() * 86400000));
    eventData.push({
      shopId: shop.id,
      name: "newsletter_signup",
      dataJson: JSON.stringify({ email: `subscriber${i}@example.com`, source: "footer" }),
      value: null,
      createdAt: d
    });
  }
  await prisma.event.createMany({ data: eventData });

  console.log("Seed complete.");
  console.log("  Demo owner:  owner@demo.com / demo1234");
  console.log("  Demo staff:  staff@demo.com / demo1234");
  console.log(`  Shop:        /s/${shop.slug}`);
  console.log("  Admin:       /admin/demo");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
