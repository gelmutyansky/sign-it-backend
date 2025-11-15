import * as db from '../../db/index.js';
import { errorHandler } from '../../helpers/functions.js';

import sinfulMath from 'sinful-math';

const { sub: mSub, mul: mMul, add: mAdd } = sinfulMath;

/**
 * Добавление песни
 * @param { Object } body
 * @param { string } body.artist
 * @param { string } body.name
 * @param { string | null } body.note
 * @param { number? } body.difficulty
 * @returns { Promise<{ message: string | { id: number }, statusCode: number }>}
 * */
async function addSong(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = addSong.name;
    const client = await db.getClient();
    let hasTransaction = false;

    try {
        const {
            artist,
            name,
            note,
            difficulty = 100,
        } = body;

        await client.query('BEGIN');
        hasTransaction = true;

        const queryInsertSong = `INSERT INTO songs (artist, name, note, difficulty)
                                 VALUES ($1, $2, $3, $4)
                                 RETURNING id`;
        const resInsertSong = await client.query(queryInsertSong, [ artist, name, note, difficulty ]);

        if (resInsertSong.rowCount > 0 && resInsertSong.rows.length > 0) {
            const { id } = resInsertSong.rows[0];

            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    {
                    id: id,
                },
                statusCode: 200,
            };
        }
        else {
            console.error(`${ funcName } Не добавлена песня (artist: ${ artist }, name: ${ name }, note: ${ note }, difficulty: ${ difficulty })`);
        }
    }
    catch (e) {
        data = errorHandler(e, funcName);
    }
    finally {
        if (hasTransaction) {
            await client.query('ROLLBACK');
        }

        client.release();
    }

    return data;
}

/**
 * Список песен
 * @param { Object } body
 * @param { Object } body.pagination
 * @param { string | null } body.pagination.sortBy
 * @param { boolean } body.pagination.descending
 * @param { number } body.pagination.page
 * @param { Object } body.filters
 * @param { number | null } body.filters.id
 * @param { string | null } body.filters.artist
 * @param { string | null } body.filters.name
 * @param { string | null } body.filters.note
 * @param { number | null } body.filters.difficulty
 * @param { boolean | null } body.filters.hasOriginal
 * @param { boolean | null } body.filters.hasOriginalTimes
 * @param { boolean  | null} body.filters.hasOriginalLyrics
 * @param { boolean | null } body.filters.hasInstrumental
 * @param { boolean | null } body.filters.hasInstrumentalTimes
 * @returns { Promise<{ message: string | { songs: Array<{ id: number, artist: string, name: string, note: string, difficulty: number, hasOriginal: boolean, hasOriginalTimes: boolean, hasOriginalLyrics: boolean, hasInstrumental: boolean, hasInstrumentalTimes: boolean, rowsNumber: number }> }, statusCode: number }>}
 * */
async function getSongs(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = getSongs.name;

    try {
        const {
            pagination,
            filters,
        } = body;

        const {
            sortBy,
            descending,
            page,
            rowsPerPage,
            rowsNumber,
        } = pagination;

        const {
            id,
            artist,
            name,
            note,
            difficulty,
            hasOriginal,
            hasOriginalTimes ,
            hasOriginalLyrics,
            hasInstrumental,
            hasInstrumentalTimes,
        } = filters;

        const offset = mMul(mSub(page, 1), rowsPerPage);
        const limit = rowsPerPage === 0 ? rowsNumber : rowsPerPage;

        const querySongs = `SELECT s.id                                                     AS "id",
                                   s.artist                                                 AS "artist",
                                   s.name                                                   AS "name",
                                   s.note                                                   AS "note",
                                   s.difficulty                                             AS "difficulty",
                                   so.id IS NOT NULL                                        AS "hasOriginal",
                                   so."startTime" IS NOT NULL AND so."switchTime" IS NOT NULL AND
                                   so."singTime" IS NOT NULL AND so."endTime" IS NOT NULL   AS "hasOriginalTimes",
                                   so.lyrics IS NOT NULL                                    AS "hasOriginalLyrics",
                                   si.id IS NOT NULL                                        AS "hasInstrumental",
                                   si."switchTime" IS NOT NULL AND si."endTime" IS NOT NULL AS "hasInstrumentalTimes",
                                   COUNT(s.id) OVER ()                                      AS "rowsNumber"
                            FROM songs s
                                     LEFT JOIN song_originals so ON s.id = so."songId"
                                     LEFT JOIN song_instrumentals si ON s.id = si."songId"
                            WHERE ($1::integer IS NULL OR s.id = $1)
                              AND ($2::text IS NULL OR $2 = '' OR LOWER(s."artist") LIKE '%' || LOWER($2) || '%')
                              AND ($3::text IS NULL OR $3 = '' OR LOWER(s.name) LIKE '%' || LOWER($3) || '%')
                              AND ($4::text IS NULL OR $4 = '' OR LOWER(s.note) LIKE '%' || LOWER($4) || '%')
                              AND ($5::integer IS NULL OR s.difficulty = $5)
                              AND ($6::boolean IS NULL OR so.id IS NOT NULL = $6)
                              AND ($7::boolean IS NULL OR so."startTime" IS NOT NULL AND so."switchTime" IS NOT NULL AND
                                                          so."singTime" IS NOT NULL AND so."endTime" IS NOT NULL = $7)
                              AND ($8::boolean IS NULL OR so.lyrics IS NOT NULL = $8)
                              AND ($9::boolean IS NULL OR si.id IS NOT NULL = $9)
                              AND ($10::boolean IS NULL OR
                                   si."switchTime" IS NOT NULL AND si."endTime" IS NOT NULL = $10)
                            ORDER BY "${ sortBy }" ${ descending ? 'DESC' : 'ASC' }
                            LIMIT ${ limit } OFFSET ${ offset }`;
        const resSongs = await db.query(querySongs, [
            id,
            artist,
            name,
            note,
            difficulty,
            hasOriginal,
            hasOriginalTimes,
            hasOriginalLyrics,
            hasInstrumental,
            hasInstrumentalTimes,
        ]);

        data = {
            message:    {
                songs: resSongs.rows,
            },
            statusCode: 200,
        };
    }
    catch (e) {
        data = errorHandler(e, funcName);
    }

    return data;
}

/**
 * Добавление песен из плейлиста Spotify
 * @param { Array<{ trackURI: string, trackName: string, artistName: string }> } body
 * @returns { Promise<{ message: string | { counters: { inserted: number, updated: number } }, statusCode: number }>}
 * */
async function addSongsFromSpotify(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = addSongsFromSpotify.name;
    const client = await db.getClient();
    let hasTransaction = false;

    try {
        await client.query('BEGIN');
        hasTransaction = true;

        const counters = {
            inserted: 0,
            updated:  0,
        };

        for (const song of body) {
            const {
                trackURI,
                trackName,
                artistName,
            } = song;

            const artist = artistName.split(';').join(', ');

            const queryCheckExisting = `SELECT
                                        FROM songs
                                        WHERE LOWER(artist) = $1
                                          AND LOWER(name) = $2
                                            FOR UPDATE`;
            const resCheckExisting = await client.query(queryCheckExisting, [ artist.toLowerCase(), trackName.toLowerCase() ]);

            if (resCheckExisting.rows.length > 0) {
                const queryUpdateSong = `UPDATE songs
                                         SET "spotifyURI" = $3,
                                             artist       = $4,
                                             name         = $5,
                                             "updateDate" = NOW()
                                         WHERE LOWER(artist) = $1
                                           AND LOWER(name) = $2`;
                const resUpdateSong = await client.query(queryUpdateSong, [ artist.toLowerCase(), trackName.toLowerCase(), trackURI, artist, trackName ]);

                if (resUpdateSong.rowCount > 0) {
                    counters.updated = mAdd(counters.updated, resUpdateSong.rowCount);
                }
                else {
                    console.error(`${ funcName } Не обновлена песня (artist: ${ artist }, trackName: ${ trackName }, trackURI: ${ trackURI })`);
                    return data;
                }
            }
            else {
                const queryInsertSong = `INSERT INTO songs (artist, name, "spotifyURI")
                                         VALUES ($1, $2, $3)`;
                const resInsertSong = await client.query(queryInsertSong, [ artist, trackName, trackURI ]);

                if (resInsertSong.rowCount > 0) {
                    counters.inserted = mAdd(counters.inserted, resInsertSong.rowCount);
                }
                else {
                    console.error(`${ funcName } Не добавлена песня (artist: ${ artist }, trackName: ${ trackName }, trackURI: ${ trackURI })`);
                    return data;
                }
            }

            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    {
                    counters: counters,
                },
                statusCode: 200,
            };
        }
    }
    catch (e) {
        data = errorHandler(e, funcName);
    }
    finally {
        if (hasTransaction) {
            await client.query('ROLLBACK');
        }

        client.release();
    }

    return data;
}

export {
    addSong,
    getSongs,
    addSongsFromSpotify,
};
