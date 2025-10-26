import fse from 'fs-extra/esm';

export async function getFolder(publicFolder, id) {
    const folder = `${ publicFolder }/${ id }`;
    await fse.ensureDir(folder);
    return folder;
}
