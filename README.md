# PI Estimator

## Installation:

cd to the folder where this file is, then

`npm install`

To build:

`npm run build`

To run:

`node dist/index.js`

To show the configuration options:

`node dist/index.js --help`

----

The source code is in the src folder. Only 2 files:

index.js drives everything, and does the management of the worker cluster and averaging the results.

PiEstimator.js is a class that generates the points, works out what is inside the circle to calculate the approximate area and from there, the estimate of Pi.