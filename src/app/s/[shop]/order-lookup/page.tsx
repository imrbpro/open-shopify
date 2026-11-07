import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStore } from "@/lib/storefront";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderLookupPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { number?: string; email?: string };
}) {
  const store = await getStore(params.shop);
  const numberValue = (searchParams?.number ?? "").replace("#", "").trim();
  const emailValue = (searchParams?.email ?? "").trim().toLowerCase();
  const submitted = Boolean(numberValue || emailValue);

  const order =
    numberValue && emailValue && /^\d+$/.test(numberValue)
      ? await prisma.order.findUnique({
          where: { shopId_number: { shopId: store.shop.id, number: Number(numberValue) } },
          include: { items: true }
        })
      : null;

  const found = order && order.email.toLowerCase() === emailValue ? order : null;

  return (
    <div className="mx-auto max-w-xl">
      <div className="text-center">
        <h1 className="store-heading text-3xl font-semibold">Order lookup</h1>
        <p className="mt-1 text-sm store-muted">
          Enter your order number and the email used at checkout.
        </p>
      </div>

      <form method="get" className="store-card mt-6 space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="store-label" htmlFor="lookup-number">
              Order number
            </label>
            <input
              id="lookup-number"
              name="number"
              defaultValue={numberValue}
              placeholder="1001"
              className="store-input"
              required
            />
          </div>
          <div>
            <label className="store-label" htmlFor="lookup-email">
              Email
            </label>
            <input
              id="lookup-email"
              name="email"
              type="email"
              defaultValue={emailValue}
              placeholder="you@example.com"
              className="store-input"
              required
            />
          </div>
        </div>
        <button type="submit" className="store-btn w-full">
          Find order
        </button>
      </form>

      {submitted && !found ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          We couldn&apos;t find an order with those details. Check the number and email and try again.
        </p>
      ) : null}

      {found ? (
        <div className="store-card mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide store-muted">Order</p>
              <p className="store-heading text-xl font-semibold">#{found.number}</p>
              <p className="text-xs store-muted">Placed {formatDate(found.createdAt)}</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-medium">{found.financialStatus.replaceAll("_", " ").toLowerCase()}</p>
              <p className="store-muted">
                {found.fulfillmentStatus.replaceAll("_", " ").toLowerCase()}
              </p>
            </div>
          </div>
          <ul className="mt-4 divide-y store-divider">
            {found.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  {item.title}
                  {item.variantTitle !== "Default Title" ? (
                    <span className="block text-xs store-muted">{item.variantTitle}</span>
                  ) : null}
                  <span className="block text-xs store-muted">Qty {item.quantity}</span>
                </span>
                <span className="font-medium">{formatMoney(item.total, found.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t pt-3 text-sm font-semibold store-divider">
            <span>Total</span>
            <span>{formatMoney(found.total, found.currency)}</span>
          </div>
          <Link href={`/s/${store.shop.slug}/thank-you/${found.number}`} className="store-btn mt-4 w-full">
            View full receipt
          </Link>
        </div>
      ) : null}
    </div>
  );
}
