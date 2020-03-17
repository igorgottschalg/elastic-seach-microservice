import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import elastic, {checkIndices, index} from './elastic-search';

const app = express();
app.use(cors());
app.disable('x-powered-by');
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(bodyParser.json());
checkIndices();

const whitelist = process.env.DOMAINS.split(',');
const corsOptions = (req, callback) => {
    let corsOptions;
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = {origin: true}; // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = {origin: false}; // disable CORS for this request
    }
    callback(null, corsOptions); // callback expects two parameters: error and options
};

app.get('/search', cors(corsOptions), async (req, res) => {
    try {
        const {body} = await elastic.search({
            index,
            body: {
                query: {
                    multi_match: {
                        query: req.query.query ? req.query.query : '*',
                        fields: ['name', 'content', 'keywords'],
                    },
                },
            },
        });
        if (body) {
            res.status(200).send(
                body.hits.hits.map(item => ({
                    name: item._source.name,
                    image: item._source.image,
                    url: item._source.url,
                    post_type: item._source.post_type,
                }))
            );
        }
    } catch (e) {
        res.status(404).send(e);
    }
});

app.post('/add', async (req, res) => {
    const auth = {
        login: process.env.AUTH_USER,
        password: process.env.AUTH_PASSWORD,
    };
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64')
        .toString()
        .split(':');

    if (
        !login ||
        !password ||
        login !== auth.login ||
        password !== auth.password
    ) {
        res.set('WWW-Authenticate', 'Basic realm="401"'); // change this
        res.status(401).send('Authentication required.');
    }

    try {
        const object = {
            id: req.body.id,
            fields: {
                id: req.body.id,
                content: req.body.content,
                name: req.body.name,
                image: req.body.image,
                url: req.body.url,
                post_type: req.body.post_type,
                keywords: req.body.keywords,
            },
        };
        const {body} = await elastic.index({
            index,
            body: object,
        });
        res.status(200).send(body);
        console.log(object);
    } catch (e) {
        res.status(500).send("internal error");
        console.error(e);
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Listening on port: ${process.env.PORT}`);
});
