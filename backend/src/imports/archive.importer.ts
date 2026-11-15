import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { COVER_MAX_BYTES } from '../common/mime.constants';
import { safeFetch } from '../common/safe-fetch';
import { stripHtml } from '../common/strip-html';
import { validateResponse } from './validate-response';
import {
  encodeRef,
  MIX_PERDU_DANS_SA_SOURCE,
  type MixImport,
  type SourceImporter,
  type SourceItem,
} from './source-importer';

const METADATA_MAX_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

/** Archive.org's `format` strings for audio. Matched case-insensitively on a
 *  substring, because they carry qualifiers ("VBR MP3", "24bit Flac"). */
const AUDIO_FORMAT_HINTS = ['mp3', 'ogg', 'flac', 'wave', 'aiff', 'm4a', 'aac'];

/** Preference order when one track exists in several formats. MP3 first: every
 *  browser plays it, and it is an order of magnitude smaller than the lossless
 *  file beside it — the audio is streamed to the listener, not to us. */
const FORMAT_PREFERENCE = ['mp3', 'm4a', 'aac', 'ogg', 'wave', 'aiff', 'flac'];

/** Archive.org rend parfois `creator` ou `description` en liste de chaînes.
 *  Le code n'a jamais lu que la forme chaîne : la liste est écartée, comme
 *  avant, plutôt que de refuser l'item entier. */
const chaineSeulement = ({ value }: { value: unknown }): unknown =>
  Array.isArray(value) ? undefined : value;

class ArchiveFile {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  original?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  length?: string;
}

class ArchiveMetadata {
  @IsOptional()
  @Transform(chaineSeulement)
  @IsString()
  creator?: string;

  @IsOptional()
  @Transform(chaineSeulement)
  @IsString()
  description?: string;
}

/** `GET /metadata/<id>`. Un identifiant inconnu rend `200 {}` : tout est
 *  donc facultatif, et seul ce que le code lit est typé. */
export class ArchivePayload {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArchiveFile)
  files?: ArchiveFile[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ArchiveMetadata)
  metadata?: ArchiveMetadata;
}

function isAudioFormat(format: string | undefined): boolean {
  if (format === undefined) return false;
  const lower = format.toLowerCase();
  return AUDIO_FORMAT_HINTS.some((hint) => lower.includes(hint));
}

/** `format` values Archive.org uses for images, plus its own generated tile. */
const IMAGE_FORMAT_HINTS = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'item tile'];

/** Archive.org's generated square tile — a fallback, never a first choice. */
const ITEM_TILE = '__ia_thumb.jpg';

function isImageFormat(format: string | undefined): boolean {
  if (format === undefined) return false;
  const lower = format.toLowerCase();
  return IMAGE_FORMAT_HINTS.some((hint) => lower.includes(hint));
}

function downloadUrl(identifier: string, fileName: string): string {
  return `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(fileName)}`;
}

/**
 * The item's cover, or undefined when it has none worth using.
 *
 * Every audio item on Archive.org is full of images that are not covers: one
 * PNG spectrogram per track, plus a thumbnail beside every uploaded photo.
 * Both are derivatives and say so in `original` — a spectrogram points at an
 * audio file, a thumbnail at the image it shrank. Taking anything with an
 * `original` out of the running leaves the genuine uploads and the tile.
 *
 * The tile (`__ia_thumb.jpg`) is Archive.org's own square crop, around 9 kB.
 * It works, but it is small enough to look poor at cover size, so it is the
 * fallback rather than the pick.
 *
 * An image over `COVER_MAX_BYTES` is skipped rather than chosen: `fetchCover`
 * would refuse it, and since the cover import is best-effort the mix would end
 * up with no cover at all while a usable one sat in the same item.
 */
export function pickCoverUrl(
  identifier: string,
  payload: ArchivePayload,
): string | undefined {
  const files = payload.files ?? [];

  const candidates = files.filter(
    (file) =>
      isImageFormat(file.format) &&
      // A derivative: a spectrogram of a track, or a thumbnail of a photo.
      file.original === undefined &&
      !oversized(file.size),
  );

  const uploaded = candidates.find((file) => file.name !== ITEM_TILE);
  const chosen = uploaded ?? candidates.find((file) => file.name === ITEM_TILE);

  return chosen ? downloadUrl(identifier, chosen.name) : undefined;
}

function oversized(size: string | undefined): boolean {
  if (size === undefined) return false;
  const bytes = Number(size);
  return Number.isFinite(bytes) && bytes > COVER_MAX_BYTES;
}

function formatRank(format: string | undefined): number {
  const lower = format?.toLowerCase() ?? '';
  const rank = FORMAT_PREFERENCE.findIndex((hint) => lower.includes(hint));
  return rank === -1 ? FORMAT_PREFERENCE.length : rank;
}

/** Archive.org gives `length` either as seconds ("125.4") or as "mm:ss" / "h:mm:ss". */
export function parseLength(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw.trim().split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return undefined;
  const seconds = parts.reduce((acc, part) => acc * 60 + part, 0);
  return seconds > 0 ? Math.round(seconds) : undefined;
}

export function extractIdentifier(url: URL): string | null {
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments[0] !== 'details' && segments[0] !== 'download') return null;
  return segments[1] ? decodeURIComponent(segments[1]) : null;
}

/**
 * One entry per *track*, not per file.
 *
 * A concert on Archive.org carries every track twice or more — a lossless
 * master plus the derivatives Archive.org generates from it — and listing all
 * of them would show the same title over and over with no way to tell the
 * copies apart. The derivatives say which file they came from in `original`,
 * so that field is what groups them; the format preference picks the one to
 * keep. `original` is only trusted when it names another *audio* file in the
 * same item: spectrograms and waveform images carry it too, and grouping on it
 * blindly would fold unrelated tracks together.
 */
export function parseArchiveItem(
  identifier: string,
  payload: ArchivePayload,
): SourceItem[] {
  const audioFiles = (payload.files ?? []).filter((file) =>
    isAudioFormat(file.format),
  );
  const audioNames = new Set(audioFiles.map((file) => file.name));

  const groups = new Map<string, ArchiveFile>();
  for (const file of audioFiles) {
    const original = file.original;
    const key =
      original !== undefined && audioNames.has(original) ? original : file.name;

    const kept = groups.get(key);
    if (!kept || formatRank(file.format) < formatRank(kept.format)) {
      groups.set(key, file);
    }
  }

  // The cover belongs to the item, not the track, so every entry carries it —
  // otherwise the picker is a wall of grey squares for a whole concert.
  const coverUrl = pickCoverUrl(identifier, payload);
  // Same reasoning for the taper/band name: it names the item, not one track,
  // so every entry carries the same value.
  const collectionLabel = payload.metadata?.creator?.trim() || undefined;

  return [...groups.values()].map((file) => {
    const title = file.title;
    return {
      ref: encodeRef('archive', `${identifier}/${file.name}`),
      title: title?.trim() || file.name,
      durationSec: parseLength(file.length),
      coverUrl,
      pageUrl: `https://archive.org/details/${identifier}`,
      collectionLabel,
    };
  });
}

@Injectable()
export class ArchiveImporter implements SourceImporter {
  readonly name = 'archive';

  matches(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return (
      (host === 'archive.org' || host.endsWith('.archive.org')) &&
      extractIdentifier(url) !== null
    );
  }

  async resolve(url: URL): Promise<MixImport | SourceItem[]> {
    const identifier = extractIdentifier(url);
    if (!identifier) {
      throw new NotFoundException(
        'Cette adresse Archive.org ne désigne aucun item',
      );
    }

    const items = parseArchiveItem(
      identifier,
      await this.readMetadata(identifier),
    );
    if (items.length === 0) {
      // Archive.org answers an unknown identifier with `200 {}`, not a 404, so
      // this one message covers both "no such item" and "item without audio".
      throw new NotFoundException(
        'Cet item Archive.org ne contient aucun fichier audio',
      );
    }
    // A single audio file is not a choice; skip the list and import it.
    return items.length === 1
      ? this.importItem(items[0].ref.replace(/^archive:/, ''))
      : items;
  }

  /**
   * L'identifiant et le nom du fichier se lisent dans `sourceRef`, que
   * `importItem` a lui-même construit : `/download/<id>/<fichier>`, chaque
   * segment encodé à part.
   */
  async refetch(_pageUrl: URL, sourceRef: string): Promise<MixImport> {
    let ref: URL;
    try {
      ref = new URL(sourceRef);
    } catch {
      throw new NotFoundException(MIX_PERDU_DANS_SA_SOURCE);
    }
    const match = /^\/download\/([^/]+)\/(.+)$/.exec(ref.pathname);
    if (ref.hostname !== 'archive.org' || !match) {
      throw new NotFoundException(MIX_PERDU_DANS_SA_SOURCE);
    }
    const [, identifier, fileName] = match;
    try {
      return await this.importItem(
        `${decodeURIComponent(identifier)}/${decodeURIComponent(fileName)}`,
      );
    } catch (err) {
      // Le même message que les autres sources : l'écran d'édition n'a pas à
      // savoir que celle-ci dit « fichier » là où un flux dit « épisode ».
      if (err instanceof NotFoundException) {
        throw new NotFoundException(MIX_PERDU_DANS_SA_SOURCE);
      }
      throw err;
    }
  }

  async importItem(value: string): Promise<MixImport> {
    const slash = value.indexOf('/');
    if (slash < 1) {
      throw new NotFoundException('Référence Archive.org invalide');
    }
    const identifier = value.slice(0, slash);
    const fileName = value.slice(slash + 1);

    const payload = await this.readMetadata(identifier);
    const metadata = payload.metadata ?? {};
    const item = parseArchiveItem(identifier, payload).find(
      (candidate) => candidate.ref === encodeRef('archive', value),
    );
    if (!item) {
      throw new NotFoundException(
        "Ce fichier n'existe plus dans cet item Archive.org",
      );
    }

    const creator = metadata.creator;

    return {
      title: item.title,
      // Archive.org writes its description as a run of `<div>` lines.
      description:
        metadata.description !== undefined
          ? stripHtml(metadata.description)
          : '',
      // Le nom du créateur rejoint les tags : le mix appartiendra au compte
      // Tambouille qui l'importe, donc sans ça plus rien ne dit de qui il est.
      tags: creator ? [creator] : [],
      coverSourceUrl: item.coverUrl,
      durationSec: item.durationSec,
      tracklist: [],
      sourceType: 'remote',
      // Each segment is encoded on its own: a file name may contain `#` or `?`,
      // which would otherwise cut the URL short.
      sourceRef: `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(fileName)}`,
      sourceLabel: 'Archive.org',
      sourcePageUrl: `https://archive.org/details/${encodeURIComponent(identifier)}`,
    };
  }

  private async readMetadata(identifier: string): Promise<ArchivePayload> {
    const { body } = await safeFetch(
      `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
      {
        maxBytes: METADATA_MAX_BYTES,
        timeoutMs: FETCH_TIMEOUT_MS,
        accept: 'application/json',
      },
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(body.toString('utf8'));
    } catch {
      throw new BadGatewayException('Réponse illisible depuis Archive.org');
    }
    return validateResponse(
      ArchivePayload,
      parsed,
      'Réponse inattendue depuis Archive.org',
    );
  }
}
