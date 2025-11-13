/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.addColumn('songs', {
        spotifyURI: {
            type:    'string',
            comment: 'Ссылка на трек в Spotify',
        },
        createDate: {
            type:    'timestamp with time zone',
            default: pgm.func('NOW()'),
            comment: 'Дата добавления записи',
        },
        updateDate: {
            type:    'timestamp with time zone',
            default: pgm.func('NOW()'),
            comment: 'Дата обновления записи',
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
    pgm.dropColumn('songs', {
        spotifyURI: {},
        createDate: {},
        updateDate: {},
    }, {
        ifExists: true,
    });
};
