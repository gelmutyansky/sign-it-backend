import * as songs from '../../handlers/songs/handler.js';

export default async function(fastify, opts) {
    fastify.post(
        '/add',
        {
            schema: {
                body:     {
                    type:       'object',
                    properties: {
                        artist: {
                            type:      'string',
                            minLength: 1,
                        },
                        name:   {
                            type:      'string',
                            minLength: 1,
                        },
                        note:   {
                            type:     'string',
                            nullable: true,
                        },
                    },
                    required:   [
                        'artist',
                        'name',
                    ],
                },
                response: {
                    200: {
                        type:       'object',
                        properties: {
                            message: {
                                type:       'object',
                                properties: {
                                    id: { type: 'number' },
                                },
                            },
                        },
                    },
                    400: {
                        type:       'object',
                        properties: {
                            message: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const { statusCode, ...data } = await songs.addSong(request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );

    fastify.put(
        '/edit',
        {
            schema: {
                body:     {
                    type:       'object',
                    properties: {
                        id:     {
                            type: 'number',
                        },
                        artist: {
                            type:      'string',
                            minLength: 1,
                        },
                        name:   {
                            type:      'string',
                            minLength: 1,
                        },
                        note:   {
                            type:     'string',
                            nullable: true,
                        },
                    },
                    required:   [
                        'id',
                        'artist',
                        'name',
                    ],
                },
                response: {
                    200: {
                        type:       'object',
                        properties: {
                            message: { type: 'string' },
                        },
                    },
                    400: {
                        type:       'object',
                        properties: {
                            message: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const { statusCode, ...data } = await songs.editSong(request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );

    fastify.get(
        '/get',
        {
            schema: {
                query:    {
                    type:       'object',
                    properties: {
                        id: { type: 'number' },
                    },
                    required:   [
                        'id',
                    ],
                },
                response: {
                    200: {
                        type:       'object',
                        properties: {
                            message: {
                                type:       'object',
                                properties: {
                                    song: {
                                        type:       'object',
                                        properties: {
                                            artist:       {
                                                type: 'string',
                                            },
                                            name:         {
                                                type: 'string',
                                            },
                                            note:         {
                                                type:     'string',
                                                nullable: true,
                                            },
                                            original:     {
                                                type:       'object',
                                                properties: {
                                                    startTime:            {
                                                        type:     'integer',
                                                        nullable: true,
                                                    },
                                                    switchTime:           {
                                                        type:     'integer',
                                                        nullable: true,
                                                    },
                                                    singTime:             {
                                                        type:     'integer',
                                                        nullable: true,
                                                    },
                                                    endTime:              {
                                                        type:     'integer',
                                                        nullable: true,
                                                    },
                                                    lyrics:               {
                                                        type:     'array',
                                                        items:    {
                                                            type:       'object',
                                                            properties: {
                                                                startTime: {
                                                                    type: 'number',
                                                                },
                                                                endTime:   {
                                                                    type: 'number',
                                                                },
                                                                mustSing:  {
                                                                    type: 'boolean',
                                                                },
                                                                verse:     {
                                                                    type: 'string',
                                                                },
                                                            },
                                                        },
                                                        nullable: true,
                                                    },
                                                    lyricsBeforeSingPath: {
                                                        type:     'string',
                                                        nullable: true,
                                                    },
                                                    lyricsAfterSingPath:  {
                                                        type:     'string',
                                                        nullable: true,
                                                    },
                                                    videoId:              {
                                                        type: 'integer',
                                                    },
                                                    youtubeId:            {
                                                        type:     'string',
                                                        nullable: true,
                                                    },
                                                    path:                 {
                                                        type:     'string',
                                                        nullable: true,
                                                    },
                                                    isAudioOnly:          {
                                                        type: 'boolean',
                                                    },
                                                    thumbnailPath:        {
                                                        type:     'string',
                                                        nullable: true,
                                                    },
                                                    duration:             {
                                                        type:     'integer',
                                                        nullable: true,
                                                    },
                                                    thumbnailUrl:         {
                                                        type:     'string',
                                                        nullable: true,
                                                    },
                                                },
                                                nullable:   true,
                                            },
                                            instrumental: {
                                                type:       'object',
                                                properties: {
                                                    switchTime:    {
                                                        type:     'integer',
                                                        nullable: true,
                                                    },
                                                    endTime:       {
                                                        type:     'integer',
                                                        nullable: true,
                                                    },
                                                    videoId:       {
                                                        type: 'integer',
                                                    },
                                                    youtubeId:     {
                                                        type:     'string',
                                                        nullable: true,
                                                    },
                                                    path:          {
                                                        type:     'string',
                                                        nullable: true,
                                                    },
                                                    isAudioOnly:   {
                                                        type: 'boolean',
                                                    },
                                                    thumbnailPath: {
                                                        type:     'string',
                                                        nullable: true,
                                                    },
                                                    duration:      {
                                                        type:     'integer',
                                                        nullable: true,
                                                    },
                                                    thumbnailUrl:  {
                                                        type:     'string',
                                                        nullable: true,
                                                    },
                                                },
                                                nullable:   true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        type:       'object',
                        properties: {
                            message: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const { statusCode, ...data } = await songs.getSong(request.query);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );
}
