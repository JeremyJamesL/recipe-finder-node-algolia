require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const router = express.Router();

// Algolia
const algoliasearch = require('algoliasearch');
const client = algoliasearch('YSWWVAX5RB', process.env.ALGOLIA_SECRET_KEY);
const index = client.initIndex('personalRecipes');

// Middleware
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json());

// Routers
app.post('/search', (req, res) => {
    index.search(req.body.query, {
        facets: req.body.facets.map(el => {return el}),
        filters: req.body.filters
    }).then((data) => {
        res.send({
            hits: data.hits,
            facets: data.facets
        });
    })
})

app.post('/recipes', (req, res) => {
    console.log('adding recipe', req.body.newRecipeObject);
    index.saveObject(req.body.newRecipeObject)
    .then(({objectID}) => {
        res.status(200).json({
            status: 'success',
            message: `successfully indexed ${objectID}`,
            recipeName: req.body.newRecipeObject.title
        })
      })
    .catch(error => {
        console.log(error);
        res.status(404).json({
            status: 'error',
            message: error
        })
    })
})

// Server
app.listen(3000, () => {
    console.log('listening on port 3000')
})

