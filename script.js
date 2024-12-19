document.getElementById('csvFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const cardCountDisplay = document.getElementById('cardCount');
    cardCountDisplay.textContent = "File selected. Starting file processing...";

    const reader = new FileReader();
    reader.onload = async function(e) {
        cardCountDisplay.textContent = "File loaded. Reading CSV data...";
        const csvData = e.target.result;
        const rows = csvData.split('\n').filter(row => row.trim() !== "");
        await generateIdCards(rows);

    };
    reader.readAsText(file);
});

let allCards = [];
let currentPage = 0;
const cardsPerPage = 10;

async function generateIdCards(rows) {
    const idCardContainer = document.getElementById('idCardContainer');
    idCardContainer.innerHTML = '';
    const headers = rows[0].split(',').map(header => header.trim());
    allCards = [];
    let logIndex = 0;
    const cardCountDisplay = document.getElementById('cardCount');
    cardCountDisplay.textContent = "CSV data parsed. Generating ID cards...";
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(value => value.trim());
        if (values.length === headers.length) {
            const employee = {};

            for (let j = 0; j < headers.length; j++) {
                employee[headers[j]] = values[j];
            }

            const idCard = document.createElement('div');
            idCard.classList.add('idCard');
            let cardInfo = `
                <div class="info">
                    <p>Name: ${employee.name}</p>
                    <p>HH ID: ${employee.hh_id}</p>
                    <p>Gender: ${employee.gender}</p>
                    <p>Phone: ${employee.phone}</p>
                    <p>Union: ${employee.union}</p>
                 </div>
                 <div class="qrcode" id="qrcode-${i}"></div>

            `;

            idCard.innerHTML = cardInfo;
            cardCountDisplay.textContent = `Generating QR code for entry ${i}...`;
            await new Promise(resolve => setTimeout(resolve, 10)); // Introduce a small delay for visual feedback
            new QRCode(idCard.querySelector('.qrcode'), {
                text: employee.hh_id,
                width: 120,
                height: 120,
            });
            allCards.push(idCard);

        } else {
            console.error(`Error: Invalid data in row ${i}`);
        }
    }
        cardCountDisplay.textContent = "All ID cards generated.";
        currentPage = 0;
        updateCardDisplay();
        updateNavigationButtons();
        console.log("Displaying cards 1-10...");
        setTimeout(() => {
             cardCountDisplay.textContent = "";
            updateCardCount();
        }, 1000);
}

function updateCardDisplay() {
    const idCardContainer = document.getElementById('idCardContainer');
    idCardContainer.innerHTML = '';

    const start = currentPage * cardsPerPage;
    const end = start + cardsPerPage;
    const cardsToDisplay = allCards.slice(start, end);

    cardsToDisplay.forEach(card => idCardContainer.appendChild(card));


}

function updateCardCount() {
    const cardCountDisplay = document.getElementById('cardCount');
    const start = (currentPage * cardsPerPage) + 1;
    const end = Math.min((currentPage + 1) * cardsPerPage, allCards.length);
    const message = `Showing cards from ${start} to ${end} of ${allCards.length}`
    cardCountDisplay.textContent = message;
    console.log(message)
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = (currentPage + 1) * cardsPerPage >= allCards.length;
}

document.getElementById('prevBtn').addEventListener('click', () => {
    console.log("Previous button clicked. Displaying previous set of cards...");
    currentPage--;
    updateCardDisplay();
    updateNavigationButtons();
    updateCardCount();
});

document.getElementById('nextBtn').addEventListener('click', () => {
    console.log("Next button clicked. Displaying next set of cards...");
    currentPage++;
    updateCardDisplay();
    updateNavigationButtons();
    updateCardCount();
});

document.getElementById('downloadPdf').addEventListener('click', function() {
    console.log("Initiating single page PDF download...");
    const element = document.getElementById('idCardContainer');
    html2pdf().from(element).save('beneficiary_id_cards.pdf').then(() => {
        console.log("Single page PDF download completed.")
    });

});
document.getElementById('pageCountInput').addEventListener('input', function() {
    let pageCount = this.value;
    if (pageCount < 1 || isNaN(pageCount)) {
        pageCount = 1;
        this.value = 1;
    }
    document.getElementById('downloadNextPagesBtn').textContent = `Download Next ${pageCount} Pages`
});

document.getElementById('downloadNextPagesBtn').addEventListener('click', async function() {
    console.log("Starting multiple page PDF download...");
    let pageCount = document.getElementById('pageCountInput').value;
    if (pageCount < 1 || isNaN(pageCount)) {
        pageCount = 1;
        document.getElementById('pageCountInput').value = 1;
    }
    for (let i = 0; i < pageCount; i++) {
        console.log(`Downloading PDF for page ${currentPage+1}`);
        const element = document.getElementById('idCardContainer');
        await html2pdf().from(element).save(`beneficiary_id_cards_page_${currentPage + 1}.pdf`);
        if ((currentPage + 1) * cardsPerPage < allCards.length) {
            currentPage++;
            updateCardDisplay();
            updateNavigationButtons();
             updateCardCount();
        }
    }
    console.log("Multiple page PDF download completed.");
});
