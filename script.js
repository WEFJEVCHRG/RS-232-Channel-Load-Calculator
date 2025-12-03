document.addEventListener('DOMContentLoaded', (event) => {
    const addRowButton = document.getElementById('addRowButton');
    const removeLastRowButton = document.getElementById('removeLastRowButton');
    const container = document.getElementById('inputRowsContainer');
    const form = document.getElementById('dataForm');

    function toggleRemoveButtonState() {
        const rowCount = container.children.length;
        removeLastRowButton.disabled = rowCount <= 1;
    }

    function addRow() {
        const newRow = document.createElement('tr');
        
        newRow.innerHTML = `
            <td>
                <input type="number" class="size-input" required min="0" placeholder="Байты">
            </td>
            <td>
                <input type="number" class="freq-input" required min="0" placeholder="Гц">
            </td>
        `;
        
        container.appendChild(newRow);
        toggleRemoveButtonState();
    }

    function removeLastRow() {
        const rowCount = container.children.length;
        if (rowCount > 1) {
            container.removeChild(container.lastChild);
        }
        toggleRemoveButtonState();
    }

    addRowButton.addEventListener('click', addRow);
    removeLastRowButton.addEventListener('click', removeLastRow);

    addRow();
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            sizeBytes: [],
            frequency: []
        };
        
        const sizeInputs = document.querySelectorAll('.size-input');
        const freqInputs = document.querySelectorAll('.freq-input');
        
        sizeInputs.forEach(input => {
            if (input.value.trim() !== '') {
                formData.sizeBytes.push(parseInt(input.value));
            }
        });
        
        freqInputs.forEach(input => {
            if (input.value.trim() !== '') {
                formData.frequency.push(parseInt(input.value));
            }
        });
        
        if (formData.sizeBytes.length === 0 || formData.frequency.length === 0) {
            alert('Пожалуйста, заполните все поля данных');
            return;
        }
        
        const overheads = parseInt(document.getElementById('overheads').value);
        const rs232Speed = parseInt(document.getElementById('rs232Speed').value);
        const stopBits = parseInt(document.getElementById('stopBits').value);
        const parityBit = parseInt(document.getElementById('parityBit').value);
        
        displayResults(formData, overheads, rs232Speed, stopBits, parityBit);
    });
});

    // Суммарное время = Σ[t(N) × Частота] для всех типов пакетов
    //Суммарное время = (время одного пакета × количество таких пакетов) + (время другого пакета × его количество) + ...
    //Свободное время = Измеряемое время - Суммарное время передачи
    //Процент загрузки = (Суммарное время передачи / Измеряемое время) × 100%
    
function displayResults(data, overheads, rs232Speed, stopBits, parityBit) {
    const BYTE_SIZE_BITS = 8;
    const totalBits = BYTE_SIZE_BITS + stopBits + parityBit;
    const MEASUREMENT_TIME = 1; 
    
    let totalTransmissionTime = 0;
    let totalFrequency = 0;
    let results = [];
    
    for (let i = 0; i < data.sizeBytes.length; i++) {
        const sizeBytes = data.sizeBytes[i];
        const frequency = data.frequency[i];
        const calculatedN = (sizeBytes + overheads) * totalBits;
        const tN = calculatedN / rs232Speed;
        
        const transmissionTimePerSecond = tN * frequency;
        
        totalFrequency += frequency;
        totalTransmissionTime += transmissionTimePerSecond;
        
        results.push({
            sizeBytes,
            frequency,
            calculatedN,
            tN,
            transmissionTimePerSecond
        });
    }
    

    const freeTime = MEASUREMENT_TIME - totalTransmissionTime;
    const loadPercentage = (totalTransmissionTime / MEASUREMENT_TIME) * 100;
    
    let html = `
        <div class="note">
            <h3>Параметры расчета:</h3>
            <p>Накладные расходы: <strong>${overheads} байт</strong></p>
            <p>Скорость RS-232: <strong>${rs232Speed} бит/с</strong></p>
            <p>Стоп-биты: <strong>${stopBits}</strong></p>
            <p>Бит четности: <strong>${parityBit === 1 ? 'Да' : 'Нет'}</strong></p>
            <p>Измеряемое время: <strong>${MEASUREMENT_TIME} сек</strong></p>
            <p>Используемая формула: <strong>(Размер + ${overheads}) × (${BYTE_SIZE_BITS} + ${stopBits} + ${parityBit})</strong></p>
            <p>Суммарное время передачи всех пакетов: <strong>${totalTransmissionTime.toFixed(6)} сек</strong></p>
            <p>Свободное время: <strong>${freeTime >= 0 ? freeTime.toFixed(6) : '0.000000'} сек</strong></p>
            <p>Процент загрузки: <strong>${loadPercentage.toFixed(2)} %</strong></p>
        </div>
        
        <h3>Результаты:</h3>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Размер (Б)</th>
                    <th>Частота (Гц)</th>
                    <th>Результат N (бит)</th>
                    <th>t(N) (сек)</th>
                    <th>Время передачи/сек</th>
                </tr>
            </thead>
            <tbody>`;
    
    for (let i = 0; i < results.length; i++) {
        html += `
            <tr>
                <td>${results[i].sizeBytes}</td>
                <td>${results[i].frequency}</td>
                <td><strong>${results[i].calculatedN}</strong></td>
                <td><strong>${results[i].tN.toFixed(6)}</strong></td>
                <td><strong>${results[i].transmissionTimePerSecond.toFixed(6)} сек</strong></td>
            </tr>`;
    }
    
    html += `</tbody></table>`;
    
    document.getElementById('resultsContainer').innerHTML = html;
}