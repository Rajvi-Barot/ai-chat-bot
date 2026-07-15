// CodeMentor AI - Frontend Logic Handler

document.addEventListener('DOMContentLoaded', () => {
    // === App State ===
    const state = {
        apiKey: localStorage.getItem('gemini_api_key') || '',
        selectedLanguage: '',
        selectedConcept: 'Variables and Data Types',
        currentLessonData: null,
        userCodeDrafts: {}, // Stores code drafts per language + concept
        activeTab: 'learn', // 'learn' or 'practice'
        devConsoleTab: 'prompt', // 'prompt' or 'response'
        isDevConsoleOpen: false
    };

    // === DOM Elements ===
    const languageSelector = document.getElementById('language-selector');
    const workspace = document.getElementById('workspace');
    const changeLangBtn = document.getElementById('change-language-btn');
    const currentLangDisplay = document.getElementById('current-lang-display');
    const conceptItems = document.querySelectorAll('.concept-item');
    
    // Modals
    const configApiBtn = document.getElementById('config-api-btn');
    const apiModal = document.getElementById('api-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const toggleKeyVisibility = document.getElementById('toggle-key-visibility');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    
    // Tabs & Panels
    const tabLearn = document.getElementById('tab-learn');
    const tabPractice = document.getElementById('tab-practice');
    const learnPanel = document.getElementById('learn-panel');
    const practicePanel = document.getElementById('practice-panel');
    const goToChallengeBtn = document.getElementById('go-to-challenge-btn');
    
    // Content Areas
    const lessonTitle = document.getElementById('lesson-title');
    const lessonExplanation = document.getElementById('lesson-explanation');
    const lessonCodeExample = document.getElementById('lesson-code-example');
    const challengeTitle = document.getElementById('challenge-title');
    const challengeInstructions = document.getElementById('challenge-instructions');
    const lessonLoader = document.getElementById('lesson-loader');
    
    // Editor Elements
    const codeEditor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const editorTitleText = document.getElementById('editor-title-text');
    const resetCodeBtn = document.getElementById('reset-code-btn');
    const getHintBtn = document.getElementById('get-hint-btn');
    const submitCodeBtn = document.getElementById('submit-code-btn');
    
    // Popups/Results
    const hintBox = document.getElementById('hint-box');
    const hintText = document.getElementById('hint-text');
    const closeHintBtn = document.getElementById('close-hint-btn');
    
    const verifyLoader = document.getElementById('verify-loader');
    const feedbackBox = document.getElementById('feedback-box');
    const feedbackBadge = document.getElementById('feedback-badge');
    const feedbackScore = document.getElementById('feedback-score');
    const feedbackCritique = document.getElementById('feedback-critique');
    const feedbackSolutionCode = document.getElementById('feedback-solution-code');
    const closeFeedbackBtn = document.getElementById('close-feedback-btn');
    const fbTabReview = document.getElementById('fb-tab-review');
    const fbTabSolution = document.getElementById('fb-tab-solution');
    
    // Dev Console
    const devConsole = document.getElementById('dev-console');
    const consoleToggle = document.getElementById('console-toggle');
    const consoleTabPrompt = document.getElementById('console-tab-prompt');
    const consoleTabResponse = document.getElementById('console-tab-response');
    const consolePromptView = document.getElementById('console-prompt-view');
    const consoleResponseView = document.getElementById('console-response-view');
    const consolePromptText = document.getElementById('console-prompt-text');
    const consoleResponseText = document.getElementById('console-response-text');

    // === Initialization ===
    function init() {
        // Pre-fill API key if available
        if (state.apiKey) {
            apiKeyInput.value = state.apiKey;
            updateStatusBadge(true);
        } else {
            updateStatusBadge(false);
            // Open API key modal by default if none is configured
            openModal();
        }

        // Set up event listeners
        setupEventListeners();
        
        // Initial setup for editor line numbers
        updateLineNumbers();
    }

    // === Event Listeners ===
    function setupEventListeners() {
        // Language Selection
        document.querySelectorAll('.lang-card').forEach(card => {
            card.addEventListener('click', () => {
                const lang = card.getAttribute('data-lang');
                selectLanguage(lang);
            });
        });

        changeLangBtn.addEventListener('click', () => {
            workspace.style.display = 'none';
            changeLangBtn.style.display = 'none';
            languageSelector.style.display = 'flex';
        });

        // Sidebar concepts
        conceptItems.forEach(item => {
            item.addEventListener('click', () => {
                conceptItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                state.selectedConcept = item.getAttribute('data-concept');
                loadLesson();
            });
        });

        // Modal triggers
        configApiBtn.addEventListener('click', openModal);
        closeModalBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === apiModal) closeModal();
        });

        // Password visibility toggler
        toggleKeyVisibility.addEventListener('click', () => {
            const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
            apiKeyInput.setAttribute('type', type);
            toggleKeyVisibility.querySelector('i').classList.toggle('fa-eye');
            toggleKeyVisibility.querySelector('i').classList.toggle('fa-eye-slash');
        });

        // Save API Key
        saveApiKeyBtn.addEventListener('click', () => {
            const newKey = apiKeyInput.value.trim();
            state.apiKey = newKey;
            localStorage.setItem('gemini_api_key', newKey);
            updateStatusBadge(!!newKey);
            closeModal();
        });

        // Left Pane Tabs
        tabLearn.addEventListener('click', () => switchLeftTab('learn'));
        tabPractice.addEventListener('click', () => switchLeftTab('practice'));
        goToChallengeBtn.addEventListener('click', () => switchLeftTab('practice'));

        // Code Editor synchronization
        codeEditor.addEventListener('input', () => {
            updateLineNumbers();
            saveDraft();
        });
        
        codeEditor.addEventListener('scroll', () => {
            lineNumbers.scrollTop = codeEditor.scrollTop;
        });

        // Support Tab key inside the editor
        codeEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = codeEditor.selectionStart;
                const end = codeEditor.selectionEnd;
                const value = codeEditor.value;
                codeEditor.value = value.substring(0, start) + "    " + value.substring(end);
                codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
                updateLineNumbers();
                saveDraft();
            }
        });

        // Reset editor code
        resetCodeBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset your editor to the starter code template?")) {
                if (state.currentLessonData && state.currentLessonData.challenge) {
                    codeEditor.value = state.currentLessonData.challenge.starterCode;
                    updateLineNumbers();
                    saveDraft();
                }
            }
        });

        // Get Hint
        getHintBtn.addEventListener('click', requestHint);
        closeHintBtn.addEventListener('click', () => {
            hintBox.style.display = 'none';
        });

        // Submit & Verify
        submitCodeBtn.addEventListener('click', submitCodeForVerification);
        closeFeedbackBtn.addEventListener('click', () => {
            feedbackBox.style.display = 'none';
        });

        // Feedback Tabs
        fbTabReview.addEventListener('click', () => switchFeedbackTab('review'));
        fbTabSolution.addEventListener('click', () => switchFeedbackTab('solution'));

        // Dev Console Toggle
        consoleToggle.addEventListener('click', toggleDevConsole);
        consoleTabPrompt.addEventListener('click', () => switchConsoleTab('prompt'));
        consoleTabResponse.addEventListener('click', () => switchConsoleTab('response'));
    }

    // === API Helper ===
    async function makeApiCall(endpoint, bodyData) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Detect if running via file:// or served (local Flask dev server)
        const baseUrl = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : '';
        
        // Append API Key in headers if available
        if (state.apiKey) {
            headers['Authorization'] = `Bearer ${state.apiKey}`;
        }

        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(bodyData)
            });

            if (!response.ok) {
                const errResult = await response.json().catch(() => ({}));
                throw new Error(errResult.error || `Server responded with status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Call failed on ${endpoint}:`, error);
            
            let message = error.message;
            if (error.message.includes('Failed to fetch')) {
                message = "Could not connect to the backend server. If running locally, ensure 'python app.py' is running and the server is reachable.";
            }
            
            alert(`Tutor System Error:\n${message}\n\nPlease check your configuration and API status.`);
            throw error;
        }
    }

    // === Modal Controllers ===
    function openModal() {
        apiModal.classList.add('active');
    }
    function closeModal() {
        apiModal.classList.remove('active');
    }

    function updateStatusBadge(hasKey) {
        const badge = document.querySelector('.status-badge');
        if (hasKey) {
            badge.style.color = 'var(--accent-cyan)';
            badge.style.background = 'rgba(6, 182, 212, 0.1)';
            badge.style.borderColor = 'rgba(6, 182, 212, 0.2)';
            badge.querySelector('.pulse').style.backgroundColor = 'var(--accent-cyan)';
            badge.querySelector('.pulse').style.boxShadow = '0 0 0 0 var(--accent-cyan-glow)';
            badge.innerHTML = '<span class="pulse"></span>API Connected';
        } else {
            badge.style.color = 'var(--accent-gold)';
            badge.style.background = 'rgba(245, 158, 11, 0.1)';
            badge.style.borderColor = 'rgba(245, 158, 11, 0.2)';
            badge.querySelector('.pulse').style.backgroundColor = 'var(--accent-gold)';
            badge.querySelector('.pulse').style.boxShadow = '0 0 0 0 var(--accent-gold-glow)';
            badge.innerHTML = '<span class="pulse"></span>API Key Required';
        }
    }

    // === Select Language Flow ===
    function selectLanguage(language) {
        state.selectedLanguage = language;
        currentLangDisplay.textContent = language;
        editorTitleText.textContent = `${language} Code Editor`;
        
        languageSelector.style.display = 'none';
        workspace.style.display = 'flex';
        changeLangBtn.style.display = 'flex';

        // Load the default selected concept
        loadLesson();
    }

    // === Load Lesson ===
    async function loadLesson() {
        // Toggle view elements
        learnPanel.classList.remove('active');
        practicePanel.classList.remove('active');
        lessonLoader.style.display = 'block';
        hintBox.style.display = 'none';
        feedbackBox.style.display = 'none';

        // Set Tab to Learn
        switchLeftTab('learn');

        try {
            const response = await makeApiCall('/api/lesson', {
                language: state.selectedLanguage,
                concept: state.selectedConcept
            });

            const lesson = response.data;
            state.currentLessonData = lesson;

            // Render Markdown
            lessonTitle.textContent = lesson.title;
            lessonExplanation.innerHTML = marked.parse(lesson.explanation);
            lessonCodeExample.textContent = lesson.codeExample;

            challengeTitle.textContent = lesson.challenge.title;
            challengeInstructions.innerHTML = marked.parse(lesson.challenge.instructions);

            // Set code in editor (either previous draft or the starter code template)
            const draftKey = `${state.selectedLanguage}_${state.selectedConcept}`;
            if (state.userCodeDrafts[draftKey]) {
                codeEditor.value = state.userCodeDrafts[draftKey];
            } else {
                codeEditor.value = lesson.challenge.starterCode;
            }

            // Sync Line Numbers
            updateLineNumbers();

            // Update Developer Console Logs
            updateDevConsole(response.debug.prompt, response.debug.response);

        } catch (err) {
            lessonExplanation.innerHTML = `<p class="error-text" style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Failed to generate lesson. Please check the server connection and ensure your Gemini API key is configured.</p>`;
        } finally {
            lessonLoader.style.display = 'none';
            learnPanel.classList.add('active');
        }
    }

    // === Get Hint ===
    async function requestHint() {
        if (!state.currentLessonData) return;
        
        getHintBtn.disabled = true;
        getHintBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Getting Hint...`;

        try {
            const response = await makeApiCall('/api/hint', {
                language: state.selectedLanguage,
                concept: state.selectedConcept,
                challenge: state.currentLessonData.challenge.instructions,
                starterCode: state.currentLessonData.challenge.starterCode,
                userCode: codeEditor.value
            });

            hintText.textContent = response.data.hint;
            hintBox.style.display = 'block';
            
            // Auto scroll to hint
            hintBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Update Dev Console logs
            updateDevConsole(response.debug.prompt, response.debug.response);
        } catch (err) {
            console.error(err);
        } finally {
            getHintBtn.disabled = false;
            getHintBtn.innerHTML = `<i class="fa-regular fa-lightbulb"></i> Get Hint`;
        }
    }

    // === Code Verification ===
    async function submitCodeForVerification() {
        if (!state.currentLessonData) return;

        verifyLoader.style.display = 'flex';
        feedbackBox.style.display = 'none';
        hintBox.style.display = 'none';

        try {
            const response = await makeApiCall('/api/verify', {
                language: state.selectedLanguage,
                concept: state.selectedConcept,
                challenge: state.currentLessonData.challenge.instructions,
                userCode: codeEditor.value
            });

            const result = response.data;

            // Render feedback elements
            if (result.isCorrect) {
                feedbackBadge.textContent = "Passed";
                feedbackBadge.className = "badge success";
            } else {
                feedbackBadge.textContent = "Improve";
                feedbackBadge.className = "badge fail";
            }

            feedbackScore.textContent = `Score: ${result.score}/100`;
            feedbackCritique.innerHTML = marked.parse(result.feedback);
            feedbackSolutionCode.textContent = result.optimizedSolution;

            // Open feedback box & display critique tab
            feedbackBox.style.display = 'flex';
            switchFeedbackTab('review');

            // Update Dev Console logs
            updateDevConsole(response.debug.prompt, response.debug.response);

        } catch (err) {
            console.error(err);
        } finally {
            verifyLoader.style.display = 'none';
        }
    }

    // === UI Utilities ===
    function switchLeftTab(tab) {
        state.activeTab = tab;
        if (tab === 'learn') {
            tabLearn.classList.add('active');
            tabPractice.classList.remove('active');
            learnPanel.style.display = 'block';
            practicePanel.style.display = 'none';
        } else {
            tabLearn.classList.remove('active');
            tabPractice.classList.add('active');
            learnPanel.style.display = 'none';
            practicePanel.style.display = 'block';
        }
    }

    function switchFeedbackTab(tab) {
        if (tab === 'review') {
            fbTabReview.classList.add('fb-tabactive');
            fbTabSolution.classList.remove('fb-tabactive');
            feedbackCritique.style.display = 'block';
            document.getElementById('feedback-solution').style.display = 'none';
        } else {
            fbTabReview.classList.remove('fb-tabactive');
            fbTabSolution.classList.add('fb-tabactive');
            feedbackCritique.style.display = 'none';
            document.getElementById('feedback-solution').style.display = 'block';
        }
    }

    function updateLineNumbers() {
        const text = codeEditor.value;
        const lineCount = text.split('\n').length;
        
        let linesHTML = '';
        for (let i = 1; i <= lineCount; i++) {
            linesHTML += `${i}<br>`;
        }
        lineNumbers.innerHTML = linesHTML;
    }

    function saveDraft() {
        const draftKey = `${state.selectedLanguage}_${state.selectedConcept}`;
        state.userCodeDrafts[draftKey] = codeEditor.value;
    }

    // === Developer Console Controllers ===
    function toggleDevConsole() {
        state.isDevConsoleOpen = !state.isDevConsoleOpen;
        if (state.isDevConsoleOpen) {
            devConsole.classList.remove('collapsed');
            workspace.style.paddingBottom = 'var(--console-height)';
        } else {
            devConsole.classList.add('collapsed');
            workspace.style.paddingBottom = '0px';
        }
    }

    function switchConsoleTab(tab) {
        state.devConsoleTab = tab;
        if (tab === 'prompt') {
            consoleTabPrompt.classList.add('active');
            consoleTabResponse.classList.remove('active');
            consolePromptView.classList.add('active');
            consoleResponseView.classList.remove('active');
        } else {
            consoleTabPrompt.classList.remove('active');
            consoleTabResponse.classList.add('active');
            consolePromptView.classList.remove('active');
            consoleResponseView.classList.add('active');
        }
    }

    function updateDevConsole(prompt, response) {
        consolePromptText.textContent = prompt;
        // Try parsing response if string to print nicely formatted JSON
        try {
            const parsed = JSON.parse(response);
            consoleResponseText.textContent = JSON.stringify(parsed, null, 2);
        } catch (e) {
            consoleResponseText.textContent = response;
        }
    }

    // Start App
    init();
});
