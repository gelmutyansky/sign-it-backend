import * as db from '../../../../db/index.js';
import * as fs from '../../../../fs/index.js';
import { errorHandler } from '../../../../helpers/functions.js';

import Vtt from 'vtt-creator';

async function getFolder(id) {
    const publicFolder = './public/song_originals';
    return await fs.getFolder(publicFolder, id);
}

/**
 * Прикрепление оригинального видео к песне
 * @param { Object } params
 * @param { number } params.id - ID из songs
 * @param { Object } body
 * @param { number } body.videoId - ID из videos
 * @returns { Promise<{ message: string | { id: number }, statusCode: number }>}
 * */
async function attachOriginal(params, body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = attachOriginal.name;
    let client;
    let hasTransaction = false;
    const filesToDelete = [];

    try {
        const {
            id: songId,
        } = params;

        const {
            videoId,
        } = body;

        const queryExistingOriginal = `SELECT id,
                                              "videoId",
                                              "lyricsBeforeSingPath",
                                              "lyricsAfterSingPath"
                                       FROM song_originals
                                       WHERE "songId" = $1`;
        const resExistingOriginal = await db.query(queryExistingOriginal, [ songId ]);

        if (resExistingOriginal.rows.length > 0) {
            const {
                id,
                videoId: previousVideoId,
                lyricsBeforeSingPath,
                lyricsAfterSingPath,
            } = resExistingOriginal.rows[0];

            if (previousVideoId === videoId) {
                data = {
                    message:    {
                        id: id,
                    },
                    statusCode: 200,
                };

                return data;
            }
            else {
                if (lyricsBeforeSingPath) {
                    filesToDelete.push(lyricsBeforeSingPath);
                }

                if (lyricsAfterSingPath) {
                    filesToDelete.push(lyricsAfterSingPath);
                }
            }
        }

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryInsertOriginal = `INSERT INTO song_originals ("songId", "videoId")
                                     VALUES ($1, $2)
                                     ON CONFLICT ("songId") DO UPDATE SET "videoId"              = $2,
                                                                          "startTime"            = NULL,
                                                                          "switchTime"           = NULL,
                                                                          "singTime"             = NULL,
                                                                          "endTime"              = NULL,
                                                                          lyrics                 = NULL,
                                                                          "lyricsBeforeSingPath" = NULL,
                                                                          "lyricsAfterSingPath"  = NULL
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
        data = errorHandler(e, funcName);
    }
    finally {
        if (client) {
            if (hasTransaction) {
                await client.query('ROLLBACK');
            }

            client.release();
        }

        if (data.statusCode === 200 && filesToDelete.length > 0) {
            for (const filePath of filesToDelete) {
                fs.removeFile(filePath, funcName);
            }
        }
    }

    return data;
}

/**
 * Открепление оригинального видео от песни
 * @param { Object } params
 * @param { number } params.id - ID из songs
 * @returns { Promise<{ message: string, statusCode: number }>}
 * */
async function detachOriginal(params) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = detachOriginal.name;
    let client;
    let hasTransaction = false;
    const filesToDelete = [];

    try {
        const {
            id: songId,
        } = params;

        const queryExistingOriginal = `SELECT
                                       FROM song_originals
                                       WHERE "songId" = $1`;
        const resExistingOriginal = await db.query(queryExistingOriginal, [ songId ]);

        if (resExistingOriginal.rows.length <= 0) {
            console.log(`${ funcName } Нет оригинала для открепления (songId: ${ songId })`);
            data = {
                message:    'success',
                statusCode: 200,
            };
            return data;
        }

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryDeleteOriginal = `DELETE
                                     FROM song_originals
                                     WHERE "songId" = $1
                                     RETURNING "lyricsBeforeSingPath", "lyricsAfterSingPath"`;
        const resDeleteOriginal = await client.query(queryDeleteOriginal, [ songId ]);

        if (resDeleteOriginal.rowCount > 0 && resDeleteOriginal.rows.length > 0) {
            const { lyricsBeforeSingPath, lyricsAfterSingPath } = resDeleteOriginal.rows[0];

            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    'success',
                statusCode: 200,
            };

            if (lyricsBeforeSingPath) {
                filesToDelete.push(lyricsBeforeSingPath);
            }

            if (lyricsAfterSingPath) {
                filesToDelete.push(lyricsAfterSingPath);
            }
        }
        else {
            console.error(`${ funcName } Не получилось удалить связь песни с оригиналом (songId: ${ songId })`);
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

        if (data.statusCode === 200 && filesToDelete.length > 0) {
            for (const filePath of filesToDelete) {
                fs.removeFile(filePath, funcName);
            }
        }
    }

    return data;
}

/**
 * Установление меток времени
 * @param { Object } params
 * @param { number } params.id - ID из songs
 * @param { Object } body
 * @param { number } body.startTime - время начала оригинала (сек)
 * @param { number } body.switchTime - время переключения на инструментальную версию (сек)
 * @param { number } body.singTime - время начала пения (сек)
 * @param { number } body.endTime - время окончания оригининала
 * @returns { Promise<{ message: string, statusCode: number }>}
 * */
async function setTimes(params, body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = setTimes.name;
    let client;
    let hasTransaction = false;

    try {
        const {
            id: songId,
        } = params;

        const {
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

        const queryVideo = `SELECT v.duration AS "duration"
                            FROM song_originals so
                                     INNER JOIN videos v ON so."videoId" = v."id"
                            WHERE so."songId" = $1
                              AND v.duration IS NOT NULL`;
        const resVideo = await db.query(queryVideo, [ songId ]);

        if (resVideo.rows.length <= 0) {
            console.error(`${ funcName } Видео не найдено (возможно, не задана длительность) (songId: ${ songId })`);
            data.message = 'video not found';
            return data;
        }

        const { duration } = resVideo.rows[0];
        if (endTime > duration) {
            console.error(`${ funcName } Длительность видео меньше, чем метка времени окончания (songId: ${ songId }, endTime: ${ endTime }, duration: ${ duration })`);
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
                                  WHERE "songId" = $1`;
        const resUpdateTimes = await client.query(queryUpdateTimes, [ songId, startTime, switchTime, singTime, endTime ]);

        if (resUpdateTimes.rowCount > 0) {
            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    'success',
                statusCode: 200,
            };
        }
        else {
            console.error(`${ funcName } Метки времени в оригинале не обновлены (songId: ${ songId }, startTime: ${ startTime }, switchTime: ${ switchTime }, singTime: ${ singTime }, endTime: ${ endTime })`);
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
 * Настройка текста песни
 * @param { Object } params
 * @param { number } params.id
 * @param { Object } body
 * @param { Array<{ startTime: number, endTime: number, mustSing: boolean, verse: string }>} body.lyrics
 * @returns { Promise<{ message: string, statusCode: number }>}
 * */
async function setLyrics(params, body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = setLyrics.name;
    let client;
    let hasTransaction = false;

    try {
        const {
            id: songId,
        } = params;

        const {
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
                if (startTime < previousEndTime) {
                    console.error(`${ funcName } Начало куплета не может быть раньше окончания прошлого куплета (songId: ${ songId }, i: ${ i }, startTime: ${ startTime }, previousEndTime: ${ previousEndTime })`);
                    return data;
                }
            }

            previousEndTime = endTime;

            vtt.add(startTime, endTime, verse.split('\n').map(text => mustSing ? `<b>${ text }</b>` : text));
        }

        if (!hasMustSing) {
            console.error(`${ funcName } Нет куплета для пения (songId: ${ songId }, hasMustSing: ${ hasMustSing })`);
            data.message = 'no mustSing';
            return data;
        }

        const lyricsAfterSing = vtt.toString();

        const queryVideo = `SELECT v.duration AS "duration"
                            FROM song_originals so
                                     INNER JOIN videos v ON so."videoId" = v.id
                            WHERE so."songId" = $1
                              AND v.duration IS NOT NULL`;
        const resVideo = await db.query(queryVideo, [ songId ]);

        if (resVideo.rows.length <= 0) {
            console.error(`${ funcName } Видео не найдено (возможно, не задана длительность) (songId: ${ songId })`);
            data.message = 'video not found';
            return data;
        }

        const { duration } = resVideo.rows[0];
        if (previousEndTime > duration) {
            console.error(`${ funcName } Длительность видео меньше, чем окончание последнего куплета (songId: ${ songId }, previousEndTime: ${ previousEndTime }, duration: ${ duration })`);
            data.message = 'previousEndTime > duration';
            return data;
        }

        const folder = await getFolder(songId);

        const lyricsBeforeSingPath = `${ folder }/lyricsBeforeSing.vtt`;
        await fs.outputFile(lyricsBeforeSingPath, lyricsBeforeSing);
        const lyricsAfterSingPath = `${ folder }/lyricsAfterSing.vtt`;
        await fs.outputFile(lyricsAfterSingPath, lyricsAfterSing);

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryUpdateLyrics = `UPDATE song_originals
                                   SET lyrics                 = $2,
                                       "lyricsBeforeSingPath" = $3,
                                       "lyricsAfterSingPath"  = $4
                                   WHERE "songId" = $1`;
        const resUpdateLyrics = await client.query(queryUpdateLyrics, [ songId, JSON.stringify(lyrics), lyricsBeforeSingPath, lyricsAfterSingPath ]);

        if (resUpdateLyrics.rowCount > 0) {
            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    'success',
                statusCode: 200,
            };
        }
        else {
            console.error(`${ funcName } Не обновлена лирика (songId: ${ songId })`);
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

        // todo: delete files on not success
    }

    return data;
}

export {
    attachOriginal,
    detachOriginal,
    setTimes,
    setLyrics,
};
