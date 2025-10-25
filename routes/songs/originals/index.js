import * as songOriginals from '../../../handlers/songs/originals/handler.js';

export default async function(fastify, opts) {
    fastify.post(
        '/attach',
        {
            schema: {
                body:     {
                    type:       'object',
                    properties: {
                        songId:  { type: 'number' },
                        videoId: { type: 'number' },
                    },
                    required:   [
                        'songId',
                        'videoId',
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
            const { statusCode, ...data } = await songOriginals.attachOriginal(request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );

    fastify.post(
        '/times/set',
        {
            schema: {
                body:     {
                    type:       'object',
                    properties: {
                        id:         {
                            type: 'number',
                        },
                        startTime:  {
                            type:    'number',
                            minimum: 0,
                        },
                        switchTime: {
                            type:    'number',
                            minimum: 0,
                        },
                        singTime:   {
                            type:    'number',
                            minimum: 0,
                        },
                        endTime:    {
                            type:    'number',
                            minimum: 0,
                        },
                    },
                    required:   [
                        'id',
                        'startTime',
                        'switchTime',
                        'singTime',
                        'endTime',
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
            const { statusCode, ...data } = await songOriginals.setTimes(request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );

    fastify.post(
        '/lyrics/set',
        {
            schema: {
                body:     {
                    type:       'object',
                    properties: {
                        id:     {
                            type: 'number',
                        },
                        lyrics: {
                            type:     'array',
                            items:    {
                                type:       'object',
                                properties: {
                                    startTime: {
                                        type:    'number',
                                        minimum: 0,
                                    },
                                    endTime:   {
                                        type:    'number',
                                        minimum: 0,
                                    },
                                    mustSing:  {
                                        type: 'boolean',
                                    },
                                    verse:     {
                                        type:      'string',
                                        minLength: 1,
                                    },
                                },
                                required:   [
                                    'startTime',
                                    'endTime',
                                    'mustSing',
                                    'verse',
                                ],
                            },
                            minItems: 1,
                        },
                    },
                    required:   [
                        'id',
                        'lyrics',
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
            const { statusCode, ...data } = await songOriginals.setLyrics(request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );
}
