import { Client } from '@elastic/elasticsearch';

const index = 'posts';

const elastic = new Client({
    node: process.env.ELASTIC_HOST,
    auth: {
        username: process.env.ELASTIC_USER,
        password: process.env.ELASTIC_PASSWORD,
    },
});

const checkIndices = () => {
    console.log(process.env.ELASTIC_HOST);
    elastic.indices.exists({ index }, (err, res, status) => {
        if (res) {
            console.log('index already exists');
        } else {
            elastic.indices.create({ index }, (err, res, status) => {
                putMapping();
            });
        }
    });
};

const putMapping = async () => {
    console.log('Creating Mapping index');
    elastic.indices.putMapping(
        {
            index,
            type: '_doc',
            body: {
                properties: {
                    _id: {
                        type: 'interger',
                    },
                    fields: {
                        properties: {
                            id: {
                                type: 'interger',
                                index: true,
                            },
                            content: {
                                type: 'text',
                                index: true,
                            },
                            name: {
                                type: 'text',
                                index: true,
                            },
                            image: {
                                type: 'text',
                            },
                            url: {
                                type: 'text',
                            },
                            post_type: {
                                type: 'text',
                            },
                            keywords: {
                                type: 'nested',
                                index: true,
                            },
                        },
                    },
                },
            },
        },
        (err, resp, status) => {
            if (err) {
                console.error(err, status);
            } else {
                console.log('Successfully Created Index', status, resp);
            }
        }
    );
};

export default elastic;
export { elastic, checkIndices, index };
