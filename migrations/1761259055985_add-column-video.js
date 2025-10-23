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
        'videos',
        {
            thumbnailUrl: {
                type:    'string',
                comment: 'Путь до обложки видео (в интернете)',
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
        'videos',
        {
            thumbnailUrl: {},
        },
        {
            ifExists: true,
        });
};
