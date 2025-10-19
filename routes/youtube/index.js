import * as youtube from '../../handlers/youtube/handler.js';

export default async function(fastify, opts) {
    fastify.post(
        '/add',
        {
            schema: {
                body:     {
                    type:       'object',
                    properties: {
                        youtubeUrl:  { type: 'string' },
                        isAudioOnly: { type: 'boolean' },
                        redownload:  { type: 'boolean' },
                    },
                    required:   [
                        'youtubeUrl',
                    ],
                },
                response: {
                    200: {
                        type:       'object',
                        properties: {
                            message: {
                                type:       'object',
                                properties: {
                                    id:   { type: 'number' },
                                    path: {
                                        type:     'string',
                                        nullable: true,
                                    },
                                },
                            },
                            statusCode: { type: 'integer' },
                        },
                    },
                    400: {
                        type:       'object',
                        properties: {
                            message:    { type: 'string' },
                            statusCode: { type: 'integer' },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const { statusCode, ...data } = await youtube.addYoutubeVideo(request.body);
            if (statusCode !== 200) {
                reply.status(400);
            }
            return reply.send(data);
        },
    );
}
