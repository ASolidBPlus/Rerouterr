# Node.js Application for Media Request Handling

This Node.js application interfaces with the Overseerr API to handle media requests automatically based on predefined rules. It is designed to streamline the approval and management of TV and movie requests by applying specific configurations such as quality profiles, root folders, and more.

## Features

- **Automatic Request Handling**: Automates the approval and configuration process for new media requests.
- **Customizable Rules**: Allows defining rules based on media type, genres, keywords, and more.
- **Integration with Overseerr**: Communicates with Overseerr's API to fetch and update request details.

## Configuration File Structure

Configuration is handled through a `config.yaml` file, which contains essential details such as the Overseerr base URL, API key, and rules for processing media requests. Below is a detailed breakdown of the `config.yaml` file structure:

- `overseerr_baseurl`: The base URL for your Overseerr installation.
- `overseerr_api_key`: Your Overseerr API key, used for authentication with the Overseerr API.

### Rules

The `rules` array contains definitions for how different types of media requests are handled. Each rule can specify the following fields:

- `media_type`: The type of media (`tv` or `movie`).
- `genres`: List of genres that this rule applies to.
- `exclude_keywords`: Keywords to exclude when matching requests. If a request contains any of these keywords, it will not match this rule.
- `include_keywords`: Keywords that must be included for a request to match this rule.
- `root_folder`: The directory where the media should be stored if the rule is applied.
- `server_id`: The ID of the server where the media is hosted. Refer to the drop-down selection on a request in Overseerr, starting from 0. This number corresponds to the server selection.
- `server_name`: A friendly name for the server. This is used purely for your benefit and is not specifically linked to the Overseerr server.
- `quality_profile_id`: The ID of the quality profile to apply to the request. This ID also starts from 0 and corresponds to the selection in a quality profile drop-down in Overseerr.
- `approve`: Whether to automatically approve this request (`true` or `false`).

#### Matching Rules

The application will match requests against these rules from top to bottom. The first rule that matches a request will be applied. It is important to order your rules wisely to ensure that the most specific rules are evaluated first.

#### Example Configuration

```yaml
overseerr_baseurl: "http://192.168.0.254:5055"
overseerr_api_key: "API KEY HERE ANON"
rules:
  - media_type: "tv"
    genres:
      - "Animation"
    exclude_keywords:
      - "anime"
    root_folder: "/data/media/tv/cartoon"
    server_id: 1
    server_name: "Animated"
    quality_profile_id: 8
    approve: true
  - media_type: "tv"
    genres:
      - "Animation"
    include_keywords:
      - "anime"
    root_folder: "/data/media/tv/anime"
    server_id: 1
    server_name: "Animated"
    approve: true
  - media_type: "tv"
    root_folder: "/data/media/tv/general"
    server_id: 0
    server_name: "General"
    approve: true
  - media_type: "movie"
    root_folder: "/data/media/movies/general"
    server_id: 0
    server_name: "General"
    approve: true
