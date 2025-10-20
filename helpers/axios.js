import fs from 'fs';
import { pipeline } from 'node:stream/promises';
import axios from 'axios';

/**
 * Скачивание изображения
 * @param { string } url - ссылка на изображение
 * @param { string } imagePath - куда сохранить изображение
 * */
export async function downloadImage(url, imagePath) {
    const response = await axios({
        method:       'GET',
        url:          url,
        responseType: 'stream',
    });

    return await pipeline(
        response.data,
        fs.createWriteStream(imagePath),
    );
}
