import fp from 'fastify-plugin';
import stream from 'stream';
import csv from 'csv-parser';

export default fp(async function(fastify) {
    fastify.addContentTypeParser('text/csv', function(req, body, done) {
        const data = [];
        stream.Readable.from(body).pipe(csv({
            mapHeaders: ({ header }) => {
                return header
                    .split(' ')
                    .map((word, index) => {
                        word = word
                            .trim()
                            .replaceAll(/\(.+?\)/g, ''); // убирает скобки и то, что было внутри них

                        let firstLetter = word.charAt(0);
                        firstLetter = index > 0
                            ? firstLetter.toUpperCase()  // Второе и далее слова с большой буквы.
                            : firstLetter.toLowerCase(); // Первое слово с маленькой буквы

                        return firstLetter + word.slice(1);
                    })
                    .join('');
            },
        }))
            .on('data', (row) => data.push(row))
            .on('end', () => done(null, data))
            .on('error', (err) => done(err));
    });
});
