/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createTable('songs', {
        id:                     {
            type:       'serial',
            primaryKey: true,
        },
        artist:                 {
            type:    'string',
            comment: 'Исполнитель песни',
            notNull: true,
        },
        name:                   {
            type:    'string',
            comment: 'Название песни',
            notNull: true,
        },
        note:                   {
            type:    'string',
            comment: 'Примечание к песне',
        },
        originalId:             {
            type:       'int',
            references: 'youtube',
            comment:    'Оригинал песни',
        },
        originalStartTime:      {
            type:    'int',
            comment: 'Начало песни',
        },
        originalSwitchTime:     {
            type:    'int',
            comment: 'Переход на инструментальную версию',
        },
        originalSingTime:       {
            type:    'int',
            comment: 'Отрезок, с которого надо начать петь',
        },
        originalEndTime:        {
            type:    'int',
            comment: 'Окончание песни',
        },
        instrumentalId:         {
            type:       'int',
            references: 'youtube',
            comment:    'Инструментальная версия песни',
        },
        instrumentalOffsetTime: {
            type:    'int',
            comment: 'Разница между инструментальным и оригиналом во время перехода на инструментальную версию',
        },
        lyrics:                 {
            type:    'json',
            comment: 'Массив строчек из песни',
        },
    }, {
        ifNotExists: true,
        comment:     'Таблица песен',
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('songs', {
        ifExists: true,
    });
};
