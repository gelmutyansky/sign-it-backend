import * as db from '../../../db/index.js';
import { errorHandler } from '../../../helpers/functions.js';

/**
 * Прикрепление инструментальной версии видео к песне
 * @param { Object } body
 * @param { number } body.songId
 * @param { number } body.videoId
 * @returns { Promise<{ message: string | { id: number }, statusCode: number }>}
 * */
export async function attachInstrumental(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = attachInstrumental.name;
    let client;
    let hasTransaction = false;

    try {
        const { songId, videoId } = body;

        const queryExistingInstrumental = `SELECT id,
                                                  "videoId"
                                           FROM song_instrumentals
                                           WHERE "songId" = $1`;
        const resExistingInstrumental = await db.query(queryExistingInstrumental, [ songId ]);

        if (resExistingInstrumental.rows.length > 0) {
            const {
                id,
                videoId: previousVideoId,
            } = resExistingInstrumental.rows[0];

            if (previousVideoId === videoId) {
                data = {
                    message:    {
                        id: id,
                    },
                    statusCode: 200,
                };

                return data;
            }
        }

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryInsertInstrumental = `INSERT INTO song_instrumentals ("songId", "videoId")
                                         VALUES ($1, $2)
                                         RETURNING id`;
        const resInsertInstrumental = await client.query(queryInsertInstrumental, [ songId, videoId ]);

        if (resInsertInstrumental.rowCount > 0 && resInsertInstrumental.rows.length > 0) {
            const { id } = resInsertInstrumental.rows[0];

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
            console.error(`${ funcName } Не получилось привязать инструментальную версию к песне (songId: ${ songId }, videoId: ${ videoId } )`);
        }
    }
    catch (e) {
        data = errorHandler(e, funcName);
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

/**
 * Открепление инструментальной версии видео от песни
 * @param { Object } body
 * @param { number } body.songId
 * @returns { Promise<{ message: string, statusCode: number }>}
 * */
export async function detachInstrumental(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = detachInstrumental.name;
    let client;
    let hasTransaction = false;

    try {
        const { songId } = body;

        const queryExistingInstrumental = `SELECT
                                           FROM song_instrumentals
                                           WHERE "songId" = $1`;
        const resExistingInstrumental = await db.query(queryExistingInstrumental, [ songId ]);

        if (resExistingInstrumental.rows.length <= 0) {
            console.log(`${ funcName } Нет инструментальной версии для открепления (songId: ${ songId })`);
            data = {
                message:    'success',
                statusCode: 200,
            };
            return data;
        }

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryDeleteInstrumental = `DELETE
                                         FROM song_instrumentals
                                         WHERE "songId" = $1`;
        const resDeleteInstrumental = await client.query(queryDeleteInstrumental, [ songId ]);

        if (resDeleteInstrumental.rowCount > 0 && resDeleteInstrumental.rows.length > 0) {
            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    'success',
                statusCode: 200,
            };
        }
        else {
            console.error(`${ funcName } Не получилось удалить связь песни с инструментальной версией (songId: ${ songId })`);
        }
    }
    catch (e) {
        data = errorHandler(e, funcName);
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

/**
 * Установление меток времени
 * @param { Object } body
 * @param { number } body.id
 * @param { number } body.switchTime
 * @param { number } body.endTime
 * @returns { Promise<{ message: string, statusCode: number }>}
 * */
export async function setTimes(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = setTimes.name;
    let client;
    let hasTransaction = false;

    try {
        const {
            id,
            switchTime,
            endTime,
        } = body;

        const isTimeCorrect = switchTime <= endTime;

        if (!isTimeCorrect) {
            console.error(`${ funcName } Нелогичные метки времени
            switchTime <= endTime
            ${ switchTime } <= ${ endTime }`);
            data.message = 'illogical time';
            return data;
        }

        const queryVideo = `SELECT v.duration AS "duration"
                            FROM song_instrumentals si
                                     INNER JOIN videos v ON si."videoId" = v.id
                            WHERE si.id = $1
                              AND v.duration IS NOT NULL`;
        const resVideo = await db.query(queryVideo, [ id ]);

        if (resVideo.rows.length <= 0) {
            console.error(`${ funcName } Видео не найдено (возможно, не задана длительность) (id: ${ id })`);
            data.message = 'video not found';
            return data;
        }

        const { duration } = resVideo.rows[0];
        if (endTime > duration) {
            console.error(`${ funcName } Длительность видео меньше, чем метка времени окончания (id: ${ id }, endTime: ${ endTime }, duration: ${ duration })`);
            data.message = 'endTime > duration';
            return data;
        }

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryUpdateTimes = `UPDATE song_instrumentals
                                  SET "switchTime" = $2,
                                      "endTime"    = $3
                                  WHERE id = $1`;
        const resUpdateTimes = await client.query(queryUpdateTimes, [ id, switchTime, endTime ]);

        if (resUpdateTimes.rowCount > 0) {
            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    'success',
                statusCode: 200,
            };
        }
        else {
            console.error(`${ funcName } Метки времени в инструментальной версии не обновлены (id: ${ id }, switchTime: ${ switchTime }, endTime: ${ endTime })`);
        }
    }
    catch (e) {
        data = errorHandler(e, funcName);
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
