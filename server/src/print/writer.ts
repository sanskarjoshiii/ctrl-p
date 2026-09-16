// A minimal streaming PDF/X writer.
//
// Every page here is exactly one full-bleed CMYK JPEG, so a general-purpose PDF
// library buys us nothing and costs us the one thing the spec asks for: bounded
// memory. A 120-page Large diary holds hundreds of megabytes of page images if
// they all have to be resident at save time. This writer appends each object to
// the file as soon as it is produced and keeps only byte offsets, so peak memory
// is one page. pdf-lib is still used — on the other side, in verify.ts, to read
// the finished file back with an independent parser.

import { createWriteStream, type WriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { once } from 'node:events';

const enc = (s: string) => Buffer.from(s, 'latin1');

/** UTF-16BE hex string, safe for any title the customer typed. */
function pdfText(value: string) {
  const body = Buffer.from(`﻿${value}`, 'utf16le');
  body.swap16();
  return `<${body.toString('hex')}>`;
}

function pdfDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  const tz = -d.getTimezoneOffset();
  const sign = tz >= 0 ? '+' : '-';
  return `D:${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${sign}${p(Math.abs(Math.trunc(tz / 60)))}'${p(Math.abs(tz % 60))}'`;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WriterOptions {
  outFile: string;
  /** Artwork box (trim + bleed), in PDF points. */
  bleed: Box;
  /** Trim box, in PDF points, positioned inside `bleed`. */
  trim: Box;
  /** Whole sheet, in PDF points. Equals `bleed` unless crop marks need margin. */
  sheet: { width: number; height: number };
  icc: { profile: Buffer; name: string; components: number };
  /** Declared output standard, or null to write a plain PDF. */
  pdfx: { version: string; conformance: string | null; pdfVersion: string } | null;
  info: { title: string; subject: string; creator: string; producer: string };
  cropMarks: { lengthPt: number; offsetPt: number } | null;
}

/** Object numbers reserved before any page is written. */
const CATALOG = 1;
const PAGES = 2;
const INFO = 3;
const METADATA = 4;
const ICC = 5;
const OUTPUT_INTENT = 6;
const FIRST_PAGE_OBJ = 7;

export class PdfXWriter {
  private stream: WriteStream;
  private offsets = new Map<number, number>();
  private position = 0;
  private nextObj = FIRST_PAGE_OBJ;
  private pageObjs: number[] = [];
  private hash = createHash('sha256');
  private now = new Date();

  constructor(private opts: WriterOptions) {
    this.stream = createWriteStream(opts.outFile);
  }

  private async write(chunk: Buffer) {
    this.hash.update(chunk);
    this.position += chunk.length;
    if (!this.stream.write(chunk)) await once(this.stream, 'drain');
  }

  private async beginObject(num: number) {
    this.offsets.set(num, this.position);
    await this.write(enc(`${num} 0 obj\n`));
  }

  private async writeDictObject(num: number, dict: string) {
    await this.beginObject(num);
    await this.write(enc(`${dict}\nendobj\n`));
  }

  private async writeStreamObject(num: number, dict: string, body: Buffer) {
    await this.beginObject(num);
    await this.write(enc(`<< ${dict} /Length ${body.length} >>\nstream\n`));
    await this.write(body);
    await this.write(enc('\nendstream\nendobj\n'));
  }

  async open() {
    // The header version has to match the declared standard: PDF/X-4 is a PDF
    // 1.6 profile, PDF/X-1a:2001 a PDF 1.3 one. Pages here are nothing but
    // DCTDecode CMYK images — no transparency, no fonts — which is valid 1.3,
    // so either declaration is honest. The high-byte comment marks the file
    // binary.
    await this.write(enc(`%PDF-${this.opts.pdfx?.pdfVersion ?? '1.6'}\n`));
    await this.write(Buffer.from([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  }

  /** Appends one page carrying a single full-bleed CMYK JPEG. */
  async addPage(jpeg: Buffer, pixels: { width: number; height: number }) {
    const { bleed } = this.opts;
    const imageObj = this.nextObj++;
    const contentObj = this.nextObj++;
    const pageObj = this.nextObj++;

    // CMYK JPEGs are stored with 255 meaning "no ink" (the Adobe convention
    // libvips writes), while DeviceCMYK in PDF reads 0 as "no ink" — the Decode
    // array flips them back. color.ts:measureInk reads the same convention.
    await this.writeStreamObject(
      imageObj,
      `/Type /XObject /Subtype /Image /Width ${pixels.width} /Height ${pixels.height} /ColorSpace /DeviceCMYK /BitsPerComponent 8 /Decode [1 0 1 0 1 0 1 0] /Filter /DCTDecode`,
      jpeg,
    );

    const n = (v: number) => v.toFixed(4);
    const draw = ['q', `${n(bleed.width)} 0 0 ${n(bleed.height)} ${n(bleed.x)} ${n(bleed.y)} cm`, '/Im0 Do', 'Q'];
    if (this.opts.cropMarks) draw.push(...this.cropMarkOperators());
    await this.writeStreamObject(contentObj, '', enc(draw.join('\n')));

    const box = (b: Box) => `[${n(b.x)} ${n(b.y)} ${n(b.x + b.width)} ${n(b.y + b.height)}]`;
    const { sheet } = this.opts;
    await this.writeDictObject(
      pageObj,
      `<< /Type /Page /Parent ${PAGES} 0 R /MediaBox [0 0 ${n(sheet.width)} ${n(sheet.height)}] /BleedBox ${box(bleed)} /TrimBox ${box(this.opts.trim)} /ArtBox ${box(this.opts.trim)} /Resources << /XObject << /Im0 ${imageObj} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${contentObj} 0 R >>`,
    );

    this.pageObjs.push(pageObj);
  }

  /** Corner marks sitting outside the bleed, never over live artwork. */
  private cropMarkOperators() {
    const marks = this.opts.cropMarks!;
    const { trim } = this.opts;
    const ops = ['q', '0 0 0 1 K', '0.25 w'];
    const n = (v: number) => v.toFixed(4);
    const line = (x1: number, y1: number, x2: number, y2: number) => ops.push(`${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`);
    const gap = marks.offsetPt;
    const len = marks.lengthPt;
    const [x0, x1] = [trim.x, trim.x + trim.width];
    const [y0, y1] = [trim.y, trim.y + trim.height];
    for (const y of [y0, y1]) {
      line(x0 - gap - len, y, x0 - gap, y);
      line(x1 + gap, y, x1 + gap + len, y);
    }
    for (const x of [x0, x1]) {
      line(x, y0 - gap - len, x, y0 - gap);
      line(x, y1 + gap, x, y1 + gap + len);
    }
    ops.push('Q');
    return ops;
  }

  /** Writes the trailer objects and the cross-reference table. */
  async close() {
    const { opts } = this;
    const created = pdfDate(this.now);

    await this.writeStreamObject(ICC, `/N ${opts.icc.components}`, opts.icc.profile);

    await this.writeDictObject(
      OUTPUT_INTENT,
      `<< /Type /OutputIntent /S /GTS_PDFX /OutputConditionIdentifier ${pdfText(opts.icc.name)} /OutputCondition ${pdfText(opts.icc.name)} /Info ${pdfText(opts.icc.name)} /RegistryName (http://www.color.org) /DestOutputProfile ${ICC} 0 R >>`,
    );

    const pdfxKeys = opts.pdfx
      ? ` /GTS_PDFXVersion (${opts.pdfx.version})${opts.pdfx.conformance ? ` /GTS_PDFXConformance (${opts.pdfx.conformance})` : ''}`
      : '';
    await this.writeDictObject(
      INFO,
      `<< /Title ${pdfText(opts.info.title)} /Subject ${pdfText(opts.info.subject)} /Creator ${pdfText(opts.info.creator)} /Producer ${pdfText(opts.info.producer)} /CreationDate (${created}) /ModDate (${created}) /Trapped /False${pdfxKeys} >>`,
    );

    await this.writeStreamObject(METADATA, '/Type /Metadata /Subtype /XML', enc(this.xmp()));

    await this.writeDictObject(PAGES, `<< /Type /Pages /Count ${this.pageObjs.length} /Kids [${this.pageObjs.map(o => `${o} 0 R`).join(' ')}] >>`);
    await this.writeDictObject(CATALOG, `<< /Type /Catalog /Pages ${PAGES} 0 R /Metadata ${METADATA} 0 R /OutputIntents [${OUTPUT_INTENT} 0 R] >>`);

    const maxObj = this.nextObj - 1;
    const xrefPos = this.position;
    const rows = ['xref', `0 ${maxObj + 1}`, '0000000000 65535 f '];
    for (let obj = 1; obj <= maxObj; obj++) {
      const off = this.offsets.get(obj);
      rows.push(`${String(off ?? 0).padStart(10, '0')} 00000 ${off === undefined ? 'f' : 'n'} `);
    }
    await this.write(enc(`${rows.join('\n')}\n`));
    await this.write(enc(`trailer\n<< /Size ${maxObj + 1} /Root ${CATALOG} 0 R /Info ${INFO} 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`));

    await new Promise<void>((resolve, reject) => this.stream.end((err?: Error | null) => (err ? reject(err) : resolve())));
    return { bytes: this.position, sha256: this.hash.digest('hex'), pageCount: this.pageObjs.length };
  }

  private xmp() {
    const { opts } = this;
    const iso = this.now.toISOString().replace(/\.\d+Z$/, 'Z');
    const esc = (s: string) => s.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!);
    const pdfx = opts.pdfx
      ? `  <rdf:Description rdf:about="" xmlns:pdfxid="http://www.npes.org/pdfx/ns/id/"><pdfxid:GTS_PDFXVersion>${esc(opts.pdfx.version)}</pdfxid:GTS_PDFXVersion></rdf:Description>\n`
      : '';
    return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/"><pdf:Producer>${esc(opts.info.producer)}</pdf:Producer><pdf:Trapped>False</pdf:Trapped></rdf:Description>
  <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(opts.info.title)}</rdf:li></rdf:Alt></dc:title><dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(opts.info.subject)}</rdf:li></rdf:Alt></dc:description></rdf:Description>
  <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/"><xmp:CreatorTool>${esc(opts.info.creator)}</xmp:CreatorTool><xmp:CreateDate>${iso}</xmp:CreateDate><xmp:ModifyDate>${iso}</xmp:ModifyDate></rdf:Description>
${pdfx} </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  }
}
