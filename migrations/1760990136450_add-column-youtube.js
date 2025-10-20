/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.addColumn(
        'youtube',
        {
            thumbnailPath: {
                type:    'string',
                comment: 'Путь до обложки видео',
            },
            duration:      {
                type:    'integer',
                comment: 'Длительность видео (сек)',
            },
        },
        {
            ifNotExists: true,
        });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropColumn(
        'youtube',
        {
            thumbnailPath: {},
            duration:      {},
        },
        {
            ifExists: true,
        });
};
