import fse from 'fs-extra/esm';

/**
 * Получение папки для файлов
 * @param { string } publicFolder - родительская папка (обычно название ./public/<название таблицы>)
 * @param { number | string } id - id записи в таблице
 * @returns { Promise<string> }
 * */
export async function getFolder(publicFolder, id) {
    const folder = `${ publicFolder }/${ id }`;
    await fse.ensureDir(folder);
    return folder;
}
