import * as songInstrumentals from '../../../../handlers/songs/_id/instrumentals/handler.js';

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
            const { statusCode, ...data } = await songInstrumentals.attachInstrumental(request.params, request.body);
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
            const { statusCode, ...data } = await songInstrumentals.detachInstrumental(request.params);
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
                        switchTime: {
                            type:    'number',
                            minimum: 0,
                        },
                        endTime:    {
                            type:    'number',
                            minimum: 0,
                        },
                        isUsed:     {
                            type: 'boolean',
                        },
                    },
                    required:   [
                        'switchTime',
                        'endTime',
                        'isUsed',
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
            const { statusCode, ...data } = await songInstrumentals.setTimes(request.params, request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );
}
