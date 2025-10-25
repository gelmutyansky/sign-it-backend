import * as db from '../../../db/index.js';

import * as fse from 'fs-extra';
import Vtt from 'vtt-creator';

const publicFolder = './public/song_originals';

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

/**
 * Установление меток времени
 * @param { Object } body
 * @param { number } body.id
 * @param { number } body.startTime
 * @param { number } body.switchTime
 * @param { number } body.singTime
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
            startTime,
            switchTime,
            singTime,
            endTime,
        } = body;

        const isTimeCorrect = startTime <= switchTime
            && switchTime <= singTime
            && singTime <= endTime;

        if (!isTimeCorrect) {
            console.error(`${ funcName } Нелогичные метки времени
            startTime <= switchTime <= singTime <= endTime
            ${ startTime } <= ${ switchTime } <= ${ singTime } <= ${ endTime }`);

            data.message = 'illogical time';
            return data;
        }

        const queryDuration = `SELECT duration
                               FROM videos
                                        INNER JOIN song_originals so on so."videoId" = videos."id"
                               WHERE so.id = $1
                                 AND duration IS NOT NULL`;
        const resDuration = await db.query(queryDuration, [ id ]);

        if (resDuration.rows.length <= 0) {
            console.error(`${ funcName } Видео не найдено (возможно, не задана длительность) (id: ${ id })`);
            data.message = 'video not found'
            return data;
        }

        const { duration } = resDuration.rows[0];
        if (endTime > duration) {
            console.error(`${ funcName } Длительность видео меньше, чем метка времени окончания (id: ${ id }, endTime: ${ endTime }, duration: ${ duration })`);

            data.message = 'endTime > duration';
            return data;
        }

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryUpdateTimes = `UPDATE song_originals
                                  SET "startTime"  = $2,
                                      "switchTime" = $3,
                                      "singTime"   = $4,
                                      "endTime"    = $5
                                  WHERE id = $1`;
        const resUpdateTimes = await client.query(queryUpdateTimes, [ id, startTime, switchTime, singTime, endTime ]);

        if (resUpdateTimes.rowCount > 0) {
            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    'success',
                statusCode: 200,
            };
        }
        else {
            console.error(`${ funcName } Метки времени в оригинале не обновлены (id: ${ id }, startTime: ${ startTime }, switchTime: ${ switchTime }, singTime: ${ singTime }, endTime: ${ endTime })`);
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

/**
 * Настройка текста песни
 * @param { Object } body
 * @param { number } body.id
 * @param { Array<{ startTime: number, endTime: number, mustSing: boolean, verse: string }>} body.lyrics
 * @returns { Promise<{ message: string, statusCode: number }>}
 * */
export async function setLyrics(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = setLyrics.name;
    let client;
    let hasTransaction = false;

    try {
        const {
            id,
            lyrics,
        } = body;

        const vtt = new Vtt();
        let lyricsBeforeSing = '';

        let hasMustSing = false;
        let previousEndTime;
        for (const [ i, lyric ] of lyrics.entries()) {
            const { startTime, endTime, mustSing, verse } = lyric;

            if (hasMustSing) {

            }
            else {
                if (mustSing) {
                    hasMustSing = true;
                    lyricsBeforeSing = vtt.toString();
                }
            }

            if (previousEndTime) {
                if (startTime <= previousEndTime) {
                    console.error(`${ funcName } Начало куплета не может быть раньше окончания прошлого куплета (id: ${ id }, i: ${ i }, startTime: ${ startTime }, previousEndTime: ${ previousEndTime })`);
                    return data;
                }
            }

            previousEndTime = endTime;

            vtt.add(startTime, endTime, verse.split('\n').map(text => mustSing ? `<b>${ text }</b>` : text));
        }

        if (!hasMustSing) {
            console.error(`${ funcName } Нет куплета для пения (id: ${ id }, hasMustSing: ${ hasMustSing })`);
            data.message = 'no mustSing';
            return data;
        }

        const lyricsAfterSing = vtt.toString();

        const queryVideo = `SELECT v.duration AS "duration"
                            FROM song_originals so
                                     INNER JOIN videos v ON so."videoId" = v.id
                            WHERE so.id = $1
                              AND v.duration IS NOT NULL`;
        const resVideo = await db.query(queryVideo, [ id ]);

        if (resVideo.rows.length <= 0) {
            console.error(`${ funcName } Видео не найдено (возможно, не задана длительность) (id: ${ id })`);
            data.message = 'video not found';
            return data;
        }

        const { duration } = resVideo.rows[0];
        if (previousEndTime > duration) {
            console.error(`${ funcName } Длительность видео меньше, чем окончание последнего куплета (id: ${ id }, previousEndTime: ${ previousEndTime }, duration: ${ duration })`);
            data.message = 'previousEndTime > duration';
            return data;
        }

        const lyricsBeforeSingPath = `${ publicFolder }/${ id }/lyricsBeforeSing.vtt`;
        await fse.outputFile(lyricsBeforeSingPath, lyricsBeforeSing);
        const lyricsAfterSingPath = `${ publicFolder }/${ id }/lyricsAfterSing.vtt`;
        await fse.outputFile(lyricsAfterSingPath, lyricsAfterSing);

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryUpdateLyrics = `UPDATE song_originals
                                   SET lyrics                 = $2,
                                       "lyricsBeforeSingPath" = $3,
                                       "lyricsAfterSingPath"  = $4
                                   WHERE id = $1`;
        const resUpdateLyrics = await client.query(queryUpdateLyrics, [ id, JSON.stringify(lyrics), lyricsBeforeSingPath, lyricsAfterSingPath ]);

        if (resUpdateLyrics.rowCount > 0) {
            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    'success',
                statusCode: 200,
            };
        }
        else {
            console.error(`${ funcName } Не обновлена лирика `);
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
