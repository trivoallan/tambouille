"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
const auth_service_1 = require("../src/auth/auth.service");
const mixes_service_1 = require("../src/mixes/mixes.service");
const cover_import_service_1 = require("../src/mixes/cover-import.service");
const podcast_importer_1 = require("../src/imports/podcast.importer");
const ouiedire_importer_1 = require("../src/imports/ouiedire.importer");
const archive_importer_1 = require("../src/imports/archive.importer");
const source_importer_1 = require("../src/imports/source-importer");
const CANDIDATS = [
    (0, node_path_1.join)(__dirname, '..', 'src', 'imports', '__fixtures__'),
    (0, node_path_1.join)(__dirname, '..', '..', 'src', 'imports', '__fixtures__'),
];
const FIXTURES = CANDIDATS.find((chemin) => (0, node_fs_1.existsSync)(chemin));
if (!FIXTURES) {
    throw new Error(`Fixtures introuvables. Cherchées dans :\n  ${CANDIDATS.join('\n  ')}`);
}
const fixture = (name) => (0, node_fs_1.readFileSync)((0, node_path_1.join)(FIXTURES, name), 'utf8');
function depuisLeFlux() {
    const feed = (0, podcast_importer_1.parseFeed)(fixture('podcast-feed.xml'));
    const auteur = feed.channelAuthor ?? feed.channelTitle;
    return feed.items.map((entry) => ({
        title: entry.title,
        description: entry.description,
        artist: auteur,
        tags: auteur ? [auteur, 'radio'] : ['radio'],
        durationSec: entry.durationSec,
        coverSourceUrl: entry.imageUrl ?? feed.channelImage,
        sourceRef: entry.audioUrl,
        tracklist: [],
    }));
}
function depuisLesEmissions() {
    return ['ouiedire-emission.html', 'ouiedire-emission-mp3-only.html'].map((nom) => {
        const emission = (0, ouiedire_importer_1.parseEmissionPage)(fixture(nom));
        return {
            title: emission.title,
            description: `Émission publiée par Ouïedire.`,
            artist: emission.author,
            tags: emission.author ? [emission.author, 'ouiedire'] : ['ouiedire'],
            coverSourceUrl: emission.coverUrl,
            sourceRef: emission.audioUrl,
            tracklist: emission.tracklist,
        };
    });
}
function depuisArchive() {
    const payload = JSON.parse(fixture('archive-item.json'));
    const identifiant = 'shakedownstreet2024-08-30.akg481.flac';
    return (0, archive_importer_1.parseArchiveItem)(identifiant, payload).map((item) => {
        const { value } = (0, source_importer_1.decodeRef)(item.ref);
        const barre = value.indexOf('/');
        const fichier = value.slice(barre + 1);
        return {
            title: item.title,
            description: undefined,
            artist: undefined,
            tags: ['archive', 'live'],
            durationSec: item.durationSec,
            coverSourceUrl: item.coverUrl,
            sourceRef: `https://archive.org/download/${encodeURIComponent(identifiant)}/${encodeURIComponent(fichier)}`,
            tracklist: [],
        };
    });
}
const COMPTES = [
    {
        email: 'nelly@apercu.invalid',
        username: 'nelly',
        displayName: 'Nelly Kadoc',
        bio: 'Programme la nuit du jeudi. Ne classe rien, retrouve tout.',
    },
    {
        email: 'bruno@apercu.invalid',
        username: 'bruno',
        displayName: 'Bruno Tesson',
        bio: 'Collectionne les fins de sets.',
    },
    {
        email: 'zoe@apercu.invalid',
        username: 'zoe',
        displayName: 'Zoé Marchand',
        bio: null,
    },
    {
        email: 'radio@apercu.invalid',
        username: 'radiotambouille',
        displayName: 'Radio Tambouille',
        bio: 'Le compte qui héberge les rediffusions.',
    },
];
const MOT_DE_PASSE = 'apercu-tambouille';
const COMMENTAIRES = [
    { par: 'bruno', corps: 'La transition à la moitié, quand même.' },
    {
        par: 'zoe',
        corps: "Je cherchais ce set depuis des mois. Merci de l'avoir remonté.",
    },
    { par: 'nelly', corps: 'Passé trois fois cette semaine.' },
];
const REPONSE = {
    par: 'nelly',
    corps: 'Elle est de la version longue, pas de la diffusion.',
};
const PLAYLISTS = [
    {
        par: 'nelly',
        titre: 'Pour les trajets longs',
        description: 'Rien sous vingt minutes.',
        prend: 6,
    },
    {
        par: 'bruno',
        titre: 'À réécouter au casque',
        description: null,
        prend: 4,
    },
];
const pochettesVues = new Map();
async function pochette(covers, source) {
    if (pochettesVues.has(source))
        return pochettesVues.get(source);
    const cle = (await covers.importFromUrl(source)) ?? undefined;
    pochettesVues.set(source, cle);
    return cle;
}
async function main() {
    const logger = new common_1.Logger('seed');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['warn', 'error'],
    });
    try {
        const prisma = app.get(prisma_service_1.PrismaService);
        const auth = app.get(auth_service_1.AuthService);
        const mixes = app.get(mixes_service_1.MixesService);
        const covers = app.get(cover_import_service_1.CoverImportService);
        const parNom = new Map();
        for (const compte of COMPTES) {
            const existant = await prisma.user.findUnique({
                where: { email: compte.email },
            });
            if (existant) {
                parNom.set(compte.username, existant.id);
                continue;
            }
            await auth.register({
                email: compte.email,
                username: compte.username,
                password: MOT_DE_PASSE,
                displayName: compte.displayName,
            });
            const cree = await prisma.user.findUniqueOrThrow({
                where: { email: compte.email },
            });
            if (compte.bio) {
                await prisma.user.update({
                    where: { id: cree.id },
                    data: { bio: compte.bio },
                });
            }
            parNom.set(compte.username, cree.id);
        }
        logger.log(`${parNom.size} comptes`);
        const graines = [
            ...depuisLeFlux(),
            ...depuisLesEmissions(),
            ...depuisArchive(),
        ];
        const proprietaires = [...parNom.values()];
        const idsDesMixes = [];
        let crees = 0;
        for (const [rang, graine] of graines.entries()) {
            const deja = await prisma.mix.findFirst({
                where: { sourceRef: graine.sourceRef },
                select: { id: true },
            });
            if (deja) {
                idsDesMixes.push(deja.id);
                continue;
            }
            const coverUrl = graine.coverSourceUrl
                ? await pochette(covers, graine.coverSourceUrl)
                : undefined;
            const mix = await mixes.create(proprietaires[rang % proprietaires.length], {
                title: graine.title.slice(0, 120),
                description: graine.description?.slice(0, 2000),
                artist: graine.artist?.slice(0, 120),
                tags: graine.tags.join(','),
                durationSec: graine.durationSec,
                sourceType: 'remote',
                sourceRef: graine.sourceRef,
                tracklist: JSON.stringify(graine.tracklist),
            }, { coverUrl });
            idsDesMixes.push(mix.id);
            crees += 1;
        }
        logger.log(`${idsDesMixes.length} mixes (${crees} créés à ce passage)`);
        const radio = parNom.get('radiotambouille');
        const abonnements = [
            ...['nelly', 'bruno', 'zoe'].map((nom) => ({
                followerId: parNom.get(nom),
                followingId: radio,
            })),
            { followerId: parNom.get('nelly'), followingId: parNom.get('bruno') },
            { followerId: parNom.get('bruno'), followingId: parNom.get('nelly') },
            { followerId: parNom.get('zoe'), followingId: parNom.get('nelly') },
        ];
        await prisma.follow.createMany({
            data: abonnements,
            skipDuplicates: true,
        });
        const favoris = idsDesMixes.flatMap((mixId, rang) => [
            ...(rang % 3 === 0 ? [{ userId: parNom.get('nelly'), mixId }] : []),
            ...(rang % 5 === 0 ? [{ userId: parNom.get('bruno'), mixId }] : []),
        ]);
        await prisma.favorite.createMany({ data: favoris, skipDuplicates: true });
        const ecoutes = idsDesMixes.slice(0, 8).map((mixId) => ({
            userId: parNom.get('zoe'),
            mixId,
        }));
        await prisma.playHistory.createMany({
            data: ecoutes,
            skipDuplicates: true,
        });
        for (const [rang, commentaire] of COMMENTAIRES.entries()) {
            const mixId = idsDesMixes[rang];
            if (!mixId)
                break;
            const userId = parNom.get(commentaire.par);
            const deja = await prisma.comment.findFirst({
                where: { mixId, userId, body: commentaire.corps },
                select: { id: true },
            });
            const parent = deja ??
                (await prisma.comment.create({
                    data: { mixId, userId, body: commentaire.corps },
                }));
            if (rang === 0) {
                const repondu = await prisma.comment.findFirst({
                    where: { parentId: parent.id, body: REPONSE.corps },
                });
                if (!repondu) {
                    await prisma.comment.create({
                        data: {
                            mixId,
                            userId: parNom.get(REPONSE.par),
                            body: REPONSE.corps,
                            parentId: parent.id,
                        },
                    });
                }
            }
        }
        for (const playlist of PLAYLISTS) {
            const userId = parNom.get(playlist.par);
            const deja = await prisma.playlist.findFirst({
                where: { userId, title: playlist.titre },
                select: { id: true },
            });
            const id = deja?.id ??
                (await prisma.playlist.create({
                    data: {
                        userId,
                        title: playlist.titre,
                        description: playlist.description,
                    },
                })).id;
            await prisma.playlistItem.createMany({
                data: idsDesMixes.slice(0, playlist.prend).map((mixId, position) => ({
                    playlistId: id,
                    mixId,
                    position,
                })),
                skipDuplicates: true,
            });
        }
        logger.log('peuplement terminé');
    }
    finally {
        await app.close();
    }
}
main().catch((erreur) => {
    console.error(erreur);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map