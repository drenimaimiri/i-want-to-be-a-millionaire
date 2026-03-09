const PRIZES = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];

let quizData = [];
let currentQuestion = 0;
let score = 0;
let used5050 = false;
let usedHint = false;
let usedCallFriend = false;
let hintAnswer = null;
let timerInterval = null;
let timeLeft = 30;
let isAnswered = false;

const TIMER_DURATION = 30;

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showCreator() {
    showScreen('creatorScreen');
    document.getElementById('linkSection').style.display = 'none';
    updateQuestionCount();
}

function updateQuestionCount() {
    const count = parseInt(document.getElementById('numQuestions').value);
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        container.innerHTML += `
            <div class="question-item" style="margin-top: 20px;">
                <h4>Pyetja ${i + 1}</h4>
                <div class="input-group">
                    <label>Teksti i Pyetjes</label>
                    <input type="text" class="question-input" placeholder="Shkruaj pyetjen ${i + 1}">
                </div>
                <div class="input-group">
                    <label>Përgjigja e Saktë</label>
                    <input type="text" class="correct-answer" placeholder="Përgjigja e saktë">
                </div>
                <div class="input-group">
                    <label>Përgjigjet e Gabuara (3)</label>
                    <input type="text" class="wrong-answer-1" placeholder="Përgjigja e gabuar 1">
                    <input type="text" class="wrong-answer-2" placeholder="Përgjigja e gabuar 2" style="margin-top: 5px;">
                    <input type="text" class="wrong-answer-3" placeholder="Përgjigja e gabuar 3" style="margin-top: 5px;">
                </div>
                <div class="input-group">
                    <label>Ndihmë (opsionale)</label>
                    <input type="text" class="custom-hint" placeholder="Shkruaj ndihmën tënde (p.sh. 'Përgjigja fillon me P')">
                </div>
            </div>
        `;
    }
}

function generateLink() {
    const questions = [];
    const questionInputs = document.querySelectorAll('.question-item');
    
    for (let i = 0; i < questionInputs.length; i++) {
        const q = questionInputs[i].querySelector('.question-input').value;
        const correct = questionInputs[i].querySelector('.correct-answer').value;
        const w1 = questionInputs[i].querySelector('.wrong-answer-1').value;
        const w2 = questionInputs[i].querySelector('.wrong-answer-2').value;
        const w3 = questionInputs[i].querySelector('.wrong-answer-3').value;
        const customHint = questionInputs[i].querySelector('.custom-hint').value;
        
        if (!q || !correct || !w1 || !w2 || !w3) {
            alert(`Ju lutemi plotësoni të gjitha fushat për Pyetjen ${i + 1}`);
            return;
        }
        
        const answers = [
            { text: correct, correct: true },
            { text: w1, correct: false },
            { text: w2, correct: false },
            { text: w3, correct: false }
        ];
        
        questions.push({
            question: q,
            answers: shuffleArray(answers),
            hint: customHint || null
        });
    }
    
    quizData = questions;
    const encoded = btoa(encodeURIComponent(JSON.stringify(quizData)));
    const link = `${window.location.origin}${window.location.pathname}?quiz=${encoded}`;
    
    document.getElementById('shareLink').value = link;
    document.getElementById('linkSection').style.display = 'block';
}

function copyLink() {
    const linkInput = document.getElementById('shareLink');
    linkInput.select();
    document.execCommand('copy');
    alert('Linku u kopjua në clipboard!');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadQuizFromURL() {
    const params = new URLSearchParams(window.location.search);
    const quizParam = params.get('quiz');
    
    if (quizParam) {
        try {
            quizData = JSON.parse(decodeURIComponent(atob(quizParam)));
            return true;
        } catch (e) {
            console.error('Failed to load quiz:', e);
        }
    }
    return false;
}

function startQuiz() {
    if (!loadQuizFromURL()) {
        quizData = getDefaultQuiz();
    }
    
    currentQuestion = 0;
    score = 0;
    used5050 = false;
    usedHint = false;
    usedCallFriend = false;
    hintAnswer = null;
    
    document.getElementById('lifeline5050').disabled = false;
    document.getElementById('lifelineHint').disabled = false;
    document.getElementById('lifelineCall').disabled = false;
    
    showScreen('quizScreen');
    displayQuestion();
}

function getDefaultQuiz() {
    return [
        {
            question: "Cila është kryeqyteti i Francës?",
            answers: [
                { text: "Londër", correct: false },
                { text: "Paris", correct: true },
                { text: "Berlin", correct: false },
                { text: "Madrid", correct: false }
            ],
            hint: "Kryeqyteti i Francës fillon me P"
        },
        {
            question: "Cila planetë njihet si Planeta e Kuqe?",
            answers: [
                { text: "Venus", correct: false },
                { text: "Jupiter", correct: false },
                { text: "Mars", correct: true },
                { text: "Saturn", correct: false }
            ],
            hint: "Emri i planetës fillon me M"
        },
        {
            question: "Sa është 2 + 2?",
            answers: [
                { text: "3", correct: false },
                { text: "4", correct: true },
                { text: "5", correct: false },
                { text: "6", correct: false }
            ],
            hint: "Dy plus dy = katër"
        }
    ];
}

function displayQuestion() {
    const q = quizData[currentQuestion];
    document.getElementById('questionNumber').textContent = `Pyetja ${currentQuestion + 1} nga ${quizData.length}`;
    document.getElementById('questionText').textContent = q.question;
    document.getElementById('progressFill').style.width = `${((currentQuestion) / quizData.length) * 100}%`;
    
    const grid = document.getElementById('answersGrid');
    grid.innerHTML = '';
    
    const labels = ['A', 'B', 'C', 'D'];
    q.answers.forEach((answer, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.innerHTML = `<span class="answer-label">${labels[index]}</span> ${answer.text}`;
        btn.onclick = () => selectAnswer(index);
        btn.dataset.correct = answer.correct;
        btn.dataset.index = index;
        grid.appendChild(btn);
    });
    
    startTimer();
}

function startTimer() {
    timeLeft = TIMER_DURATION;
    isAnswered = false;
    
    const timerFill = document.getElementById('timerFill');
    const timerText = document.getElementById('timerText');
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerFill.classList.remove('warning');
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 10) {
            timerFill.classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (!isAnswered) {
                timeUp();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerFill = document.getElementById('timerFill');
    const timerText = document.getElementById('timerText');
    
    const percentage = (timeLeft / TIMER_DURATION) * 100;
    timerFill.style.width = `${percentage}%`;
    timerText.textContent = `Koha: ${timeLeft}s`;
}

function timeUp() {
    isAnswered = true;
    const buttons = document.querySelectorAll('.answer-btn');
    const correctIndex = quizData[currentQuestion].answers.findIndex(a => a.correct);
    
    buttons.forEach(btn => btn.disabled = true);
    buttons[correctIndex].classList.add('correct');
    
    setTimeout(() => {
        showResults();
    }, 2000);
}

function selectAnswer(index) {
    if (isAnswered) return;
    isAnswered = true;
    
    clearInterval(timerInterval);
    
    const buttons = document.querySelectorAll('.answer-btn');
    const correctIndex = quizData[currentQuestion].answers.findIndex(a => a.correct);
    
    buttons.forEach(btn => btn.disabled = true);
    
    if (quizData[currentQuestion].answers[index].correct) {
        buttons[index].classList.add('correct');
        score = PRIZES[currentQuestion] || score;
        
        setTimeout(() => {
            currentQuestion++;
            if (currentQuestion < quizData.length) {
                displayQuestion();
            } else {
                showResults();
            }
        }, 1500);
    } else {
        buttons[index].classList.add('wrong');
        buttons[correctIndex].classList.add('correct');
        
        setTimeout(() => {
            showResults();
        }, 2000);
    }
}

function use5050() {
    if (used5050) return;
    used5050 = true;
    document.getElementById('lifeline5050').disabled = true;
    document.getElementById('lifeline5050').classList.add('used');
    
    const buttons = Array.from(document.querySelectorAll('.answer-btn'));
    const correctBtn = buttons.find(btn => btn.dataset.correct === 'true');
    const wrongBtns = buttons.filter(btn => btn.dataset.correct === 'false');
    
    const toRemove = wrongBtns.sort(() => 0.5 - Math.random()).slice(0, 2);
    toRemove.forEach(btn => {
        btn.classList.add('disabled');
        btn.disabled = true;
    });
}

function useHint() {
    if (usedHint) return;
    usedHint = true;
    document.getElementById('lifelineHint').disabled = true;
    document.getElementById('lifelineHint').classList.add('used');
    
    const currentQ = quizData[currentQuestion];
    const correctIndex = currentQ.answers.findIndex(a => a.correct);
    const correctAnswer = currentQ.answers[correctIndex].text;
    
    hintAnswer = correctIndex;
    
    let hintText;
    if (currentQ.hint && currentQ.hint.trim() !== '') {
        hintText = currentQ.hint;
    } else {
        hintText = `Përgjigja fillon me: "${correctAnswer.charAt(0).toUpperCase()}"`;
    }
    
    document.getElementById('modalTitle').textContent = '💡 Ndihmë';
    document.getElementById('modalBody').innerHTML = `
        <div class="hint-text">${hintText}</div>
    `;
    document.getElementById('modal').classList.add('active');
}

function useCallFriend() {
    if (usedCallFriend) return;
    usedCallFriend = true;
    document.getElementById('lifelineCall').disabled = true;
    document.getElementById('lifelineCall').classList.add('used');
    
    const correctIndex = quizData[currentQuestion].answers.findIndex(a => a.correct);
    const confidence = Math.floor(Math.random() * 30) + 60;
    
    const friends = ["Johani", "Saraja", "Mike", "Emma", "Davidi"];
    const friend = friends[Math.floor(Math.random() * friends.length)];
    
    document.getElementById('modalTitle').textContent = `📞 Thërre ${friend}`;
    document.getElementById('modalBody').innerHTML = `
        <div class="friend-call">
            "${friend} thotë: Jam ${confidence}% i sigurtë që përgjigja është 
            <strong>${quizData[currentQuestion].answers[correctIndex].text}</strong>!"
        </div>
    `;
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function showResults() {
    clearInterval(timerInterval);
    showScreen('resultScreen');
    document.getElementById('finalScore').textContent = `$${score.toLocaleString()}`;
    
    const percentage = (score / (PRIZES[quizData.length - 1] || 1000)) * 100;
    let message;
    
    if (percentage === 100) {
        message = "🎉 MILIONER! Ti je gjeni! 🎉";
        launchConfetti();
    } else if (percentage >= 70) {
        message = "🌟 Punë e shkëlqyer!";
    } else if (percentage >= 40) {
        message = "👍 Përpjekje e mirë!";
    } else if (score > 0) {
        message = "💪 Vijo të praktikosh!";
    } else {
        message = "📚 Më shumë fat herën tjetër!";
    }
    
    document.getElementById('resultMessage').textContent = message;
}

function shareResults() {
    const text = `Unë arrita $${score.toLocaleString()} në kuizin Kush Do të Bëhet Milioner! A mund të më besh?`;
    if (navigator.share) {
        navigator.share({ text: text });
    } else {
        navigator.clipboard.writeText(text + ' ' + window.location.href);
        alert('Rezultati u kopjua në clipboard!');
    }
}

function launchConfetti() {
    const colors = ['#ffd700', '#ff8c00', '#ff4500', '#2ecc40', '#00aaff', '#ff69b4'];
    
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animation = `confettiFall ${2 + Math.random() * 3}s linear forwards`;
        confetti.style.animationDelay = Math.random() * 2 + 's';
        
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        }
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function handleKeyPress(e) {
    const quizScreen = document.getElementById('quizScreen');
    if (!quizScreen.classList.contains('active') || isAnswered) return;
    
    const key = e.key.toUpperCase();
    const keyMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    
    if (keyMap.hasOwnProperty(key)) {
        selectAnswer(keyMap[key]);
    }
}

window.onload = function() {
    const loadingScreen = document.getElementById('loadingScreen');
    
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 2000);
    
    initParticles();
    
    if (loadQuizFromURL()) {
        document.querySelector('#homeScreen .btn:first-child').textContent = 'Luaj Kuizin';
    }
    
    document.addEventListener('keydown', handleKeyPress);
};
