import fs from 'fs';
import { pipeline } from 'node:stream/promises';
import axios from 'axios';

/**
 * Скачивание по ссылке в указанный путь
 * @param { string } url - ссылка для скачивания
 * @param { string } path - куда сохранить файл
 * @returns { Promise<void> }
 * */
export async function download(url, path) {
    const response = await axios({
        method:       'GET',
        url:          url,
        responseType: 'stream',
    });

    return await pipeline(
        response.data,
        fs.createWriteStream(path),
    );
}

/**
 * Обработка ошибки
 * @param { Error } e
 * @param { string } funcName
 * @returns { { message: string, statusCode: number } }
 * */
export function errorHandler(e, funcName) {
    console.error(`${ funcName }: ERROR`);
    console.error(e.message);
    console.error(e.stack);

    return {
        message:    'ERROR',
        statusCode: 500,
    };
}

