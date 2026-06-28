# Job Application Autofill Extension

A lightweight Chrome/Firefox extension that autofills job application forms using a locally stored JSON profile.

## Features

- Autofills common job application fields
- Supports:
  - Text inputs
  - Textareas
  - Native HTML dropdowns (`<select>`)
- Smart field matching using:
  - Labels
  - Name
  - ID
  - Placeholder
  - `aria-label`
  - `autocomplete`
  - `title`
- Automatically generates Full Name from First & Last Name
- Skips unknown fields safely
- Stores profile locally using Chrome Storage
- No backend, AI, or external APIs

## Tech Stack

- JavaScript
- HTML
- CSS
- Chrome Extension (Manifest V3)

## Current Limitations

- No support for custom React/Vue dropdowns
- No resume upload
- No checkbox/radio button support
- Manual "Fill Form" trigger

## Future Plans

- Support custom dropdowns
- Resume upload
- Import/Export profile
- Better field matching