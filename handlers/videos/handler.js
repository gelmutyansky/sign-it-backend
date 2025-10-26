import * as db from '../../db/index.js';

import { extname } from 'path';
import fse from 'fs-extra/esm';
import getVideoId from 'get-video-id';
import { YtDlp } from 'ytdlp-nodejs';

import { downloadImage } from '../../helpers/axios.js';
import * as fsHelper from '../../helpers/filesystem.js';

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

const ytdlp = new YtDlp(ytdlpOptions);

function getYoutubeUrl(youtubeId) {
    return `https://www.youtube.com/watch?v=${ youtubeId }`;
}

const publicFolder = './public/videos';

/**
 * Добавление видео с Youtube
 * @param { Object } body
 * @param { string } body.youtubeUrl
 * @param { boolean } body.isAudioOnly
 * @param { boolean } body.redownload
 * @returns { Promise<{ message: string | { id: number, name: string | null, path: string | null }, statusCode: number }> }
 * */
export async function addVideoFromYoutube(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = addVideoFromYoutube.name;
    let hasTransaction = false;
    let pathToDelete;
    const client = await db.getClient();

    try {
        const {
            youtubeUrl,
            isAudioOnly = false,
            redownload = false,
        } = body;

        const { id: youtubeId } = getVideoId(youtubeUrl);

        await client.query('BEGIN');
        hasTransaction = true;

        const queryExistingVideo = `SELECT id   AS "id",
                                           name AS "name",
                                           path AS "path"
                                    FROM videos
                                    WHERE "youtubeId" = $1
                                      AND "isAudioOnly" = $2
                                        FOR UPDATE`;
        const resExistingVideo = await client.query(queryExistingVideo, [ youtubeId, isAudioOnly ]);

        if (resExistingVideo.rows.length > 0) {
            const { id, name, path } = resExistingVideo.rows[0];
            if (redownload) {
                if (path) {
                    const queryUpdateVideo = `UPDATE videos
                                              SET path = NULL
                                              WHERE id = $1`;
                    const resUpdateVideo = await client.query(queryUpdateVideo, [ id ]);

                    if (resUpdateVideo.rowCount > 0) {
                        pathToDelete = path;
                    }
                    else {
                        console.error(`${ funcName } Не получилось занулить путь (id: ${ id })`);
                        return data;
                    }
                }

                data = {
                    message:    {
                        id:   id,
                        name: name,
                        path: null,
                    },
                    statusCode: 200,
                };
            }
            else {
                data = {
                    message:    {
                        id:   id,
                        name: name,
                        path: path,
                    },
                    statusCode: 200,
                };
            }
        }
        else {
            const queryInsertVideo = `INSERT INTO videos ("youtubeId", "isAudioOnly")
                                      VALUES ($1, $2)
                                      RETURNING id, name, path`;
            const resInsertVideo = await client.query(queryInsertVideo, [ youtubeId, isAudioOnly ]);

            if (resInsertVideo.rowCount > 0 && resInsertVideo.rows.length > 0) {
                const { id, name, path } = resInsertVideo.rows[0];

                data = {
                    message:    {
                        id:   id,
                        name: name,
                        path: path,
                    },
                    statusCode: 200,
                };
            }
            else {
                console.error(`${ funcName } Не получилось добавить запись в таблицу видео (youtubeId: ${ youtubeId }, isAudioOnly: ${ isAudioOnly })`);
                return data;
            }
        }

        await client.query('COMMIT');
        hasTransaction = false;
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

        if (data.statusCode === 200) {
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

            if (!data.message.name) {
                updateVideoFromYoutube({ id: data.message.id }).then();
            }

            if (!data.message.path) {
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

        let downloadOptions;
        let videoPath;

        if (isAudioOnly) {
            downloadOptions = {
                output:       `${ folder }/audio.%(ext)s`,
                extractAudio: true,
                audioFormat:  'm4a',
            };
            videoPath = `${ folder }/audio.m4a`;
        }
        else {
            downloadOptions = {
                output: `${ folder }/video.%(ext)s`,
                format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            };
            videoPath = `${ folder }/video.mp4`;
        }

        const output = await ytdlp.downloadAsync(
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
async function updateVideoFromYoutube({ id }) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = updateVideoFromYoutube.name;
    let client;
    let hasTransaction = false;

    try {
        const queryVideo = `SELECT "youtubeId",
                                   "name",
                                   "thumbnailPath",
                                   "duration"
                            FROM videos
                            WHERE id = $1`;
        const resVideo = await db.query(queryVideo, [ id ]);

        if (resVideo.rows.length > 0) {
            const { name, thumbnailPath, duration } = resVideo.rows[0];

            if (name && thumbnailPath && duration) {
                data = {
                    message:    'already filled',
                    statusCode: 200,
                };

                return data;
            }
        }
        else {
            console.error(`${ funcName } Запись в таблице video не найдена (id: ${ id })`);
        }

        const { youtubeId } = resVideo.rows[0];
        const youtubeUrl = getYoutubeUrl(youtubeId);
        const folder = `${ publicFolder }/${ id }`;
        await fse.ensureDir(folder);

        const {
            thumbnail: thumbnailUrl,
            duration:  duration,
            fulltitle: title,
        } = await ytdlp.getInfoAsync(youtubeUrl);

        const thumbnailPath = `${ folder }/thumbnail${ extname(thumbnailUrl) }`;
        await downloadImage(thumbnailUrl, thumbnailPath);

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
 * Поиск видео
 * @param { Object } body
 * @param { string } body.q
 * @param { boolean? } body.isAudioOnly
 * @returns { Promise<{ message: string | { videos: Array<{ id: string, youtubeId: string, name: string | null, path: string | null, isAudioOnly: boolean, thumbnailPath: string | null, duration: number }>}, statusCode: number }> }
 * */
export async function searchVideo(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = searchVideo.name;

    try {
        const {
            q,
            isAudioOnly = null,
        } = body;

        const searchStr = `%${ q.toLocaleLowerCase() }%`;

        const queryVideos = `SELECT id              AS "id",
                                    "youtubeId"     AS "youtubeId",
                                    name            AS "name",
                                    path            AS "path",
                                    "isAudioOnly"   AS "isAudioOnly",
                                    "thumbnailPath" AS "thumbnailPath",
                                    duration        AS "duration"
                             FROM videos
                             WHERE LOWER("name") LIKE $1
                               AND ($2::boolean IS NULL OR "isAudioOnly" = $2)
                             ORDER BY LOWER("name") LIKE $1 DESC, id DESC
                             LIMIT 10`;
        const resVideos = await db.query(queryVideos, [ searchStr, isAudioOnly ]);

        const videos = resVideos.rows;

        data = {
            message:    {
                videos: videos,
            },
            statusCode: 200,
        };
    }
    catch (e) {
        console.error(`${ funcName }: ERROR`);
        console.error(e.message);
        console.error(e.stack);
    }

    return data;
}

/**
 * Получение информации о медиа
 * @param { Object } body
 * @param { number } body.id
 * @returns { Promise<{ message: string | { video: { youtubeId: string, name: string | null, path: string | null, isAudioOnly: boolean, thumbnailPath: string | null, duration: number }}, statusCode: number }>}
 * */
export async function getVideo(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = getVideo.name;

    try {
        const { id } = body;

        const queryVideo = `SELECT "youtubeId"     AS "youtubeId",
                                   name            AS "name",
                                   path            AS "path",
                                   "isAudioOnly"   AS "isAudioOnly",
                                   "thumbnailPath" AS "thumbnailPath",
                                   duration        AS "duration"
                            FROM videos
                            WHERE id = $1`;
        const resVideo = await db.query(queryVideo, [ id ]);

        if (resVideo.rows.length > 0) {
            data = {
                message:    {
                    video: resVideo.rows[0],
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
