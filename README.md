# HairFormation Frontend

This repository contains the static files for the HairFormation appointment booking site. It is a simple HTML/CSS/JavaScript application with no build step.

## Setup

1. Clone the repository or download the code.
2. Open `index.html` in any modern web browser. You can double‑click the file or serve it using a static server if preferred.

The site is entirely client‑side, so no build or package installation is required.

## Booking Flow Overview

1. Navigate to **"קביעת תור"** from the homepage.
2. The booking form guides the user through six steps:
   - **Step 1** – Choose a base service and optional add‑ons.
   - **Step 2** – Pick a date from the date picker.
   - **Step 3** – Select an available time slot.
   - **Step 4** – Enter a first name.
   - **Step 5** – Enter a last name.
   - **Step 6** – Provide a phone number and submit the form.
3. After submitting, successful appointments redirect to the confirmation page.

## Backend Dependencies

Booking functionality relies on a backend server that exposes the following endpoints:

- `GET /services` – list of available services
- `POST /get-availability` – available time slots for a date and service
- `POST /book-appointment` – create a booking

The frontend expects this API to be reachable at a base URL defined in `booking.js`.

### Configuring the Base URL

Open `booking.js` and adjust the `SERVER_BASE_URL` constant at the top of the file:

```javascript
const SERVER_BASE_URL = 'https://hairformation-backend.onrender.com';
```

Change this value to point to your own backend deployment if necessary.
