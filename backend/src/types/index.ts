/**
 * Server Entry Point
 * 
 * Starts the Express server and listens on the configured port.
 * 
 * @module index
 */

import app from '../utils/app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Server running on port ${ PORT }');
});