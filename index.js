const express = require('express');
const axios = require('axios');
const { loadConfig } = require('./configBuilder');

// Initialize the app and load configuration
const app = express();
app.use(express.json());
const configFilePath = process.argv[2];
const config = loadConfig(configFilePath);

// Create an Axios instance for API calls
const axiosInstance = axios.create({
    baseURL: config.overseerr_baseurl,
    headers: {
        'accept': 'application/json',
        'X-Api-Key': config.overseerr_api_key,
        'Content-Type': 'application/json'
    }
});

// Webhook endpoint
app.post('/webhook', async (req, res, next) => {
    try {
        await processRequest(req.body);
        res.status(202).send('Success');
    } catch (error) {
        next(error);
    }
});

// Main processing function
async function processRequest(request_data) {
    if (request_data.notification_type === 'TEST_NOTIFICATION') {
        console.log("Test notification received, no action required.");
        return;
    }

    // Fetch additional media details
    const media_type = request_data.media.media_type;
    const media_tmdbid = request_data.media.tmdbId;
    const get_url = `/api/v1/${media_type}/${media_tmdbid}?language=en`;
    
    try {
        const response = await axiosInstance.get(get_url);
        const response_data = response.data;

        // Update the media object with the fetched details
        request_data.media.genres = response_data.genres || [];
        request_data.media.keywords = response_data.keywords || [];

        console.log(`Processing request: Media type ${media_type}, ID ${request_data.request.request_id}`);
        const [putData, rule, approve] = determinePutData(request_data);
        
        if (putData) {
            console.log(`Rule matched: ${JSON.stringify(rule)}`);
            await applyConfiguration(request_data.request.request_id, putData, approve);
        } else {
            console.log("No applicable rule found.");
        }
    } catch (error) {
        console.error(`Error fetching media details or processing request: ${error}`);
        throw error;  // Rethrow to handle in the middleware
    }
}


// Determine applicable rule based on the request data
function determinePutData(request_data) {
    const { media, extra = [] } = request_data;
    
    for (const rule of config.rules) {
        if (media.media_type === rule.media_type && matchRule(media, rule.match || {})) {
            const putData = {
                mediaType: media.media_type,
                rootFolder: rule.apply.root_folder,
                serverId: rule.apply.server_id,
            }

            if (rule.apply['quality_profile_id']) {
                putData['profileId'] = rule.apply['quality_profile_id']
            }

            if (media.media_type === 'tv') {
                const seasons = extra.filter(item => item.name === 'Requested Seasons').map(item => parseInt(item.value));
                if (seasons.length) {
                    putData['seasons'] = seasons;
                }
            }

            return [putData, rule, rule.apply.approve];
        }
    }
    return [null, null, false];
}

// Determines if a rule matches
function matchRule(media, match) {
    const genresMatch = match.genres ? match.genres.some(genre => media.genres.some(g => g.name === genre)) : true;
    const excludeMatch = match.exclude_keywords ? !match.exclude_keywords.some(keyword => media.keywords.some(k => k.name.includes(keyword))) : true;
    const includeMatch = match.include_keywords ? match.include_keywords.some(keyword => media.keywords.some(k => k.name.includes(keyword))) : true;

    return genresMatch && excludeMatch && includeMatch;
}


// Apply configuration and optionally approve the request
async function applyConfiguration(request_id, putData, approve) {
    try {
        await axiosInstance.put(`/api/v1/request/${request_id}`, putData);
        console.log(`Configuration applied for request ID ${request_id}`);
        if (approve) {
            await axiosInstance.post(`/api/v1/request/${request_id}/approve`);
            console.log(`Request ${request_id} approved.`);
        }
    } catch (error) {
        console.error(`Error processing request ID ${request_id}: ${error}`);
        throw error;  // Rethrow to handle in the middleware
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

// Server setup
const port = process.env.PORT || 7777;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
