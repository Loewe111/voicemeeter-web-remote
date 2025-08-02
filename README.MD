# Web Remote for Voicemeter

A web-based remote control interface for Voicemeter
Allows you to control pretty much everything in Voicemeter from a web browser.

![Screenshot of the Channels](/images/screenshot_channels.png)

![Screenshot of the Detailed View](/images/screenshot_details.png)

## Features
- Control all Input and Output channels
- Set Compressor, Gate, and EQ settings
- Control Routing and Bus assignments

## Installation and Usage

You need to have Python and Voicemeeter Potato installed on your system.

1. Clone the repository:
   ```bash
   git clone https://github.com/Loewe111/voicemeeter-web-remote.git
   ```
2. Navigate to the project directory:
   ```bash
   cd voicemeeter-web-remote
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure the `config.toml` file as needed.
5. Start the server:
   ```bash
   python main.py
   ```
6. Open your web browser and go to `http://localhost:8080` (or the configured host and port).

Running the server will automatically start Voicemeeter if it is not already running. If the lock option is enabled in the configuration, it will also lock the Voicemeeter GUI to prevent manual changes while using the web remote.