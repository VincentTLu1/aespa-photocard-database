# Aespa Photocard Database

This is an online website database which utilizes JavaScript, CSS, HTML, and Bootstrap. This database allows the users to browse photocards that they own from various albums and releases.

[Live Demo]https://vincenttlu1.github.io/photocard-database/


## Features

- Searches for member, release, and version
- Filter by member, release, and ownership
- Users can switch between Minimal, Pastel, and Metallic themes
- Mark available cards with owned and not owned identifiers
- Save ownership choices within local browser
- Click, view and zoom in on cards within the collection
- Browse the collection using buttons or left/right arrow keys
- Import and Export collections using JSON files
- Available layout for desktop and mobile

## Photocard Screenshots

All photocards pictures were taken from [Website Orginal](https://biasroom.com/home)

## How it works

The catalog loads from `aespa/cards.csv`, with images stored in `aespa-images/`.

All ownership choices and theme preferences are saved using localStorage. Local browsers will maintain a copy of a collection. All changes do not modify the main CSV file or other user collections.

All collections do not automatically sync across devices. To use export a backup on your local browser and import it onto another device to update with own preference changes.

## Running the collection locally

1. Clone or download the current repository.
2. Open a project folder within your local editor.
3. Use a local web server using extensions like VSCode Live Server.
4. Open the collection link within your local browser.

## Adding photocards

In order to add an imaage, go to `aespa-images/', then add a row in the `aespa/cards.csv` file. The columns in the csv files are id, member, release, version, image, owned.

Similar to online databases, in order to identify cards, you must give each card a unique identifier (distinct ID). The image file uploaded must match the distinct ID used in the CSV file including its extension (EX: .PNG, .WEBP, .AVIF).

The current CSV parser handles data using comma separators. These commas represent individual fields from the columns described above.

## My contributions
This project initially started from a Riftbound card inventory template by [Gummyosh1](https://github.com/Gummyosh1/card-database-template).

I modified the original template/catalog for aespa photocards and added:
- Member and release filters
- Collection progress and counts in filtered results
- Ownership tracking through local browser
- Three savable unique and selectable themes based on user preference
- Accessible card viewer with navigation
- Collection backup through import/export of JSON files
- Increased usability by adding loading messages and error handling
- Updated response controls (buttons) and badges indicating user ownership

## What I learned
- Filtering, navigating, and rendering data through CSV files
- Use and integrate CSS, HTML, and Javascript through a Database approach
- Use stable/distinct ID to allocate cards and connect them to local data
- Create and manipulate themes using CSS properties and functions
- Validate and use JSON to apply local changes
- Saving and restoring preferences using localStorage
- Handling events using event listeners in JavaScript

## Current Limitations
- The catalog is currently not up to date with all photocards and is maintained manually
- Ownership is managed locally through browser and not syncing through accounts (Ex: Google)
- Local browser cleanup will remove all existing local saved choices
- Backups only contain ownership data and not images from file
- Website is still under development with additional features to come.

## Credits
- Orginal Template: [Gummyosh1 / https://github.com/Gummyosh1/card-database-template]
- Photocard image sources: [https://biasroom.com/home]
- Built with Bootstrap and Share Tech font

This is an unofficial fan project and is not affiliated with aespa or SM Entertainment.

