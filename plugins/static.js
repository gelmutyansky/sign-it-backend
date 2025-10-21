import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
const __dirname = import.meta.dirname

export default fp(async (fastify) => {
    fastify.register(fastifyStatic, {
        root:   path.join(__dirname,  '../public'),
        prefix: '/public/',
    });
});
