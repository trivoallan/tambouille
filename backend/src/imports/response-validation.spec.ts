import { BadGatewayException } from '@nestjs/common';
import { ArchiveImporter } from './archive.importer';
import { FlarumClient } from './flarum.client';
import { LylImporter } from './lyl.importer';
import { SoundcloudImporter } from './soundcloud.importer';

jest.mock('../common/safe-fetch', () => ({ safeFetch: jest.fn() }));
import { safeFetch } from '../common/safe-fetch';

const mockSafeFetch = safeFetch as jest.Mock;

function answerWith(payload: unknown) {
  mockSafeFetch.mockResolvedValue({
    url: new URL('https://example.test/'),
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify(payload)),
  });
}

beforeEach(() => mockSafeFetch.mockReset());

describe('SoundCloud : réponse oEmbed', () => {
  const resolve = () =>
    new SoundcloudImporter().resolve(
      new URL('https://soundcloud.com/forss/flickermood'),
    );

  it('accepte une réponse sans champ facultatif', async () => {
    answerWith({ title: 'Flickermood' });
    await expect(resolve()).resolves.toMatchObject({ title: 'Flickermood' });
  });

  it('refuse une réponse sans titre', async () => {
    answerWith({ description: 'x' });
    await expect(resolve()).rejects.toThrow(BadGatewayException);
  });

  it.each([
    ['title', { title: 42 }],
    ['description', { title: 'a', description: 42 }],
    ['thumbnail_url', { title: 'a', thumbnail_url: {} }],
  ])('refuse un champ %s mal typé', async (_champ, payload) => {
    answerWith(payload);
    await expect(resolve()).rejects.toThrow(BadGatewayException);
  });

  it('refuse une réponse qui n’est pas un objet', async () => {
    answerWith('texte');
    await expect(resolve()).rejects.toThrow(BadGatewayException);
  });
});

describe('LYL : réponse /api/episodes', () => {
  const list = () =>
    new LylImporter().resolve(new URL('https://lyl.live/show/temple'));

  it('accepte un épisode sans champ facultatif, ou à champs null', async () => {
    answerWith({
      data: [{ title: 'T', slug: 's', audio: null, styles: null }],
    });
    await expect(list()).resolves.toBeDefined();
  });

  it('refuse une réponse sans `data`', async () => {
    answerWith({ meta: {} });
    await expect(list()).rejects.toThrow(BadGatewayException);
  });

  it.each([
    ['slug absent', { title: 'T' }],
    ['titre mal typé', { title: 1, slug: 's' }],
    ['durée mal typée', { title: 'T', slug: 's', duration: 3600 }],
    ['audio mal typé', { title: 'T', slug: 's', audio: { url: 5 } }],
  ])('refuse un épisode : %s', async (_cas, episode) => {
    answerWith({ data: [episode] });
    await expect(list()).rejects.toThrow(BadGatewayException);
  });
});

describe('Archive.org : réponse /metadata', () => {
  const resolve = () =>
    new ArchiveImporter().resolve(new URL('https://archive.org/details/x'));
  const audio = { name: 'a.mp3', format: 'VBR MP3' };

  it('accepte un item sans description ni créateur', async () => {
    answerWith({ files: [audio, { name: 'b.mp3', format: 'VBR MP3' }] });
    await expect(resolve()).resolves.toHaveLength(2);
  });

  it('écarte un créateur donné en liste, comme avant', async () => {
    answerWith({
      files: [audio, { name: 'b.mp3', format: 'VBR MP3' }],
      metadata: { creator: ['A', 'B'] },
    });
    const items = (await resolve()) as { collectionLabel?: string }[];
    expect(items[0].collectionLabel).toBeUndefined();
  });

  it.each([
    ['fichier sans nom', { files: [{ format: 'VBR MP3' }] }],
    ['files hors tableau', { files: 'oui' }],
    ['durée mal typée', { files: [{ name: 'a.mp3', length: 125 }] }],
  ])('refuse une réponse : %s', async (_cas, payload) => {
    answerWith(payload);
    await expect(resolve()).rejects.toThrow(BadGatewayException);
  });
});

describe('Forum Flarum : document JSON:API', () => {
  const ressource = { type: 'discussions', id: '1' };

  it('accepte un document sans `included`', async () => {
    answerWith({ data: [ressource] });
    await expect(new FlarumClient().listByAuthor('nota')).resolves.toHaveLength(
      1,
    );
  });

  it.each([
    ['ressource sans id', { data: [{ type: 'discussions' }] }],
    ['data scalaire', { data: 'x' }],
    ['included hors tableau', { data: [], included: {} }],
  ])('refuse un document : %s', async (_cas, payload) => {
    answerWith(payload);
    await expect(new FlarumClient().listByAuthor('nota')).rejects.toThrow(
      BadGatewayException,
    );
  });
});
