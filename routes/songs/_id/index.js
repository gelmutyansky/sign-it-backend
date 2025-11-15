import * as song from '../../../handlers/songs/_id/handler.js';

export default async function(fastify, opts) {
    fastify.put(
        '/edit',
        {
            schema: {
                params:   {
                    type:       'object',
                    properties: {
                        id: {
                            type: 'number',
                        },
                    },
                    required:   [
                        'id',
                    ],
                },
                body:     {
                    type:       'object',
                    properties: {
                        artist:     {
                            type:      'string',
                            minLength: 1,
                        },
                        name:       {
                            type:      'string',
                            minLength: 1,
                        },
                        difficulty: {
                            type:       'number',
                            minimum:    100,
                            multipleOf: 100,
                            nullable:   true,
                        },
                    },
                    required:   [
                        'artist',
                        'name',
                        'difficulty',
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
            const { statusCode, ...data } = await song.editSong(request.params, request.body);
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
                params:   {
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
                                            difficulty:   {
                                                type:     'number',
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
            const { statusCode, ...data } = await song.getSong(request.params);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );
}
