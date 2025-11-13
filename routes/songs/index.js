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
                        artist:     {
                            type:      'string',
                            minLength: 1,
                        },
                        name:       {
                            type:      'string',
                            minLength: 1,
                        },
                        note:       {
                            type:     'string',
                            nullable: true,
                        },
                        difficulty: {
                            type:       'number',
                            minimum:    100,
                            multipleOf: 100,
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

    fastify.put(
        '/edit',
        {
            schema: {
                body:     {
                    type:       'object',
                    properties: {
                        id:         {
                            type: 'number',
                        },
                        artist:     {
                            type:      'string',
                            minLength: 1,
                        },
                        name:       {
                            type:      'string',
                            minLength: 1,
                        },
                        note:       {
                            type:     'string',
                            nullable: true,
                        },
                        difficulty: {
                            type:       'number',
                            minimum:    100,
                            multipleOf: 100,
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

    fastify.get(
        '/get',
        {
            schema: {
                query:    {
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
                                            note:         {
                                                type:     'string',
                                                nullable: true,
                                            },
                                            difficulty:   {
                                                type: 'number',
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
            const { statusCode, ...data } = await songs.getSong(request.query);
            if (statusCode !== 200) {
                reply.status(statusCode);
            }
            return reply.send(data);
        },
    );

    fastify.post(
        '/list',
        {
            schema: {
                body:     {
                    type:       'object',
                    properties: {
                        pagination:           {
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
                        note:                 {
                            type:     'string',
                            nullable: true,
                        },
                        difficulty:           {
                            type:     'number',
                            nullable: true,
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
                        'pagination',
                        'id',
                        'artist',
                        'name',
                        'note',
                        'difficulty',
                        'hasOriginal',
                        'hasOriginalTimes',
                        'hasOriginalLyrics',
                        'hasInstrumental',
                        'hasInstrumentalTimes',
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
                                                note:                 {
                                                    type:     'string',
                                                    nullable: true,
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
