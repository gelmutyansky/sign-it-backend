import * as db from '../../db/index.js';

/**
 * Добавление песни
 * @param { Object } body
 * @param { string } body.artist
 * @param { string } body.name
 * @param { string | null } body.note
 * @returns { Promise<{ message: string | { id: number }, statusCode: number }>}
 * */
export async function addSong(body) {
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
        } = body;

        await client.query('BEGIN');
        hasTransaction = true;

        const queryInsertSong = `INSERT INTO songs (artist, name, note)
                                 VALUES ($1, $2, $3)
                                 RETURNING id`;
        const resInsertSong = await client.query(queryInsertSong, [ artist, name, note ]);

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
            console.error(`${ funcName } Не добавлена песня (artist: ${ artist }, name: ${ name }, note: ${ note })`);
        }
    }
    catch (e) {
        console.error(`${ funcName }: ERROR`);
        console.error(e.message);
        console.error(e.stack);
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
 * Редактирование песни
 * @param { Object } body
 * @param { number } body.id
 * @param { string } body.artist
 * @param { string } body.name
 * @param { string | null } body.note
 * @returns { Promise<{ message: string, statusCode: number }>}
 * */
export async function editSong(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = editSong.name;
    const client = await db.getClient();
    let hasTransaction = false;

    try {
        const {
            id,
            artist,
            name,
            note,
        } = body;

        await client.query('BEGIN');
        hasTransaction = true;

        const queryUpdateSong = `UPDATE songs
                                 SET artist = $2,
                                     name   = $3,
                                     note   = $4
                                 WHERE id = $1`;
        const resUpdateSong = await client.query(queryUpdateSong, [ id, artist, name, note ]);

        if (resUpdateSong.rowCount > 0) {
            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    'success',
                statusCode: 200,
            };
        }
        else {
            console.error(`${ funcName } Не обновлена песня (id: ${ id }, artist: ${ artist }, name: ${ name }, note: ${ note })`);
        }
    }
    catch (e) {
        console.error(`${ funcName }: ERROR`);
        console.error(e.message);
        console.error(e.stack);
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
 * Получение информации о песне
 * @param { Object } body
 * @param { number } body.id
 * @returns { Promise<{ message: string | { artist: string, name: string, note: string | null, original: { startTime: number | null, switchTime: number | null, singTime: number | null, endTime: number | null, lyrics: Array<{ startTime: number, endTime: number, mustSing: boolean, verse: string }>, lyricsBeforeSingPath: string | null, lyricsAfterSingPath: string | null, videoId: number, path: string | null, isAudioOnly: boolean, thumbnailPath: string | null, duration: number | null, thumbnailUrl: string | null }, instrumental: { switchTime: number | null, endTime: number | null, videoId: number, path: string | null, isAudioOnly: boolean, thumbnailPath: string | null, duration: number | null, thumbnailUrl: string | null } }, statusCode: number }>}
 * */
export async function getSong(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = getSong.name;

    try {
        const {
            id,
        } = body;

        const querySong = `SELECT s.artist          AS "artist",
                                  s.name            AS "name",
                                  s.note            AS "note",
                                  so.id IS NOT NULL AS "hasOriginal",
                                  si.id IS NOT NULL AS "hasInstrumental"
                           FROM songs s
                                    LEFT JOIN song_originals so ON s.id = so."songId"
                                    LEFT JOIN song_instrumentals si ON s.id = si."songId"
                           WHERE s.id = $1`;
        const resSong = await db.query(querySong, [ id ]);

        if (resSong.rows.length > 0) {
            const { hasOriginal, hasInstrumental, ...song } = resSong.rows[0];

            if (hasOriginal) {
                const queryOriginal = `SELECT so."startTime"            AS "startTime",
                                              so."switchTime"           AS "switchTime",
                                              so."singTime"             AS "singTime",
                                              so."endTime"              AS "endTime",
                                              so."lyrics"               AS "lyrics",
                                              so."lyricsBeforeSingPath" AS "lyricsBeforeSingPath",
                                              so."lyricsAfterSingPath"  AS "lyricsAfterSingPath",
                                              so."videoId"              AS "videoId",
                                              v."youtubeId"             AS "youtubeId",
                                              v."path"                  AS "path",
                                              v."isAudioOnly"           AS "isAudioOnly",
                                              v."thumbnailPath"         AS "thumbnailPath",
                                              v."duration"              AS "duration",
                                              v."thumbnailUrl"          AS "thumbnailUrl"
                                       FROM song_originals so
                                                INNER JOIN videos v
                                                           on so."videoId" = v.id
                                       WHERE so."songId" = $1`;
                const resOriginal = await db.query(queryOriginal, [ id ]);

                if (resOriginal.rows.length <= 0) {
                    console.error(`${ funcName } Не найден оригинал песни (id: ${ id })`);
                    data.message = 'original not found';
                    return data;
                }

                song.original = resOriginal.rows[0];
            }
            else {
                song.original = null;
            }

            if (hasInstrumental) {
                const queryInstrumental = `SELECT si."switchTime"   AS "switchTime",
                                                  si."endTime"      AS "endTime",
                                                  si."videoId"      AS "videoId",
                                                  v."youtubeId"     AS "youtubeId",
                                                  v."path"          AS "path",
                                                  v."isAudioOnly"   AS "isAudioOnly",
                                                  v."thumbnailPath" AS "thumbnailPath",
                                                  v."duration"      AS "duration",
                                                  v."thumbnailUrl"  AS "thumbnailUrl"
                                           FROM song_instrumentals si
                                                    INNER JOIN videos v
                                                               on si."videoId" = v.id
                                           WHERE si."songId" = $1`;
                const resInstrumental = await db.query(queryInstrumental, [ id ]);

                if (resInstrumental.rows.length <= 0) {
                    console.error(`${ funcName } Не найдена инструментальная версия песни (id: ${ id })`);
                    data.message = 'instrumental not found';
                    return data;
                }

                song.instrumental = resInstrumental.rows[0];
            }
            else {
                song.instrumental = null;
            }

            data = {
                message:    {
                    song: song,
                },
                statusCode: 200,
            };
        }
        else {
            data = {
                message:    'not found',
                statusCode: 404,
            };
        }
    }
    catch (e) {
        console.error(`${ funcName }: ERROR`);
        console.error(e.message);
        console.error(e.stack);
    }

    return data;
}
