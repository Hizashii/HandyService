import { describe, expect, it } from 'vitest';

import { LEGAL } from './company';
import { cookies, legalDocs, privacy, terms, type LegalDoc } from './content';

const text = (doc: LegalDoc) =>
  doc.blocks.flatMap((b) => [b.heading, ...(b.paragraphs ?? []), ...(b.bullets ?? [])]).join('\n');

describe('legal documents', () => {
  it('has the three documents, each with sections and a contact block', () => {
    expect(Object.keys(legalDocs).sort()).toEqual(['cookies', 'privatliv', 'vilkaar']);
    for (const doc of Object.values(legalDocs)) {
      expect(doc.blocks.length).toBeGreaterThan(3);
      expect(text(doc)).toContain(LEGAL.email);
    }
  });

  it('has no leftover placeholders and unique headings', () => {
    for (const doc of Object.values(legalDocs)) {
      expect(text(doc)).not.toMatch(/TODO|\[[a-zæøå ]+\]|undefined|null/i);
      const headings = doc.blocks.map((b) => b.heading);
      expect(new Set(headings).size).toBe(headings.length);
    }
  });

  it('privacy policy covers the GDPR essentials', () => {
    const t = text(privacy);
    for (const word of ['dataansvarlig', 'indsigt', 'sletning', 'Datatilsynet', 'Cloudflare', 'OpenStreetMap', 'legitime interesse']) {
      expect(t.toLowerCase()).toContain(word.toLowerCase());
    }
  });

  it('cookie policy says what is actually stored', () => {
    const t = text(cookies);
    expect(t).toContain('ingen cookies');
    expect(t).toContain('localStorage');
  });

  it('terms name the data source, the licence and Danish law', () => {
    const t = text(terms);
    expect(t).toContain('OpenStreetMap');
    expect(t).toContain('ODbL');
    expect(t).toContain('dansk ret');
  });

  it('only shows CVR and address when they have been filled in', () => {
    expect(text(privacy).includes('CVR-nr.')).toBe(Boolean(LEGAL.cvr));
    expect(text(privacy).includes('Adresse:')).toBe(Boolean(LEGAL.address));
  });
});
