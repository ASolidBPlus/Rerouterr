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

#### Apply Section
- `root_folder`: The directory where the media should be stored if the rule is applied. Required.
- `server_id`: The ID of the server where the media is hosted. Refer to the drop-down selection on a request in Overseerr, starting from 0. This number corresponds to the server selection. Required.
- `quality_profile_id`: The ID of the quality profile to apply to the request. This ID also starts from 0 and corresponds to the selection in a quality profile drop-down in Overseerr. Optional (will default to default quality profile).
- `approve`: Whether to automatically approve this request (`true` or `false`). Required.

### Matching Rules

The application matches requests against these rules from top to bottom. The first rule that matches a request will be applied. It is important to order your rules wisely to ensure that the most specific rules are evaluated first.

### Example Configuration

```yaml
overseerr_baseurl: "http://<overseerr ip/domain>:<overseerr port>"
overseerr_api_key: "<api-key>"
rules:
  - media_type: "tv"
    match:
      genres:
        - "Animation"
      exclude_keywords:
        - "anime"
    apply:
      root_folder: "/data/media/tv/cartoon"
      server_id: 1
      quality_profile_id: 8
      approve: false
  - media_type: "tv"
    match:
      genres:
        - "Animation"
      include_keywords:
        - "anime"
    apply:
      root_folder: "/data/media/tv/anime"
      server_id: 1
      quality_profile_id: 7
      approve: false
  - media_type: "tv"
    apply:
      root_folder: "/data/media/tv/general"
      server_id: 0
      approve: false
  - media_type: "movie"
    apply:
      root_folder: "/data/media/movies/general"
      server_id: 0
      approve: false
```
# Docker setup

To setup the Rerouter Docker, follow these steps:

### 0. Manually build the repo (optional):
Manually build the repo if you don't want to pull from the docker hub.
```bash
git clone https://github.com/ASolidBPlus/Rerouter/
cd <cloned repo folder>
docker build -t rerouterr.
```

### 1. Pull the Docker Image
Pull the Docker image from my repo
```bash

docker pull leojay/rerouterr:latest
```

### 2. Run the application
If you manually built:
```bash
docker run -p 7777:7777 -v /path/to/host/config:/config rerouterr
```

If you didn't:
If you manually built:
```bash
docker run -p 7777:7777 -v /path/to/host/config:/config leojay/rerouterr:latest
```
Make sure that you place your config.yaml file where the /config volume location is, and setup the Webhook appropriately in Overseerr.

## Webhook Setup in Overseerr

To enable Rerouterr to handle requests, you need to set up a webhook in Overseerr:

1. **Navigate to Settings in Overseerr**.
2. **Go to Notifications and select Webhooks**.
3. **Add a new webhook** with the following settings:
   - **URL**: `http://<server-ip>:7777/webhook` (replace `<server-ip>` with the IP address of the server where Rerouterr is running).
   - **JSON Payload**:
     ```json
     {
         "notification_type": "{{notification_type}}",
         "media": {
             "media_type": "{{media_type}}",
             "tmdbId": "{{media_tmdbid}}",
             "tvdbId": "{{media_tvdbid}}",
             "status": "{{media_status}}",
             "status4k": "{{media_status4k}}"
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
