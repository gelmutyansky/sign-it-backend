/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.dropColumn('songs', {
        note: {},
    }, {
        ifExists: true,
    });

    pgm.alterColumn('songs', 'difficulty', {
        default: null,
    });

    pgm.sql(`UPDATE songs
             SET difficulty = NULL
             WHERE difficulty = 100`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`UPDATE songs
             SET difficulty = 100
             WHERE difficulty IS NULL`);

    pgm.alterColumn('songs', 'difficulty', {
        default: 100,
    });

    pgm.addColumn('songs', {
        note: {
            type:    'string',
            comment: 'Примечание к песне',
        },
    }, {
        ifExists: true,
    });
};
