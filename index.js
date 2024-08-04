const express = require('express');
const axios = require('axios');
const { loadConfig } = require('./configBuilder');

const app = express();
app.use(express.json());

const configFilePath = process.argv[2];
const config = loadConfig(configFilePath);

app.post('/webhook', async (req, res) => {
    const request_data = req.body;
    console.log("Received request data:", JSON.stringify(request_data, null, 2));
    try {
        await processRequest(request_data);
        res.status(202).send('success');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function processRequest(request_data) {
    const notification_type = request_data.notification_type;

    if (notification_type === 'TEST_NOTIFICATION') {
        console.log("Received test notification.");
        return;
    }

    const request_username = request_data.request.requestedBy_username;
    const request_id = request_data.request.request_id;
    const media_tmdbid = request_data.media.tmdbId;
    const media_type = request_data.media.media_type;

    console.log(`Overseerr webhook received for a new ${media_type} request by ${request_username}`);

    let seasons = null;
    if (request_data.extra) {
        for (const item of request_data.extra) {
            if (item.name === 'Requested Seasons') {
                seasons = item.value;
                break;
            }
        }
    }

    const get_url = `${config.overseerr_baseurl}/api/v1/${media_type}/${media_tmdbid}?language=en`;
    const headers = {
        'accept': 'application/json',
        'X-Api-Key': config.overseerr_api_key
    };

    try {
        const response = await axios.get(get_url, { headers });
        const response_data = response.data;
        console.log(`Fetched data for requestID ${request_id} to determine how to process the request`);

        let put_data = null;
        let TargetArrServer = null;
        let approve = false;

        if (media_type === 'movie' || media_type === 'tv') {
            [put_data, TargetArrServer, approve] = determinePutData(media_type, response_data, seasons);
        }

        if (put_data) {
            await applyOverseerrRequestModification(request_id, put_data);
            console.log(`Successfully applied rule: ${JSON.stringify(put_data)}`);

            if (approve) {
                await approveRequest(request_id, TargetArrServer);
                console.log(`Successfully approved request ${request_id} and set server to ${TargetArrServer}`);
            } else {
                console.log(`Request ${request_id} was modified but not approved.`);
            }
        } else {
            console.log("No matching configuration found for the request, keeping current settings.");
        }
    } catch (error) {
        console.error(`Error fetching data for requestID ${request_id}:`, error);
    }
}

function determinePutData(media_type, response_data, seasons) {
    for (const rule of config.rules) {
        console.log(`Checking rule: ${JSON.stringify(rule)}`);

        if (rule.media_type === media_type) {
            const genresMatch = !rule.genres || rule.genres.some(genre => response_data.genres && response_data.genres.some(g => g.name === genre));
            const excludeKeywordsMatch = rule.exclude_keywords && rule.exclude_keywords.some(keyword => response_data.keywords && response_data.keywords.some(k => k.name.includes(keyword)));
            const includeKeywordsMatch = rule.include_keywords && rule.include_keywords.some(keyword => response_data.keywords && response_data.keywords.some(k => k.name.includes(keyword)));

            if (genresMatch && !excludeKeywordsMatch && (!rule.include_keywords || includeKeywordsMatch)) {
                console.log(`Match found with rule: ${JSON.stringify(rule)}`);
                const put_data = {
                    "mediaType": media_type,
                    "rootFolder": rule.root_folder,
                    "serverId": rule.server_id
                };
                console.log(rule)
                if (rule.hasOwnProperty('quality_profile_id')) {

                    put_data.profileId = rule.quality_profile_id;
                }
                if (media_type === 'tv' && seasons) {
                    put_data.seasons = seasons.split(',').map(season => parseInt(season));
                }

                console.log(put_data)
                return [put_data, rule.server_name, rule.approve];
            }
        }
    }
    return [null, null, false];
}




async function applyOverseerrRequestModification(request_id, put_data) {
    const put_url = `${config.overseerr_baseurl}/api/v1/request/${request_id}`;
    const headers = {
        'accept': 'application/json',
        'X-Api-Key': config.overseerr_api_key,
        'Content-Type': 'application/json'
    };
    const response = await axios.put(put_url, put_data, { headers });
    if (response.status !== 200) {
        throw new Error(`Error applying backend server overwrite in Overseerr: ${response.statusText}`);
    } else {
        console.log(`Successfully modified target backend server to ${put_data.serverId} with profile ID ${put_data.profileId} in Overseerr`);
    }
}


async function approveRequest(request_id) {
    const post_url = `${config.overseerr_baseurl}/api/v1/request/${request_id}/approve`;
    const headers = {
        'accept': 'application/json',
        'X-Api-Key': config.overseerr_api_key,
        'Content-Type': 'application/json'
    };
    const response = await axios.post(post_url, {}, { headers });
    if (response.status !== 200) {
        throw new Error(`Error updating request status: ${response.data}`);
    } else {
        console.log(`Successfully approved request ${request_id}.`);
    }
}

const port = process.env.PORT || 7777;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
