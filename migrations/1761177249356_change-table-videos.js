/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.renameTable('youtube', 'videos');
    pgm.alterColumn('videos', 'youtubeId', {
        notNull: false,
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.alterColumn('videos', 'youtubeId', {
        notNull: true,
    });
    pgm.renameTable('videos', 'youtube');
};
