import * as songs from '../../handlers/songs/handler.js';
import { sortableColumns } from '../../helpers/constants.js';

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
            const { statusCode, ...data } = await songs.addSong(request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );

    fastify.post(
        '/add/spotify',
        {
            schema: {
                body:     {
                    type:  'array',
                    items: {
                        type:       'object',
                        properties: {
                            trackURI:   { type: 'string' },
                            trackName:  { type: 'string' },
                            artistName: { type: 'string' },
                        },
                        required:   [
                            'trackURI',
                            'trackName',
                            'artistName',
                        ],
                    },
                },
                response: {
                    200: {
                        type:       'object',
                        properties: {
                            message: {
                                type:       'object',
                                properties: {
                                    counters: {
                                        type:       'object',
                                        properties: {
                                            inserted: { type: 'number' },
                                            updated:  { type: 'number' },
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
            const { statusCode, ...data } = await songs.addSongsFromSpotify(request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );

    fastify.post(
        '/get',
        {
            schema: {
                body:     {
                    type:       'object',
                    properties: {
                        pagination: {
                            type:       'object',
                            properties: {
                                sortBy:      {
                                    type: 'string',
                                    enum: sortableColumns.songs,
                                },
                                descending:  {
                                    type: 'boolean',
                                },
                                page:        {
                                    type:    'number',
                                    minimum: 1,
                                },
                                rowsPerPage: {
                                    type: 'number',
                                },
                                rowsNumber:  {
                                    type: 'number',
                                },
                            },
                            required:   [
                                'sortBy',
                                'descending',
                                'page',
                                'rowsPerPage',
                                'rowsNumber',
                            ],
                        },
                        filters:    {
                            type:       'object',
                            properties: {
                                id:                   {
                                    type:     'number',
                                    nullable: true,
                                },
                                artist:               {
                                    type:     'string',
                                    nullable: true,
                                },
                                name:                 {
                                    type:     'string',
                                    nullable: true,
                                },
                                difficulty:           {
                                    type:       'number',
                                    minimum:    100,
                                    multipleOf: 100,
                                    nullable:   true,
                                },
                                hasOriginal:          {
                                    type:     'boolean',
                                    nullable: true,
                                },
                                hasOriginalTimes:     {
                                    type:     'boolean',
                                    nullable: true,
                                },
                                hasOriginalLyrics:    {
                                    type:     'boolean',
                                    nullable: true,
                                },
                                hasInstrumental:      {
                                    type:     'boolean',
                                    nullable: true,
                                },
                                hasInstrumentalTimes: {
                                    type:     'boolean',
                                    nullable: true,
                                },
                            },
                            required:   [
                                'id',
                                'artist',
                                'name',
                                'difficulty',
                                'hasOriginal',
                                'hasOriginalTimes',
                                'hasOriginalLyrics',
                                'hasInstrumental',
                                'hasInstrumentalTimes',
                            ],
                        },
                    },
                    required:   [
                        'pagination',
                        'filters',
                    ],
                },
                response: {
                    200: {
                        type:       'object',
                        properties: {
                            message: {
                                type:       'object',
                                properties: {
                                    songs: {
                                        type:  'array',
                                        items: {
                                            type:       'object',
                                            properties: {
                                                id:                   {
                                                    type: 'number',
                                                },
                                                artist:               {
                                                    type: 'string',
                                                },
                                                name:                 {
                                                    type: 'string',
                                                },
                                                difficulty:           {
                                                    type:     'number',
                                                    nullable: true,
                                                },
                                                hasOriginal:          {
                                                    type: 'boolean',
                                                },
                                                hasOriginalTimes:     {
                                                    type: 'boolean',
                                                },
                                                hasOriginalLyrics:    {
                                                    type: 'boolean',
                                                },
                                                hasInstrumental:      {
                                                    type: 'boolean',
                                                },
                                                hasInstrumentalTimes: {
                                                    type: 'boolean',
                                                },
                                                rowsNumber:           {
                                                    type: 'number',
                                                },
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
            const { statusCode, ...data } = await songs.getSongs(request.body);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );
}
