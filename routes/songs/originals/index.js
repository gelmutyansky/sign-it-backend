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
}
