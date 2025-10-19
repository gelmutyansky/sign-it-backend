import * as fse from 'fs-extra';
import getVideoId from 'get-video-id';
import { YtDlp } from 'ytdlp-nodejs';

import * as db from '../../db/index.js';

const ytdlp = new YtDlp();

function getYoutubeUrl(youtubeId) {
    return `https://www.youtube.com/watch?v=${ youtubeId }`;
}

/**
 * Добавление видео с Youtube
 * @param { Object } body
 * @param { string } body.youtubeUrl
 * @param { boolean } body.isAudioOnly
 * @param { boolean } body.redownload
 * @returns { Promise<{ message: string | { id: number, path: string | null }, statusCode: number }> }
 * */
export async function addYoutubeVideo(body) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = addYoutubeVideo.name;
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

        const queryExistingYoutube = `SELECT id   AS "id",
                                             path AS "path"
                                      FROM youtube
                                      WHERE "youtubeId" = $1
                                        AND "isAudioOnly" = $2
                                          FOR UPDATE`;
        const resExistingYoutube = await client.query(queryExistingYoutube, [ youtubeId, isAudioOnly ]);

        if (resExistingYoutube.rows.length > 0) {
            const { id, path } = resExistingYoutube.rows[0];
            if (redownload) {
                if (path) {
                    const queryUpdateYoutube = `UPDATE youtube
                                                SET path = NULL
                                                WHERE id = $1`;
                    const resUpdateYoutube = await client.query(queryUpdateYoutube, [ id ]);

                    if (resUpdateYoutube.rowCount > 0) {
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
                        path: null,
                    },
                    statusCode: 200,
                };
            }
            else {
                data = {
                    message:    {
                        id:   id,
                        path: path,
                    },
                    statusCode: 200,
                };
            }
        }
        else {
            const queryInsertYoutube = `INSERT INTO youtube ("youtubeId", "isAudioOnly")
                                        VALUES ($1, $2)
                                        RETURNING id, path`;
            const resInsertYoutube = await client.query(queryInsertYoutube, [ youtubeId, isAudioOnly ]);

            if (resInsertYoutube.rowCount > 0 && resInsertYoutube.rows.length > 0) {
                const { id, path } = resInsertYoutube.rows[0];

                data = {
                    message:    {
                        id:   id,
                        path: path,
                    },
                    statusCode: 200,
                };
            }
            else {
                console.error(`${ funcName } Не получилось добавить запись в таблицу ютуба (youtubeId: ${ youtubeId }, isAudioOnly: ${ isAudioOnly })`);
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

            if (!data.message.path) {
                downloadYoutubeVideo({ id: data.message.id }).then();
            }
        }

    }

    return data;
}

/**
 * Скачивание видео с Youtube
 * @param { number } id - ID в таблице youtube
 * */
async function downloadYoutubeVideo({ id }) {
    let data = {
        message:    'error',
        statusCode: 400,
    };

    const funcName = downloadYoutubeVideo.name;

    try {
        const queryYoutube = `SELECT "youtubeId", "isAudioOnly"
                              FROM youtube
                              WHERE id = $1`;
        const resYoutube = await db.query(queryYoutube, [ id ]);

        if (resYoutube.rows.length <= 0) {
            console.error(`${ funcName } Запись в таблице youtube не найдена (id: ${ id })`);
        }

        const { youtubeId, isAudioOnly } = resYoutube.rows[0];

        let filter = 'mergevideo';
        let type = 'mp4';

        if (isAudioOnly) {
            filter = 'audioonly';
            type = 'mp3';
        }

        const output = await ytdlp.downloadAsync(
            getYoutubeUrl(youtubeId),
            {
                onProgress: (progress) => {
                    console.log(progress);
                },
                format:     {
                    filter: filter,
                    type:   type,
                },
                output:     `./public/youtube/${ youtubeId }/${ filter }.%(ext)s`,
            },
        );

        console.log(output);

        data = {
            message:    {
                path: `./public/youtube/${ youtubeId }/${ filter }.${ type }`,
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
