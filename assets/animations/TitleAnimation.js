const aboutTitles = [
    "Freelancer",
    "Designer",
    "Developer",
    "Traveler",
    "Problem solver"
];

let titlesTimer;
let titleTimer;

const animateTitle = (title, duration) => {
    var aboutTitleEl = document.getElementById("aboutTitle");

    clearInterval(titleTimer);

    let timeout = duration / (title.length + 1);

    let currentLetterIndex = 0;

    // console.log('title => ', title);
    // console.log('duration => ', duration);
    // console.log('timeout => ', timeout);

    aboutTitleEl.innerHTML = "";

    titleTimer = setInterval(() => {

        let currentLetter = title[currentLetterIndex];

        if (currentLetter) {
            // let spanEl = document.createElement('span');
            // spanEl.
            aboutTitleEl.append(currentLetter);
        }

        if (currentLetterIndex === title.length) {
            clearInterval(titleTimer);
        }

        currentLetterIndex += 1;

    }, timeout);
};


const startAboutTitlesAnimation = (duration) => {
    // let aboutTitleEl = document.getElementById("aboutTitle");

    let currentTitleIndex = 0;

    titlesTimer = setInterval(() => {

        if (currentTitleIndex === aboutTitles.length) {
            currentTitleIndex = 0;
        }

        let currentTitle = aboutTitles[currentTitleIndex];

        console.log(currentTitle);

        animateTitle(currentTitle, duration);

        // aboutTitleEl.textContent = aboutTitles[currentTitleIndex];
        currentTitleIndex += 1;

    }, duration + 100);
    
};


const stopAboutTitlesAnimation = () => {
    clearInterval(titlesTimer);
};