/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createTable('song_originals', {
        id:         {
            type: 'id',
        },
        songId:     {
            type:       'int',
            references: 'songs',
            notNull:    true,
            unique:     true,
        },
        videoId:    {
            type:       'int',
            references: 'videos',
            notNull:    true,
        },
        startTime:  {
            type:    'int',
            comment: 'Начало песни',
        },
        switchTime: {
            type:    'int',
            comment: 'Переход на инструментальную версию',
        },
        singTime:   {
            type:    'int',
            comment: 'Отрезок, с которого надо начать петь',
        },
        endTime:    {
            type:    'int',
            comment: 'Окончание песни',
        },
        lyrics:     {
            type:    'json',
            comment: 'Массив строчек из песни',
        },
    }, {
        ifNotExists: true,
        comment:     'Таблица связи песни с оригиналом и настройки по нему',
    });

    pgm.sql(
        `INSERT INTO song_originals ("songId", "videoId", "startTime", "switchTime", "singTime", "endTime", "lyrics")
         SELECT id,
                "originalId",
                "originalStartTime",
                "originalSwitchTime",
                "originalSingTime",
                "originalEndTime",
                "lyrics"
         FROM songs
         WHERE "originalId" IS NOT NULL`,
    );

    pgm.dropColumn('songs', {
        originalId:         {},
        originalStartTime:  {},
        originalSwitchTime: {},
        originalSingTime:   {},
        originalEndTime:    {},
        lyrics:             {},
    }, {
        ifExists: true,
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.addColumn('songs', {
        originalId:         {
            type:       'int',
            references: 'videos',
            comment:    'Оригинал песни',
        },
        originalStartTime:  {
            type:    'int',
            comment: 'Начало песни',
        },
        originalSwitchTime: {
            type:    'int',
            comment: 'Переход на инструментальную версию',
        },
        originalSingTime:   {
            type:    'int',
            comment: 'Отрезок, с которого надо начать петь',
        },
        originalEndTime:    {
            type:    'int',
            comment: 'Окончание песни',
        },
        lyrics:             {
            type:    'json',
            comment: 'Массив строчек из песни',
        },
    }, {
        ifNotExists: true,
    });

    pgm.sql(`UPDATE songs
             SET "originalId"         = so."videoId",
                 "originalStartTime"  = so."startTime",
                 "originalSwitchTime" = so."switchTime",
                 "originalSingTime"   = so."singTime",
                 "originalEndTime"    = so."endTime",
                 "lyrics"             = so."lyrics"
             FROM (SELECT "songId",
                          "videoId",
                          "startTime",
                          "switchTime",
                          "singTime",
                          "endTime",
                          "lyrics"
                   FROM song_originals) so
             WHERE songs.id = so."songId"`);

    pgm.dropTable('song_originals', {
        ifExists: true,
    });
};
