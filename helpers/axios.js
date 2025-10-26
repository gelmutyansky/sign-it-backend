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
