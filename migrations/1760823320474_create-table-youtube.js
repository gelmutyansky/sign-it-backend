/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createTable('youtube', {
        id:          {
            type:       'serial',
            primaryKey: true,
        },
        youtubeId:   {
            type:    'string',
            comment: 'ID видео в youtube',
            notNull: true,
        },
        name:        {
            type:    'string',
            comment: 'Название видео',
        },
        path:        {
            type:    'string',
            comment: 'Путь до файла',
        },
        isAudioOnly: {
            type:    'boolean',
            default: false,
            comment: 'Является ли файл аудио',
        },
    }, {
        ifNotExists: true,
        comment:     'Таблица youtube',
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('youtube', {
        ifExists: true,
    });
};
