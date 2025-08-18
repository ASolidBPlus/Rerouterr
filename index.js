const express = require('express');
const axios = require('axios');
const { loadConfig } = require('./configBuilder');
const logger = require('./logger');

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
        logger.info("Test notification received, no action required.");
        return;
    }

    const media_type = request_data.media.media_type;

    // If media_type is 'music', approve the request directly
    if (media_type === 'music') {
        logger.info("Media type is 'music', approving request automatically.");
        try {
            await applyConfiguration(request_data.request.request_id, null, true);  // Auto-approve
            return;
        } catch (error) {
            logger.error(`Error auto-approving 'music' request ID ${request_data.request.request_id}: ${error}`);
            throw error;
        }
    }

    // Proceed for other media types (e.g., movie, tv)
    const media_tmdbid = request_data.media.tmdbId;
    const get_url = `/api/v1/${media_type}/${media_tmdbid}?language=en`;

    try {
        const response = await axiosInstance.get(get_url);
        const response_data = response.data;

        // Update the media object with fetched details
        request_data.media.genres = response_data.genres || [];
        request_data.media.keywords = response_data.keywords || [];
        request_data.media.original_language = response_data.originalLanguage || '';
        
        // Handle different rating structures for movies vs TV shows
        if (media_type === 'movie') {
            request_data.media.content_ratings = extractMovieRatings(response_data.releases?.results || []);
        } else {
            request_data.media.content_ratings = response_data.contentRatings?.results || [];
        }

        logger.info(`Processing Request...\nMedia Type: ${media_type}\nRequest ID: ${request_data.request.request_id}\nName: ${response_data.name}`);

        const [putData, rule, approve] = determinePutData(request_data);

        if (putData) {
            logger.info(`Rule matched: ${JSON.stringify(rule)}`);
            await applyConfiguration(request_data.request.request_id, putData, approve);
        } else {
            logger.info("No applicable rule found.");
        }
    } catch (error) {
        logger.error(`Error fetching media details or processing request: ${error}`);
        throw error;  // Rethrow to handle in the middleware
    }
}

// Determine applicable rule based on the request data
function determinePutData(request_data) {
    const { media } = request_data;

    for (const rule of config.rules) {
        // First, match against original_language
        if (media.media_type === rule.media_type) {
            if (rule.match?.original_language && media.original_language !== rule.match.original_language) {
                logger.info(`Original language mismatch: expected ${rule.match.original_language}, got ${media.original_language}`);
                continue; // Skip this rule if the original language does not match
            }

            // Now check other match criteria
            if (matchRule(media, rule.match || {})) {
                const putData = {
                    mediaType: media.media_type,
                    rootFolder: rule.apply.root_folder,
                    serverId: rule.apply.server_id,
                };

                if (rule.apply['quality_profile_id']) {
                    putData['profileId'] = rule.apply['quality_profile_id'];
                }

                // Handle TV specific logic
                if (media.media_type === 'tv') {
                    const seasons = request_data.extra?.find(item => item.name === 'Requested Seasons')?.value.split(",").map(item => parseInt(item)) || [];
                    if (seasons.length > 0) {
                        putData['seasons'] = seasons;
                    }
                }

                return [putData, rule, rule.apply.approve];
            }
        }
    }
    return [null, null, false];
}

// Determines if a rule matches
function matchRule(media, match) {
    const genresMatch = match.genres ? match.genres.some(genre => media.genres.some(g => g.name === genre)) : true;
    const excludeMatch = match.exclude_keywords ? !match.exclude_keywords.some(keyword => media.keywords.some(k => k.name.includes(keyword))) : true;
    const includeMatch = match.include_keywords ? match.include_keywords.some(keyword => media.keywords.some(k => k.name.includes(keyword))) : true;
    
    // New: Match based on content ratings
    const ratingMatch = matchRatings(media.content_ratings, match.content_ratings || []);

    return genresMatch && excludeMatch && includeMatch && ratingMatch;
}

// Apply configuration and optionally approve the request
async function applyConfiguration(request_id, putData, approve) {
    try {
        if (putData) {
            await axiosInstance.put(`/api/v1/request/${request_id}`, putData);
            logger.info(`Configuration applied for request ID ${request_id}`);
        }

        if (approve) {
            await axiosInstance.post(`/api/v1/request/${request_id}/approve`);
            logger.info(`Request ${request_id} approved.`);
        }
    } catch (error) {
        logger.error(`Error processing request ID ${request_id}: ${error}`);
        throw error;
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err);
    res.status(500).send('Internal Server Error');
});

// Server setup
const port = process.env.PORT || 7777;
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});

function matchRatings(content_ratings, rule_ratings) {
    if (rule_ratings.length === 0) return true;  // If no rating rule, automatically match

    return rule_ratings.some(rule => 
        content_ratings.some(rating => 
            // If iso_3166_1 is specified in rule, check it, otherwise just check rating
            (rule.iso_3166_1 ? rating.iso_3166_1 === rule.iso_3166_1 : true) && 
            rating.rating === rule.rating
        )
    );
}

// New helper function to extract movie ratings
function extractMovieRatings(releases) {
    return releases.map(release => ({
        iso_3166_1: release.iso_3166_1,
        rating: release.release_dates[0]?.certification || ''
    })).filter(rating => rating.rating !== '');
}
