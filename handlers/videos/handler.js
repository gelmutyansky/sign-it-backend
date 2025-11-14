import * as db from '../../db/index.js';
import { errorHandler } from '../../helpers/functions.js';

/**
 * Поиск видео
 * @param { Object } body
 * @param { string } body.q
 * @param { boolean? } body.isAudioOnly
 * @returns { Promise<{ message: string | { videos: Array<{ id: string, youtubeId: string, name: string | null, path: string | null, isAudioOnly: boolean, thumbnailPath: string | null, duration: number }>}, statusCode: number }> }
 * */
async function searchVideo(body) {
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
        data = errorHandler(e, funcName);
    }

    return data;
}

/**
 * Получение информации о видео
 * @param { Object } body
 * @param { number } body.id
 * @returns { Promise<{ message: string | { video: { youtubeId: string, name: string | null, path: string | null, isAudioOnly: boolean, thumbnailPath: string | null, duration: number }}, statusCode: number }>}
 * */
async function getVideo(body) {
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
        data = errorHandler(e, funcName);
    }

    return data;
}

export {
    searchVideo,
    getVideo,
};
