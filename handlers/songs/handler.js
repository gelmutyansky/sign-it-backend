import * as db from '../../db/index.js';

/**
 * Добавление песни
 * @param { Object } body
 * @param { string } body.artist
 * @param { string } body.name
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
        } = body;

        await client.query('BEGIN');
        hasTransaction = true;

        const queryInsertSong = `INSERT INTO songs (artist, name)
                                 VALUES ($1, $2)
                                 RETURNING id`;
        const resInsertSong = await client.query(queryInsertSong, [ artist, name ]);

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
            console.log(`${ funcName } Не добавлена песня (artist: ${ artist }, name: ${ name })`);
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
