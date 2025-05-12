let playerName = prompt("Palun sisesta oma nimi");

const startSound = new Audio("sounds/wakeup.mp3");
const typeSound = new Audio("sounds/typing.mp3");
const errorSound = new Audio("sounds/miss.mp3");
const endSound = new Audio("sounds/victory.mp3");

class Typer {
    constructor(pname) {
        this.name = pname;
        this.wordsInGame = 3;
        this.startingWordLength = 3;
        this.words = [];
        this.word = "START";
        this.typeWords = [];
        this.startTime = 0;
        this.endTime = 0;
        this.typedCount = 0;
        this.allResults = JSON.parse(localStorage.getItem('typer')) || [];
        this.wpm = 0;
        this.loadFromFile();
    }

    loadFromFile() {
        $.get("lemmad2013.txt", (data) => this.getWords(data));
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
            this.showAllResults();
        });
    }

    getWords(data) {
        const dataFromFile = data.split("\n");
        this.separateWordsByLength(dataFromFile);
    }

    separateWordsByLength(data) {
        for (let i = 0; i < data.length; i++) {
            const wordLength = data[i].length;
            if (!this.words[wordLength]) {
                this.words[wordLength] = [];
            }
            this.words[wordLength].push(data[i]);
        }
        this.startTyper();
    }

    startTyper() {
        startSound.play();
        this.generateWords();
        this.startTime = performance.now();
    }

    generateWords() {
        for (let i = 0; i < this.wordsInGame; i++) {
            const wordLength = this.startingWordLength + i;
            const wordList = this.words[wordLength];
            if (!wordList) continue;
            const randomIndex = Math.floor(Math.random() * wordList.length);
            this.typeWords[i] = wordList[randomIndex];
        }
        this.selectWord();
    }

    drawWord() {
        $("#wordDiv").html(this.word);
    }

    selectWord() {
        this.word = this.typeWords[this.typedCount];
        this.typedCount++;
        this.drawWord();
        this.updateInfo();
    }

    updateInfo() {
        $('#info').html(this.typedCount + "/" + this.wordsInGame);
    }

    shortenWords(key) {
        if (key != this.word.charAt(0)) {
            errorSound.play();
            $('#container').css("background-color", "red");
            setTimeout(() => {
                $('#container').css("background-color", "#2f2f2f");
            }, 200);
        } else {
            typeSound.play();
            if (this.word.length == 1 && this.typedCount == this.wordsInGame) {
                this.endGame();
            } else if (this.word.length == 1) {
                this.selectWord();
            } else {
                this.word = this.word.slice(1);
            }
        }
        this.drawWord();
    }

    endGame() {
        this.endTime = performance.now();
        endSound.play();
        $("#wordDiv").hide();
        this.calculateAndShowScore();
    }

    calculateAndShowScore() {
        const totalChars = this.typeWords.join("").length;
        const timeMinutes = (this.endTime - this.startTime) / 60000;
        const wpm = (totalChars / 5) / timeMinutes;
        this.wpm = wpm.toFixed(2);
        $("#score").html(this.wpm + " WPM").show();
        this.showImageBasedOnSpeed(this.wpm);
        this.showChatMessage(this.wpm);
        this.saveResult();
    }

    showImageBasedOnSpeed(wpm) {
        let imageSrc = "";
        if (wpm <= 20) {
            imageSrc = "images/beginner.jpg";
        } else if (wpm <= 40) {
            imageSrc = "images/average.jpg";
        } else if (wpm <= 60) {
            imageSrc = "images/good.jpg";
        } else {
            imageSrc = "images/excellent.jpg";
        }
        $('#speedImage').attr("src", imageSrc).show();
    }

    showChatMessage(wpm) {
        let message = "";
        if (wpm <= 20) {
            message = `Tere, ${this.name}! Sinu trükkimiskiirus on: ${wpm} WPM. Tasub harjutada!`;
        } else if (wpm <= 40) {
            message = `Tubli, ${this.name}! Sinu trükkimiskiirus on: ${wpm} WPM. Võiks veel parem olla!`;
        } else if (wpm <= 60) {
            message = `Hea töö, ${this.name}! Sinu trükkimiskiirus on: ${wpm} WPM. Väga hästi!`;
        } else {
            message = `Suurepärane, ${this.name}! Sinu trükkimiskiirus on: ${wpm} WPM. Sa oled tõeline meister!`;
        }
        $('#chatMessage').html(message).show();
    }

    saveResult() {
        const totalChars = this.typeWords.join("").length;
        const timeMinutes = (this.endTime - this.startTime) / 60000;
        const wpm = timeMinutes > 0 ? (totalChars / 5) / timeMinutes : 0;
    
        const result = {
            name: this.name,
            wpm: wpm.toFixed(2),
            id: Date.now()
        };
    
        this.latestResultId = result.id;
        this.allResults.push(result);
    
        // Sorteeri ja salvesta
        this.allResults.sort((a, b) => parseFloat(b.wpm) - parseFloat(a.wpm));
        localStorage.setItem('typer', JSON.stringify(this.allResults));
    
        // Näita tulemusi ainult pärast sorteerimist
        this.showAllResults();
        this.saveToFile();
    }

    showAllResults() {
        $('#results').html("");
        for (let i = 0; i < this.allResults.length; i++) {
            const result = this.allResults[i];
            const name = result.name.trim() === "" ? "Nimetu" : result.name;
    
            let wpm = result.wpm;
            
            // Kui vana tulemus (score), teisenda see WPM-iks
            if (!wpm && result.score) {
                const totalChars = (this.wordsInGame * (this.startingWordLength + (this.wordsInGame - 1) / 2));
                const timeMinutes = parseFloat(result.score) / 60;
                wpm = (totalChars / 5) / timeMinutes;
                result.wpm = wpm.toFixed(2); // Uuenda andmed
            }
    
            $('#results').append(`
                <div class="result-card">
                    <h3>Tulemus ${i + 1}</h3>
                    <p><strong>Nimi:</strong> ${name}</p>
                    <p><strong>WPM:</strong> ${parseFloat(result.wpm).toFixed(2)}</p>
                </div>
            `);
        }
        $('#results').show();
    }
};
    

$(document).ready(function () {
    const typer = new Typer(playerName);

    $(document).keypress((event) => {
        if (typer && typeof typer.shortenWords === 'function') {
            typer.shortenWords(event.key);
        }
    });

    $('#resultsBtn').click(function () {
        $('#resultsModal').show();
        $('#resultsBtn').hide();
    });

    $('.close').click(function () {
        $('#resultsModal').hide();
        $('#resultsBtn').show();
    });

    window.onclick = function (event) {
        if (event.target.id === "resultsModal") {
            $('#resultsModal').hide();
            $('#resultsBtn').show();
        }
    };
});


function applySettings() {
    const textColor = localStorage.getItem('textColor') || 'white';
    const bgColor = localStorage.getItem('bgColor') || '#2f2f2f';
    const textSize = localStorage.getItem('textSize') || '16px';

    document.body.style.color = textColor;
    document.body.style.backgroundColor = bgColor;
    document.body.style.fontSize = textSize;
}

function setupSettingsMenu() {
    $('#settingsBtn').click(() => {
        $('#settingsModal').show();
    });

    $('.close-settings').click(() => {
        $('#settingsModal').hide();
    });

    $('#applySettings').click(() => {
        const textColor = $('#textColor').val();
        const bgColor = $('#bgColor').val();
        const textSize = $('#textSize').val();

        localStorage.setItem('textColor', textColor);
        localStorage.setItem('bgColor', bgColor);
        localStorage.setItem('textSize', textSize);

        applySettings();
        $('#settingsModal').hide();
    });
}

$(document).ready(function () {
    applySettings();
    setupSettingsMenu();
});