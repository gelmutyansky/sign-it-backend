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
            const { statusCode, ...data } = await youtube.addYoutubeVideo(request.body);
            if (statusCode !== 200) {
                reply.status(400);
            }
            return reply.send(data);
        },
    );

    fastify.get(
        '/search',
        {
            schema: {
                query:    {
                    type:       'object',
                    properties: {
                        q:           {
                            type:      'string',
                            minLength: 3,
                        },
                        isAudioOnly: { type: 'boolean' },
                    },
                    required:   [
                        'q',
                    ],
                },
                response: {
                    200: {
                        type:       'object',
                        properties: {
                            message: {
                                type:       'object',
                                properties: {
                                    videos: {
                                        type:  'array',
                                        items: {
                                            type:       'object',
                                            properties: {
                                                id:            { type: 'string' },
                                                youtubeId:     { type: 'string' },
                                                name:          {
                                                    type:     'string',
                                                    nullable: true,
                                                },
                                                path:          {
                                                    type:     'string',
                                                    nullable: true,
                                                },
                                                isAudioOnly:   { type: 'boolean' },
                                                thumbnailPath: {
                                                    type:     'string',
                                                    nullable: true,
                                                },
                                                duration:      { type: 'number' },
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
            const { statusCode, ...data } = await youtube.searchYoutubeVideo(request.query);
            if (statusCode !== 200) {
                reply.status(400);
            }
            return reply.send(data);
        },
    );
}
