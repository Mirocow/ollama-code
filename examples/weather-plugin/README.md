# Weather Plugin for Ollama Code

A simple weather plugin that provides current weather and forecasts for any location worldwide.

## Features

- 🌤️ **Current Weather** - Get temperature, humidity, wind speed, and conditions
- 📅 **Weather Forecast** - Get up to 7-day weather forecast
- 🌍 **Global Coverage** - Works for any city worldwide
- 🔓 **No API Key Required** - Uses free Open-Meteo API

## Installation

### From Marketplace (when available)

```
/plugins install weather
```

### Manual Installation

1. Copy this folder to `~/.ollama-code/plugins/`
2. Run `/plugins reload`

## Usage

### Get Current Weather

```
/plugins weather London
```

Or in chat:
```
What's the weather in Tokyo?
```

### Get Forecast

```
/plugins forecast Paris 5
```

Or in chat:
```
Give me the 3-day forecast for New York
```

## Tools Provided

| Tool | Description |
|------|-------------|
| `get_weather` | Get current weather for a city |
| `get_forecast` | Get weather forecast for a city |

## Settings

| Setting | Type | Required | Description |
|---------|------|----------|-------------|
| `api_key` | string | No | OpenWeatherMap API key (optional) |
| `default_units` | string | No | Temperature units: "celsius" or "fahrenheit" |

## API Used

This plugin uses the [Open-Meteo API](https://open-meteo.com/), which is:
- Free to use
- No API key required
- No rate limits for personal use

## Example Output

```
🌤️ Weather for London, United Kingdom:

   Temperature: 18°C
   Humidity: 72%
   Wind Speed: 15 km/h
   Conditions: Partly cloudy

   Last updated: 6/15/2024, 2:30:00 PM
```

## Creating Your Own Plugin

This plugin serves as an example of how to create Ollama Code plugins. Key files:

1. **package.json** - NPM package metadata (required for marketplace)
2. **plugin.json** - Plugin manifest with tools, settings, capabilities
3. **index.js** - Plugin implementation with tool handlers

See the [Plugin Development Guide](../../docs/PLUGIN_SYSTEM.md) for more details.

## License

Apache-2.0
