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
