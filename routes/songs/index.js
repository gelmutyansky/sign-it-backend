import * as songs from '../../handlers/songs/handler.js';

export default async function(fastify, opts) {
    fastify.post(
        '/add',
        {
            schema: {
                body:     {
                    type:       'object',
                    properties: {
                        artist: { type: 'string', minLength: 1 },
                        name:   { type: 'string', minLength: 1 },
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
}
