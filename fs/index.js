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

/**
 * Удаление файлов и логгирование результата удаления
 * @param { string } filePath - путь до файла для удаления
 * @param { string } funcName - название функции, где вызвано удаление файла
 * @returns { void }
 * */
export function removeFile(filePath, funcName) {
    return fse.remove(filePath, (err) => {
        if (err) {
            console.error(`${ funcName }: файл не удалён (filePath: ${ filePath })`);
        }
        else {
            console.log(`${ funcName }: файл удалён (filePath: ${ filePath })`);
        }
    });
}

/**
 * Запись файла
 * @param { string } filePath - путь для записи
 * @param { string | NodeJS.ArrayBufferView } fileContent
 * @returns { Promise<void> }
 * */
export async function outputFile(filePath, fileContent) {
    return fse.outputFile(filePath, fileContent);
}

