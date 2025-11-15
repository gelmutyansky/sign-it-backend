import fse from 'fs-extra/esm';

/**
 * Получение папки для файлов
 * @param { string } publicFolder - родительская папка (обычно название ./public/<название таблицы>)
 * @param { number | string } id - id записи в таблице
 * @returns { Promise<string> }
 * */
async function getFolder(publicFolder, id) {
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
function removeFile(funcName, filePath) {
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
 * @param { Array<{ filePath: string, removeOnSuccess: boolean }>} filesToDelete
 * @param { Array<string | null> } filePaths
 * @param { boolean } removeOnSuccess
 * @returns { void }
 * */
function addToFilesToDelete(filesToDelete, filePaths, removeOnSuccess) {
    for (const filePath of filePaths) {
        if (filePath) {
            filesToDelete.push({
                filePath:        filePath,
                removeOnSuccess: removeOnSuccess,
            });
        }
    }
}

/**
 * Удаление файлов от статусного кода 200 или не 200
 * @param { string } funcName
 * @param { number } statusCode
 * @param { Array<{ filePath: string, removeOnSuccess: boolean }>} filesToDelete
 * @returns { void }
 * */
function removeFileOnSuccess(funcName, statusCode, filesToDelete) {
    if (filesToDelete.length > 0) {
        const isSuccess = statusCode === 200;

        for (const file of filesToDelete) {
            const { filePath, removeOnSuccess } = file;

            if (filePath && isSuccess === removeOnSuccess) {
                removeFile(funcName, filePath);
            }
        }
    }
}

/**
 * Запись файла
 * @param { string } filePath - путь для записи
 * @param { string | NodeJS.ArrayBufferView } fileContent
 * @returns { Promise<void> }
 * */
async function outputFile(filePath, fileContent) {
    return fse.outputFile(filePath, fileContent);
}

export {
    getFolder,
    addToFilesToDelete,
    removeFileOnSuccess,
    outputFile,
};
