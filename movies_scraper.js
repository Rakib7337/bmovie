const axios = require('axios');
const cheerio = require('cheerio');

const urlList = {};
const API_KEY = '4791447b1323078387d36a00567c5d1b0652125b';

async function searchMovies(query) {
    const moviesList = [];
    try {
        const response = await axios.get(`https://mkvcinemas.cat/?s=${query.replace(' ', '+')}`);
        const $ = cheerio.load(response.data);
        
        $('a.ml-mask.jt').each((index, element) => {
            const movieDetails = {
                id: `link${index}`,
                title: $(element).find('span.mli-info').text()
            };
            urlList[movieDetails.id] = $(element).attr('href');
            moviesList.push(movieDetails);
        });
        
        return moviesList;
    } catch (error) {
        console.error('Error searching movies:', error);
        return [];
    }
}

async function getMovie(query) {
    try {
        const moviePageLink = await axios.get(urlList[query]);
        const $ = cheerio.load(moviePageLink.data);
        
        const movieDetails = {
            title: $('.mvic-desc h3').text(),
            img: $('.mvic-thumb').attr('data-bg'),
            links: {}
        };
        
        const linkPromises = $('a[rel="noopener"][data-wpel-link="internal"]').map(async (index, element) => {
            const originalUrl = $(element).attr('href');
            const shrinkUrl = `https://shrinkearn.com/api?api=${API_KEY}&url=${originalUrl}`;
            
            const shrinkResponse = await axios.get(shrinkUrl);
            movieDetails.links[$(element).text()] = shrinkResponse.data.shortenedUrl;
        }).get();
        
        await Promise.all(linkPromises);
        
        return movieDetails;
    } catch (error) {
        console.error('Error getting movie details:', error);
        return {};
    }
}

module.exports = { searchMovies, getMovie };