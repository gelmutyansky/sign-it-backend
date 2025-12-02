/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.addColumns('song_originals', {
        showVideoBeforeSinging: {
            type:    'boolean',
            default: true,
            comment: 'Показывать ли видео перед пением',
        },
        showVideoDuringSinging: {
            type:    'boolean',
            default: true,
            comment: 'Показывать ли видео во время пения',
        },
        showVideoAfterSinging:  {
            type:    'boolean',
            default: true,
            comment: 'Показывать ли видео после пения (в результатах)',
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
    pgm.dropColumns('song_originals', {
        showVideoBeforeSinging: {},
        showVideoDuringSinging: {},
        showVideoAfterSinging:  {},
    }, {
        ifExists: true,
    });
};
