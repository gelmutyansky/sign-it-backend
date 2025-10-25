/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.addColumn('song_originals', {
        lyricsBeforeSingPath: {
            type:    'string',
            comment: 'Путь до VTT файла с субтитрами строчек песни до окончания пения',
        },
        lyricsAfterSingPath:  {
            type:    'string',
            comment: 'Путь до VTT файла с субтитрами строчек песни после окончания пения',
        },
    }, {
        ifNotExists: true,
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropColumn('song_originals', {
        lyricsBeforeSingPath: {},
        lyricsAfterSingPath:  {},
    }, {
        ifExists: true,
    });
};
