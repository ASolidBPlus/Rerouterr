# Node.js Application for Media Request Handling

This Node.js application interfaces with the Overseerr API to handle media requests automatically based on predefined rules. It is designed to streamline the approval and management of TV and movie requests by applying specific configurations such as quality profiles, root folders, and more.

## Features

- **Automatic Request Handling**: Automates the approval and configuration process for new media requests.
- **Customizable Rules**: Allows defining rules based on media type, genres, keywords, and more.
- **Integration with Overseerr**: Communicates with Overseerr's API to fetch and update request details.

## Configuration

Configuration is handled through a `config.yaml` file which contains sensitive and specific details such as the Overseerr base URL, API key, and rules for processing media requests.

### Configuration File Structure

Here's a breakdown of the `config.yaml` file structure:

- `overseerr_baseurl`: The base URL for your Overseerr installation.
- `overseerr_api_key`: Your Overseerr API key.
- `rules`: A list of rules for handling media requests. Each rule can define:
  - `media_type`: The type of media (`tv` or `movie`).
  - `genres`: List of genres to match.
  - `exclude_keywords`: Keywords to exclude when matching requests.
  - `include_keywords`: Keywords to include for specific handling.
  - `root_folder`: The root directory where the media should be stored.
  - `server_id`: The ID of the server where the media is hosted.
  - `server_name`: A friendly name for the server.
  - `quality_profile_id`: The ID of the quality profile to apply.
  - `approve`: Whether to automatically approve this request.

#### Example `config.yaml`

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
