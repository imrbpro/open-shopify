import { prisma } from "./db";

export async function queueEmail(input: {
  shopId: string;
  to: string;
  subject: string;
  body: string;
  kind?: string;
}): Promise<void> {
  await prisma.emailMessage.create({
    data: {
      shopId: input.shopId,
      to: input.to,
      subject: input.subject,
      body: input.body,
      kind: input.kind ?? "order_confirmation"
    }
  });
}
