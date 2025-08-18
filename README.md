# Rerouterr

Rerouterr interfaces with the Overseerr API to handle media requests automatically based on predefined rules. It is designed to streamline the approval and management of TV and movie requests by applying specific configurations such as quality profiles, root folders, and more.

## Features

- **Automatic Request Handling**: Automates the switching of an incoming request to different servers, root download path, and quality profile.
- **Customizable Rules**: Allows defining rules based on media type, genres, keywords, and more.
- **Integration with Overseerr**: Communicates with Overseerr's API to fetch and update request details.

## Configuration File Structure

Configuration is managed through a `config.yaml` file, which contains crucial details such as the Overseerr base URL, API key, and rules for processing media requests. Below is a detailed breakdown of what this file includes:

- `overseerr_baseurl`: The base URL for your Overseerr installation. Required.
- `overseerr_api_key`: Your Overseerr API key, used for authentication with the Overseerr API. Required.

### Rules

The `rules` array holds definitions on how different types of media requests are processed. Each rule is structured to apply specific configurations based on certain conditions:

- `media_type`: Specifies the type of media (`tv` or `movie`) to which the rule applies. Required.

Each rule is divided into `match` and `apply` sections:

#### Match Section
- `genres`: List of genres that the rule applies to. Optional.
- `exclude_keywords`: Keywords to exclude. If a request contains any of these keywords, it will not match this rule. Optional.
- `include_keywords`: Keywords that must be included for a request to match this rule. Optional.
- `content_ratings`: List of ratings that the rule applies to. Optional.
- `original_language`: Original language the rule applies to. Optional.

#### Apply Section
- `root_folder`: The directory where the media should be stored if the rule is applied. Required.
- `server_id`: The ID of the server where the media is hosted. Refer to the drop-down selection on a request in Overseerr, starting from 0. This number corresponds to the server selection. Required.
   - NOTE: "Hidden" servers, such as a 4K server in a non-4K request, are included in the count. Adjust appropriately. 
- `quality_profile_id`: The ID of the quality profile to apply to the request. This ID also starts from 0 and corresponds to the selection in a quality profile drop-down in Overseerr. Optional (will default to default quality profile).
- `approve`: Whether to automatically approve this request (`true` or `false`). Required.

### Matching Rules

The application matches requests against these rules from top to bottom. The first rule that matches a request will be applied. It is important to order your rules wisely to ensure that the most specific rules are evaluated first.

### Example Configuration
```yml
overseerr_baseurl: "http://overseerr:5055"
overseerr_api_key: "api_key"
rules:
  - media_type: "tv"
    match:
      include_keywords:
        - "anime"
    apply:
      root_folder: "/mnt/plex/TV - Anime"
      server_id: 1
      approve: true
  - media_type: "tv"
    match:
      genres:
        - "Animation"
        - "Kids"
        - "Family"
      certification:
        - "TV-Y"
        - "TV-Y7"
        - "TV-Y7-FV"
        - "TV-G"
        - "TV-PG"
    apply:
      root_folder: "/mnt/plex/TV - Kids"
      server_id: 0
      approve: true
  - media_type: "tv"
    match: {}
    apply:
      root_folder: "/mnt/plex/TV"
      server_id: 0
      approve: true
  - media_type: "movie"
    match:
      genres:
        - "Animation"
      include_keywords:
        - "anime"
      original_language: "ja"
    apply:
      root_folder: "/mnt/plex/Movies - Anime"
      server_id: 1
      approve: true
  - media_type: "movie"
    match:
      genres:
        - "Animation"
        - "Family"
        - "Kids"
        - "Children"
      certification:
        - "G"
        - "PG"
        - "TV-G"
        - "TV-PG"
    apply:
      root_folder: "/mnt/plex/Movies - Kids"
      server_id: 0
      approve: true
  - media_type: "movie"
    match: {}
    apply:
      root_folder: "/mnt/plex/Movies"
      server_id: 0
      approve: true
  - media_type: "music"
    match: {}
    apply:
      root_folder: "/mnt/plex/Music"
      server_id: 0
      approve: true
```
# Docker setup

To setup the Rerouter Docker, follow these steps:

### Docker compose
You can utilise the docker compose file
```bash
docker compose up
```
Make sure that you setup the Webhook appropriately in Overseerr.

## Webhook Setup in Overseerr

To enable Rerouterr to handle requests, you need to set up a webhook in Overseerr:

1. **Navigate to Settings in Overseerr**.
2. **Go to Notifications and select Webhooks**.
3. **Add a new webhook** with the following settings:
   - **URL**: `http://rerouterr:7777/webhook` (replace `<server-ip>` with the IP address of the server where Rerouterr is running).
   - **JSON Payload**:
```json
{
    "notification_type": "{{notification_type}}",
    "media": {
        "media_type": "{{media_type}}",
        "tmdbId": "{{media_tmdbid}}",
        "tvdbId": "{{media_tvdbid}}",
        "status": "{{media_status}}",
        "status4k": "{{media_status4k}}",
        "genres": [
            {
                "id": "{{genre_id}}",
                "name": "{{genre_name}}"
            }
        ],
        "keywords": [
            {
                "id": "{{keyword_id}}",
                "name": "{{keyword_name}}"
            }
        ],
        "original_language": "{{original_language}}",
        "contentRatings": {
            "results": [
                {
                    "iso_3166_1": "{{rating_country}}",
                    "rating": "{{rating_value}}"
                }
            ]
        },
        "releases": {
            "results": [
                {
                    "iso_3166_1": "{{rating_country}}",
                    "release_dates": [
                        {
                            "certification": "{{rating_value}}"
                        }
                    ]
                }
            ]
        }
    },
    "request": {
        "request_id": "{{request_id}}",
        "requestedBy_email": "{{requestedBy_email}}",
        "requestedBy_username": "{{requestedBy_username}}",
        "requestedBy_avatar": "{{requestedBy_avatar}}"
    },
    "{{extra}}": []
}
```
   - **Notification Type**: Choose "Request Pending Approval".

### Important Note

- **Auto-Approval**: Requests should not be set to auto-approve in Overseerr if you want Rerouterr to process them. Auto-approval bypasses the webhook and Rerouterr will not receive the request details needed to apply your custom rules.
