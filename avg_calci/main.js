const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;

// Configuration
const WINDOW_SIZE = 10;
const TEST_SERVER_URL = 'http://20.244.56.144/test';
const TIMEOUT = 500; // 500 ms timeout

let numberWindow = [];

app.get('/numbers/:id', async (req, res) => {
    const id = req.params.id;
    
    if (!['p', 'f', 'e', 'r'].includes(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const endpoint = getEndpoint(id);
        const response = await axios.get(`${TEST_SERVER_URL}/${endpoint}`, { timeout: TIMEOUT });
        const numbers = response.data.numbers;

        updateWindow(numbers);

        const result = {
            numbers: numbers,
            windowPrevState: numberWindow.slice(0, -numbers.length),
            windowCurrState: numberWindow,
            avg: calculateAverage(numberWindow)
        };

        res.json(result);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(504).json({ error: 'Request to test server timed out' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

function getEndpoint(id) {
    switch (id) {
        case 'p': return 'primes';
        case 'f': return 'fibo';
        case 'e': return 'even';
        case 'r': return 'rand';
    }
}

function updateWindow(newNumbers) {
    // Remove duplicates and add new unique numbers
    const uniqueNewNumbers = newNumbers.filter(num => !numberWindow.includes(num));
    numberWindow = [...numberWindow, ...uniqueNewNumbers];

    // Trim to window size
    if (numberWindow.length > WINDOW_SIZE) {
        numberWindow = numberWindow.slice(-WINDOW_SIZE);
    }
}

function calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return parseFloat((sum / numbers.length).toFixed(2));
}

app.listen(port, () => {
    console.log(`Average Calculator Microservice running on http://localhost:${port}`);
});