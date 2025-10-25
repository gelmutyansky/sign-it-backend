import * as db from '../../../db/index.js';

/**
 * Прикрепление оригинального видео к песне
 * @param { Object } body
 * @param { number } body.songId
 * @param { number } body.videoId
 * @returns { Promise<{ message: string | { id: number }, statusCode: number }>}
 * */
export async function attachOriginal(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = attachOriginal.name;
    let client;
    let hasTransaction = false;

    try {
        const { songId, videoId } = body;

        const queryExistingOriginal = `SELECT id
                                       FROM song_originals
                                       WHERE "songId" = $1
                                         AND "videoId" = $2`;
        const resExistingOriginal = await db.query(queryExistingOriginal, [ songId, videoId ]);

        if (resExistingOriginal.rows.length > 0) {
            const { id } = resExistingOriginal.rows[0];

            data = {
                message:    {
                    id: id,
                },
                statusCode: 200,
            };

            return data;
        }

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryInsertOriginal = `INSERT INTO song_originals ("songId", "videoId")
                                     VALUES ($1, $2)
                                     ON CONFLICT ("songId") DO UPDATE SET "videoId"    = $2,
                                                                          "startTime"  = NULL,
                                                                          "switchTime" = NULL,
                                                                          "singTime"   = NULL,
                                                                          "endTime"    = NULL,
                                                                          lyrics       = NULL
                                     RETURNING id`;
        const resInsertOriginal = await client.query(queryInsertOriginal, [ songId, videoId ]);

        if (resInsertOriginal.rowCount > 0 && resInsertOriginal.rows.length > 0) {
            const { id } = resInsertOriginal.rows[0];

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
            console.error(`${ funcName } Не получилось привязать оригинал к песне (songId: ${ songId }, videoId: ${ videoId } )`);
        }
    }
    catch (e) {
        console.error(`${ funcName }: ERROR`);
        console.error(e.message);
        console.error(e.stack);
    }
    finally {
        if (client) {
            if (hasTransaction) {
                await client.query('ROLLBACK');
            }

            client.release();
        }
    }

    return data;
}

