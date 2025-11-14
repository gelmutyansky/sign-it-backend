import * as songOriginals from '../../../../handlers/songs/_id/originals/handler.js';

export default async function(fastify, opts) {
    fastify.post(
        '/attach',
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
                body:     {
                    type:       'object',
                    properties: {
                        videoId: { type: 'number' },
                    },
                    required:   [
                        'videoId',
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
            const { statusCode, ...data } = await songOriginals.attachOriginal(request.params, request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );

    fastify.post(
        '/detach',
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
            const { statusCode, ...data } = await songOriginals.detachOriginal(request.params);
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
                params:   {
                    type:       'object',
                    properties: {
                        id: { type: 'number' },
                    },
                    required:   [
                        'id',
                    ],
                },
                body:     {
                    type:       'object',
                    properties: {
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
            const { statusCode, ...data } = await songOriginals.setTimes(request.params, request.body);
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
                params:   {
                    type:       'object',
                    properties: {
                        id: { type: 'number' },
                    },
                    required:   [
                        'id',
                    ],
                },
                body:     {
                    type:       'object',
                    properties: {
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
            const { statusCode, ...data } = await songOriginals.setLyrics(request.params, request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );
}
