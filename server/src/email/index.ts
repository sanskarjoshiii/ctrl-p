// Customer emails.
//
// There is no email provider wired up yet (issue #2 lists one as a dependency),
// so the default transport writes the rendered message to server/data/emails/
// and logs an `email_sent` event against the order. That means the shipped mail
// is fully built, addressed and recorded today — ops can read exactly what the
// customer will get — and switching to a real provider is one `send` function.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { formatMoney } from '../../../shared/pricing.ts';
import type { OrderRecord } from '../../../shared/types.ts';
import { DATA_DIR } from '../paths.ts';

export type EmailTemplate = 'order_received' | 'order_shipped' | 'order_delivered' | 'order_cancelled';

export interface RenderedEmail {
  to: string;
  subject: string;
  text: string;
}

export interface EmailTransport {
  name: string;
  send(message: RenderedEmail): Promise<void> | void;
}

const BUSINESS = {
  name: process.env.BUSINESS_NAME ?? 'Book Diaries',
  supportEmail: process.env.SUPPORT_EMAIL ?? 'support@example.com',
};

/**
 * Carrier tracking links. Add yours here or set COURIER_TRACKING_URLS to a JSON
 * object of `{ "carrier": "https://…?awb={awb}" }`.
 */
function trackingUrl(carrier: string, awb: string): string | null {
  let table: Record<string, string> = {};
  try {
    table = process.env.COURIER_TRACKING_URLS ? JSON.parse(process.env.COURIER_TRACKING_URLS) : {};
  } catch {
    console.warn('[email] COURIER_TRACKING_URLS is not valid JSON — ignoring');
  }
  const template = table[carrier] ?? table[carrier.toLowerCase()];
  return template ? template.replace('{awb}', encodeURIComponent(awb)) : null;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there';

export function renderEmail(template: EmailTemplate, order: OrderRecord): RenderedEmail {
  const to = order.customer.email;
  const hello = `Hi ${firstName(order.customer.name)},`;
  const sign = `\n\n— ${BUSINESS.name}\n${BUSINESS.supportEmail}`;
  const books = order.items.map(i => `  · ${i.title} (${i.pages} pages, ×${i.qty})`).join('\n');

  switch (template) {
    case 'order_received':
      return {
        to,
        subject: `${BUSINESS.name}: we have your order ${order.id}`,
        text: `${hello}\n\nThanks — your diary is with us.\n\n${books}\n\nTotal ${formatMoney(order.totals.total)}.\nWe'll email again the moment it ships.${sign}`,
      };

    case 'order_shipped': {
      const link = order.carrier && order.trackingNumber ? trackingUrl(order.carrier, order.trackingNumber) : null;
      const tracking = [
        order.carrier ? `Carrier: ${order.carrier}` : null,
        order.trackingNumber ? `Tracking number: ${order.trackingNumber}` : null,
        link ? `Track it: ${link}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      return {
        to,
        subject: `${BUSINESS.name}: order ${order.id} is on its way`,
        text: `${hello}\n\nYour diary is printed, bound and on its way.\n\n${books}\n\n${tracking}\n\nGoing to:\n${addressLines(order).join('\n')}${sign}`,
      };
    }

    case 'order_delivered':
      return {
        to,
        subject: `${BUSINESS.name}: order ${order.id} has arrived`,
        text: `${hello}\n\nYour diary has been delivered. We hope it turned out exactly as you pictured it.\n\nIf anything is not right, reply to this email and we'll sort it out.${sign}`,
      };

    case 'order_cancelled':
      return {
        to,
        subject: `${BUSINESS.name}: order ${order.id} has been cancelled`,
        text: `${hello}\n\nYour order ${order.id} has been cancelled.${order.cancelReason ? `\n\nReason: ${order.cancelReason}` : ''}\n\nAny payment already taken will be refunded to the original method.${sign}`,
      };
  }
}

export const addressLines = (order: OrderRecord) =>
  [
    order.customer.name,
    order.customer.address1,
    order.customer.address2,
    `${order.customer.city}, ${order.customer.state} ${order.customer.postalCode}`,
    order.customer.country,
    order.customer.phone,
  ].filter((line): line is string => Boolean(line && line.trim()));

const EMAIL_DIR = path.join(DATA_DIR, 'emails');

/** Writes the message to disk so ops can read what would have been sent. */
const fileTransport: EmailTransport = {
  name: 'file',
  send(message) {
    mkdirSync(EMAIL_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safe = message.to.replace(/[^a-zA-Z0-9@._-]/g, '_');
    writeFileSync(
      path.join(EMAIL_DIR, `${stamp}_${safe}.txt`),
      `To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`,
    );
    console.log(`[email] ${message.subject} → ${message.to} (written to server/data/emails)`);
  },
};

let transport: EmailTransport = fileTransport;

/** Swap in a real provider here once one is chosen. */
export function setEmailTransport(next: EmailTransport) {
  transport = next;
}

export const emailTransportName = () => transport.name;

export async function sendEmail(template: EmailTemplate, order: OrderRecord): Promise<RenderedEmail> {
  const message = renderEmail(template, order);
  await transport.send(message);
  return message;
}
