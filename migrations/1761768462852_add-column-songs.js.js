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
        difficulty: {
            type:    'integer',
            default: 100,
            comment: 'Предположительная сложность песни',
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
        difficulty: {},
    }, {
        ifExists: true,
    });
};
