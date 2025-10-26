import * as db from '../../../db/index.js';

import { extname } from 'path';
import fse from 'fs-extra/esm';
import getVideoId from 'get-video-id';
import { YtDlp } from 'ytdlp-nodejs';

import { download } from '../../../helpers/axios.js';
import * as fsHelper from '../../../helpers/filesystem.js';

async function getFolder(id) {
    return await fsHelper.getFolder('./public/videos', id);
}

const ytdlpOptions = {};
if (process.env.YT_DLP_BINARY_PATH) {
    ytdlpOptions.binaryPath = process.env.YT_DLP_BINARY_PATH;
}
if (process.env.YT_DLP_FFMPEG_PATH) {
    ytdlpOptions.binaryPath = process.env.YT_DLP_FFMPEG_PATH;
}

const ytDlp = new YtDlp(ytdlpOptions);

function getYoutubeUrl(youtubeId) {
    return `https://www.youtube.com/watch?v=${ youtubeId }`;
}

/**
 * Добавление видео с Youtube
 * @param { Object } body
 * @param { string } body.youtubeUrl
 * @param { boolean } body.isAudioOnly
 * @returns { Promise<{ message: string | { id: number, isNew: boolean }, statusCode: number }> }
 * */
export async function addVideoFromYoutube(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = addVideoFromYoutube.name;
    let hasTransaction = false;
    let client;

    try {
        const {
            youtubeUrl,
            isAudioOnly = false,
        } = body;

        const { id: youtubeId } = getVideoId(youtubeUrl);

        const queryExistingVideo = `SELECT id AS "id"
                                    FROM videos
                                    WHERE "youtubeId" = $1
                                      AND "isAudioOnly" = $2`;
        const resExistingVideo = await db.query(queryExistingVideo, [ youtubeId, isAudioOnly ]);

        if (resExistingVideo.rows.length > 0) {
            const { id } = resExistingVideo.rows[0];

            data = {
                message:    {
                    id:    id,
                    isNew: false,
                },
                statusCode: 200,
            };

            return data;
        }

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryInsertVideo = `INSERT INTO videos ("youtubeId", "isAudioOnly")
                                  VALUES ($1, $2)
                                  RETURNING id`;
        const resInsertVideo = await client.query(queryInsertVideo, [ youtubeId, isAudioOnly ]);

        if (resInsertVideo.rowCount > 0 && resInsertVideo.rows.length > 0) {
            const { id } = resInsertVideo.rows[0];
            await client.query('COMMIT');
            hasTransaction = false;

            data = {
                message:    {
                    id:    id,
                    isNew: true,
                },
                statusCode: 200,
            };
        }
        else {
            console.error(`${ funcName } Не получилось добавить запись в таблицу видео (youtubeId: ${ youtubeId }, isAudioOnly: ${ isAudioOnly })`);
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

        if (data.statusCode === 200) {
            if (data.message.isNew) {
                fetchVideoFromYoutube({ id: data.message.id }).then();
                downloadVideoFromYoutube({ id: data.message.id }).then();
            }
        }
    }

    return data;
}

/**
 * Скачивание видео с Youtube
 * @param { number } id - ID в таблице video
 * @returns { Promise<{ message: string, statusCode: number }>}
 * */
export async function downloadVideoFromYoutube({ id }) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = downloadVideoFromYoutube.name;
    let client;
    let hasTransaction = false;
    let pathToDelete;

    try {
        const queryVideo = `SELECT "youtubeId"   AS "youtubeId",
                                   "isAudioOnly" AS "isAudioOnly",
                                   path          AS "oldVideoPath"
                            FROM videos
                            WHERE id = $1`;
        const resVideo = await db.query(queryVideo, [ id ]);

        if (resVideo.rows.length <= 0) {
            console.error(`${ funcName } Запись в таблице video не найдена (id: ${ id })`);
        }

        const {
            youtubeId,
            isAudioOnly,
            oldVideoPath,
        } = resVideo.rows[0];

        if (!youtubeId) {
            console.error(`${ funcName } Нет youtubeId (id: ${ id }, youtubeId: ${ youtubeId })`);
            data.message = 'no youtubeId';
            return data;
        }

        const youtubeUrl = getYoutubeUrl(youtubeId);
        const folder = await getFolder(id);

        const timestamp = +new Date;
        let downloadOptions;
        let videoPath;

        if (isAudioOnly) {
            downloadOptions = {
                output:       `${ folder }/audio${ timestamp }.%(ext)s`,
                extractAudio: true,
                audioFormat:  'm4a',
            };
            videoPath = `${ folder }/audio${ timestamp }.m4a`;
        }
        else {
            downloadOptions = {
                output: `${ folder }/video${ timestamp }.%(ext)s`,
                format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            };
            videoPath = `${ folder }/video-${ timestamp }.mp4`;
        }

        const output = await ytDlp.downloadAsync(
            youtubeUrl,
            {
                onProgress: (progress) => {
                    console.log(progress);
                },
                ...downloadOptions,
            },
        );

        console.log(output);

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryUpdateVideo = `UPDATE videos
                                  SET path = $2
                                  WHERE id = $1`;
        const resUpdateVideo = await client.query(queryUpdateVideo, [ id, videoPath ]);

        if (resUpdateVideo.rowCount <= 0) {
            console.error(`${ funcName } Не обновлена таблица video (id: ${ id }, videoPath: ${ videoPath })`);
            return data;
        }

        await client.query('COMMIT');
        hasTransaction = false;

        data = {
            message:    'success',
            statusCode: 200,
        };

        if (oldVideoPath && oldVideoPath !== videoPath) {
            pathToDelete = oldVideoPath;
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

        if (pathToDelete) {
            fse.remove(pathToDelete, (err) => {
                if (err) {
                    console.error(`${ funcName } Файл не удалён из файловой системы (pathToDelete: ${ pathToDelete })`);
                }
                else {
                    console.log(`${ funcName } Файл удалён из файловой системы (pathToDelete: ${ pathToDelete })`);
                }
            });
        }
    }

    return data;
}

/**
 * Обновление информации о видео с Youtube
 * @param { number } id - ID в таблице video
 * @returns { Promise<{ message: string, statusCode: number }>}
 * */
export async function fetchVideoFromYoutube({ id }) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = fetchVideoFromYoutube.name;
    let client;
    let hasTransaction = false;
    let pathsToDelete = [];

    try {
        const queryVideo = `SELECT "youtubeId"     AS "youtubeId",
                                   "thumbnailPath" AS "oldThumbnailPath",
                                   "thumbnailUrl"  AS "oldThumbnailUrl"
                            FROM videos
                            WHERE id = $1`;
        const resVideo = await db.query(queryVideo, [ id ]);

        if (resVideo.rows.length <= 0) {
            console.error(`${ funcName } Запись в таблице video не найдена (id: ${ id })`);
            data = {
                message:    'not found',
                statusCode: 404,
            };
            return data;
        }

        const {
            youtubeId,
            oldThumbnailPath,
            oldThumbnailUrl,
        } = resVideo.rows[0];

        if (!youtubeId) {
            console.error(`${ funcName } Нет youtubeId (id: ${ id }, youtubeId: ${ youtubeId })`);
            data.message = 'no youtubeId';
            return data;
        }

        const youtubeUrl = getYoutubeUrl(youtubeId);
        const folder = await getFolder(id);

        const {
            thumbnail: thumbnailUrl,
            duration:  duration,
            fulltitle: title,
        } = await ytDlp.getInfoAsync(youtubeUrl);

        let thumbnailPath = oldThumbnailPath;

        if (!thumbnailUrl || !oldThumbnailPath || oldThumbnailUrl !== thumbnailUrl) {
            thumbnailPath = `${ folder }/thumbnail${ extname(thumbnailUrl) }`;
            await download(thumbnailUrl, thumbnailPath);
        }

        client = await db.getClient();

        await client.query('BEGIN');
        hasTransaction = true;

        const queryUpdateVideo = `UPDATE videos
                                  SET name            = $2,
                                      "thumbnailPath" = $3,
                                      duration        = $4,
                                      "thumbnailUrl"  = $5
                                  WHERE id = $1`;
        const resUpdateVideo = await client.query(queryUpdateVideo, [ id, title, thumbnailPath, duration, thumbnailUrl ]);

        if (resUpdateVideo.rowCount <= 0) {
            console.error(`${ funcName } Не обновлена таблица video (id: ${ id }, title: ${ title }, thumbnailPath: ${ thumbnailPath }, duration: ${ duration }, thumbnailUrl: ${ thumbnailUrl })`);
            return data;
        }

        await client.query('COMMIT');
        hasTransaction = false;

        data = {
            message:    'success',
            statusCode: 200,
        };

        if (oldThumbnailPath && oldThumbnailPath !== thumbnailPath) {
            pathsToDelete.push(oldThumbnailPath);
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

        if (pathsToDelete.length > 0) {
            for (const pathToDelete of pathsToDelete) {
                fse.remove(pathToDelete, (err) => {
                    if (err) {
                        console.error(`${ funcName } Файл не удалён из файловой системы (pathToDelete: ${ pathToDelete })`);
                    }
                    else {
                        console.log(`${ funcName } Файл удалён из файловой системы (pathToDelete: ${ pathToDelete })`);
                    }
                });
            }
        }
    }

    return data;
}
