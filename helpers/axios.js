import fs from 'fs';
import { pipeline } from 'node:stream/promises';
import axios from 'axios';

/**
 * Скачивание по запросу
 * @param { string } url - ссылка на изображение
 * @param { string } path - куда сохранить изображение
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
