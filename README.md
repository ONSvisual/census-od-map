# Census 2021 origin-destination data explorer

This repository contains the source code for the **Census 2021 origin-destination data explorer** on the ONS website, including the [scrollytelling article](https://www.ons.gov.uk/visualisations/censusorigindestination/), and the embeddable interactive tools for [migration flows](https://www.ons.gov.uk/visualisations/censusorigindestination/embed/odmg01ew/) and [workplace flows](https://www.ons.gov.uk/visualisations/censusorigindestination/embed/odwp01ew/).

The code is provided without warranty under an [Open Government Licence](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) (v3).

## Using this code

The Area hub is a [Svelte Kit](https://kit.svelte.dev/) app, and requires NodeJS to be installed on your machine. You can run the code locally as follows:

1. Download or clone the contents of this repo to your local machine.
2. Install the Node dependencies by opening the folder running `npm install` from your command line.
3. Initialise the app by running `npm run dev`.
4. Preview the app in your browser by navigating to http://localhost:5173/.

Making changes to the app will require a working knowledge of Svelte Kit.

## Data files

The necessary data files to run the app are included within the **/static/data** folder. These files are generated using custom scripts from [the source data on Nomis](https://www.nomisweb.co.uk/sources/census_2021_od). These scripts will be made available via a separate repo.
