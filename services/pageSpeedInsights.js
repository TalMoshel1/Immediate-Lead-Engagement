const axios = require('axios');

require('dotenv').config();

async function getPageSpeedInsights(url) {
    try {
        const apiKey = process.env.PAGESPEED;
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}`;
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error('Error fetching PageSpeed Insights:', error.message);
        throw error;
    }
}

module.exports = {getPageSpeedInsights};

