import * as songInstrumentals from '../../../handlers/songs/instrumentals/handler.js';

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
            const { statusCode, ...data } = await songInstrumentals.attachInstrumental(request.body);
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
                        switchTime: {
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
                        'switchTime',
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
            const { statusCode, ...data } = await songInstrumentals.setTimes(request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );
}
