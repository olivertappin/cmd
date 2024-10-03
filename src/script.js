document.addEventListener('DOMContentLoaded', () => {
    const terminal = document.querySelector('.terminal');
    const maximizeButton = document.querySelector('.maximize');
    const terminalBody = document.getElementById('terminal-body');
    let currentUser = 'user';  // Default user, will be updated on page load
    let currentHostname = 'localhost'; // Default hostname, will be updated on page load
    let currentCwd = '~';      // Default working directory, will be updated on page load
    let streamRequest = null;  // Track the current request for cancellation

    // Maximize button functionality
    maximizeButton.addEventListener('click', () => {
        terminal.classList.toggle('terminal--fullscreen');
    });

    // Function to fetch initial user and cwd
    function fetchInitialInfo() {
        const initialRequest = new XMLHttpRequest();
        initialRequest.open('POST', 'execute.php', true);
        initialRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        initialRequest.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                const response = JSON.parse(this.responseText);
                currentUser = response.user;
                currentHostname = response.hostname;
                currentCwd = response.cwd;
                addInputField(); // Show prompt after loading
            }
        };
        initialRequest.send('action=initial');
    }

    // Function to send the command to the backend
    function processCommand(command) {
        const promptLine = document.createElement('div');
        promptLine.classList.add('output');
        promptLine.innerHTML = `<span class="prompt">${currentUser}@${currentHostname} ${currentCwd} %</span> ${command}`;
        terminalBody.appendChild(promptLine);

        removeInputField();

        streamRequest = new XMLHttpRequest();
        streamRequest.open('POST', 'execute.php', true);
        streamRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        let lastProcessedIndex = 0;

        streamRequest.onreadystatechange = function () {
            if (this.readyState === 3 || this.readyState === 4) {
                const newData = this.responseText.substring(lastProcessedIndex);
                processResponse(newData);
                lastProcessedIndex = this.responseText.length;
            }

            if (this.readyState === 4) {
                addInputField();
            }
        };

        streamRequest.send(`command=${encodeURIComponent(command)}&action=run`);
    }

    // Function to process the received response and output to the terminal
    function processResponse(responseText) {
        const lines = responseText.trim().split('\n');

        lines.forEach((line) => {
            try {
                const response = JSON.parse(line);

                if (response.user && response.cwd && response.hostname) {
                    currentUser = response.user;
                    currentHostname = response.hostname;
                    currentCwd = response.cwd;
                }

                if (response.output) {
                    const resultLine = document.createElement('div');
                    resultLine.classList.add('output');
                    resultLine.innerHTML = response.output.replace(/\n/g, '<br>');
                    terminalBody.appendChild(resultLine);
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                }
            } catch (e) {
                console.error("Error parsing JSON: ", line);
            }
        });
    }

    function addInputField() {
        const inputLine = document.createElement('div');
        inputLine.classList.add('input-line');
        inputLine.innerHTML = `<span class="prompt">${currentUser}@${currentHostname} ${currentCwd} %</span> <input type="text" class="input" id="terminal-input" autofocus>`;

        terminalBody.appendChild(inputLine);
        terminalBody.scrollTop = terminalBody.scrollHeight;

        const newInput = document.getElementById('terminal-input');
        newInput.focus();
        newInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = newInput.value.trim();
                if (command) {
                    processCommand(command);
                }
                newInput.value = '';
            }
            if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
                killProcess();
            }
        });
    }

    function removeInputField() {
        const existingInput = document.querySelector('.input-line');
        if (existingInput) {
            terminalBody.removeChild(existingInput);
        }
    }

    function killProcess() {
        if (streamRequest) {
            const killRequest = new XMLHttpRequest();
            killRequest.open('POST', 'execute.php', true);
            killRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            killRequest.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    const response = JSON.parse(this.responseText);
                    const resultLine = document.createElement('div');
                    resultLine.classList.add('output');
                    resultLine.innerHTML = `<span style="color: red;">${response.output}</span>`;
                    terminalBody.appendChild(resultLine);
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                    addInputField();
                }
            };
            killRequest.send('action=kill');
        }
    }

    // Fetch initial info and add input field
    fetchInitialInfo();
});
