export const up = (pgm) => {
    pgm.createTable('song_instrumentals', {
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
        switchTime: {
            type:    'int',
            comment: 'Переход на инструментальную версию',
        },
        endTime:    {
            type:    'int',
            comment: 'Окончание песни',
        },
    }, {
        ifNotExists: true,
        comment:     'Таблица связи песни с инструментальной версией и настройки по ней',
    });

    pgm.sql(
        `INSERT INTO song_instrumentals ("songId", "videoId")
         SELECT id,
                "instrumentalId"
         FROM songs
         WHERE "instrumentalId" IS NOT NULL`,
    );

    pgm.dropColumn('songs', {
        instrumentalId:         {},
        instrumentalOffsetTime: {},
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
        instrumentalId:         {
            type:       'int',
            references: 'videos',
            comment:    'Инструментальная версия песни',
        },
        instrumentalOffsetTime: {
            type:    'int',
            comment: 'Разница между инструментальным и оригиналом во время перехода на инструментальную версию',
        },
    }, {
        ifNotExists: true,
    });

    pgm.sql(`UPDATE songs
             SET "instrumentalId" = si."videoId"
             FROM (SELECT "songId",
                          "videoId"
                   FROM song_instrumentals) si
             WHERE songs.id = si."songId"`);

    pgm.dropTable('song_instrumentals', {
        ifExists: true,
    });
};
